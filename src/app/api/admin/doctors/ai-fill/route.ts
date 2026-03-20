import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { revalidatePublicSite } from "@/lib/public-cache";
import { getSettingValue } from "@/lib/settings-store";
import {
  doctorAiFillInputSchema,
  doctorAiFillResultSchema,
  parsePayload,
  parseRequestJson,
} from "@/lib/validators";

const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_MAX_RETRIES = 2;

interface AiSettings {
  apiKey: string;
  model: string;
  hasEncryptedDbKeyButUnreadable: boolean;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getAiSettings(): Promise<AiSettings> {
  const [apiKeyFromDb, modelFromDb, rawApiKeyRow] = await Promise.all([
    getSettingValue("openRouterApiKey"),
    getSettingValue("openRouterModel"),
    prisma.siteSettings.findUnique({
      where: { key: "openRouterApiKey" },
      select: { value: true },
    }),
  ]);

  const apiKey = (apiKeyFromDb || process.env.OPENROUTER_API_KEY || "").trim();
  const hasEncryptedDbKeyButUnreadable =
    !apiKey &&
    typeof rawApiKeyRow?.value === "string" &&
    rawApiKeyRow.value.startsWith("enc:v1:");

  return {
    apiKey,
    model:
      modelFromDb || process.env.OPENROUTER_MODEL || "qwen/qwen3-vl-30b-a3b-thinking",
    hasEncryptedDbKeyButUnreadable,
  };
}

async function requestOpenRouter(params: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: params.model,
          messages: [
            {
              role: "user",
              content: params.prompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text();
      const shouldRetry = response.status >= 500 || response.status === 429;
      console.error(
        `[AI][Doctors] OpenRouter request failed with ${response.status}:`,
        errorText
      );

      if (!shouldRetry || attempt >= AI_MAX_RETRIES) {
        throw new ApiError("AI API request failed", {
          status: 502,
          code: "AI_UPSTREAM_ERROR",
        });
      }

      await delay(400 * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt >= AI_MAX_RETRIES) {
        break;
      }
      await delay(400 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new ApiError("AI API request failed", {
    status: 502,
    code: "AI_UPSTREAM_ERROR",
    cause: lastError,
  });
}

function extractJsonString(content: string) {
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0 || jsonEnd < jsonStart) {
    throw new ApiError("Failed to parse AI output", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }
  return content.slice(jsonStart, jsonEnd + 1);
}

function clampAiText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  const chars = Array.from(normalized);
  if (chars.length <= maxLength) {
    return normalized;
  }

  return chars.slice(0, maxLength).join("").trim();
}

function normalizeDoctorAiPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const source = payload as Record<string, unknown>;
  return {
    bio: clampAiText(source.bio, 4_000),
    education: clampAiText(source.education, 4_000),
    schedule: clampAiText(source.schedule, 200),
  };
}

export const POST = withAuth(async (request) => {
  const ai = await getAiSettings();

  if (!ai.apiKey) {
    const error = ai.hasEncryptedDbKeyButUnreadable
      ? "Ключ OpenRouter найден в БД, но не может быть расшифрован. Проверьте, что SETTINGS_ENCRYPTION_KEY задан и не меняется между перезапусками, затем сохраните ключ повторно в Настройках."
      : "OPENROUTER_API_KEY не настроен. Укажите ключ в Настройках.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const body = await parseRequestJson(request, doctorAiFillInputSchema);
  const prompt = `Ты редактор контента для сайта стоматологической клиники.
Используй только факты из входных данных.
Нельзя придумывать учебные заведения, сертификаты, категории, учёные степени, награды, должности, методики, направления лечения, стаж, график, даты и любые другие факты, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown:
{
  "bio": "2-4 предложения для карточки врача",
  "education": "аккуратно переписанные факты об образовании/квалификации или null",
  "schedule": "аккуратно переписанная заметка о графике или null"
}

Требования:
- Русский язык.
- Спокойный, профессиональный тон без рекламных обещаний.
- bio можно улучшить или переформулировать на основе name, speciality, experience и bio.
- education разрешено формировать только из поля education.
- schedule разрешено формировать только из поля schedule.

Входные данные:
${JSON.stringify(
  {
    name: body.name,
    speciality: body.speciality,
    experience: body.experience ?? null,
    bio: body.bio ?? null,
    education: body.education ?? null,
    schedule: body.schedule ?? null,
  },
  null,
  2
)}`;

  const aiData = await requestOpenRouter({
    apiKey: ai.apiKey,
    model: ai.model,
    prompt,
  });

  const content = aiData.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  let parsedJson: {
    bio?: string | null;
    education?: string | null;
    schedule?: string | null;
  };

  try {
    const rawPayload = JSON.parse(extractJsonString(content));
    const normalizedPayload = normalizeDoctorAiPayload(rawPayload);

    parsedJson = parsePayload(
      doctorAiFillResultSchema,
      normalizedPayload,
      "Failed to parse AI output"
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to parse AI output", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
      cause: error,
    });
  }

  revalidatePublicSite();
  return NextResponse.json(parsedJson);
});
