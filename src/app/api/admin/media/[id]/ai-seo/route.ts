import path from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { getSettingValue } from "@/lib/settings-store";
import { aiSeoResultSchema, parsePayload } from "@/lib/validators";
import { revalidatePublicSite } from "@/lib/public-cache";

const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_MAX_RETRIES = 2;
const AI_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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
    model: modelFromDb || process.env.OPENROUTER_MODEL || "qwen/qwen3-vl-30b-a3b-thinking",
    hasEncryptedDbKeyButUnreadable,
  };
}

async function optimizeImageForAi(fileBuffer: Buffer, mimeType: string) {
  if (mimeType === "image/svg+xml") {
    if (fileBuffer.byteLength > AI_MAX_IMAGE_BYTES) {
      throw new ApiError(
        "Изображение слишком большое для AI анализа. Загрузите файл меньшего размера.",
        { status: 413, code: "AI_IMAGE_TOO_LARGE" }
      );
    }

    return {
      buffer: fileBuffer,
      mimeType,
    };
  }

  try {
    const optimized = await sharp(fileBuffer)
      .rotate()
      .resize({
        width: 1_280,
        withoutEnlargement: true,
      })
      .webp({
        quality: 70,
      })
      .toBuffer();

    if (optimized.byteLength > AI_MAX_IMAGE_BYTES) {
      throw new ApiError(
        "Изображение слишком большое для AI анализа. Загрузите файл меньшего размера.",
        { status: 413, code: "AI_IMAGE_TOO_LARGE" }
      );
    }

    return {
      buffer: optimized,
      mimeType: "image/webp",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (fileBuffer.byteLength > AI_MAX_IMAGE_BYTES) {
      throw new ApiError(
        "Изображение слишком большое для AI анализа. Загрузите файл меньшего размера.",
        { status: 413, code: "AI_IMAGE_TOO_LARGE" }
      );
    }

    return {
      buffer: fileBuffer,
      mimeType,
    };
  }
}

async function requestOpenRouter(params: {
  apiKey: string;
  model: string;
  content: Array<{ type: string; text?: string; image_url?: { url: string } }>;
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
              content: params.content,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      const errorText = await response.text();
      const shouldRetry = response.status >= 500 || response.status === 429;
      console.error(
        `[AI] OpenRouter request failed with ${response.status}:`,
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

function normalizeAiSeoPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const source = payload as Record<string, unknown>;
  return {
    altText: clampAiText(source.altText, 100),
    seoTitle: clampAiText(source.seoTitle, 60),
    seoDescription: clampAiText(source.seoDescription, 160),
  };
}

export const POST = withAuth(async (_request, context) => {
  const ai = await getAiSettings();

  if (!ai.apiKey) {
    const error = ai.hasEncryptedDbKeyButUnreadable
      ? "Ключ OpenRouter найден в БД, но не может быть расшифрован. Проверьте одинаковые SETTINGS_ENCRYPTION_KEY/NEXTAUTH_SECRET на сервере и сохраните ключ повторно в Настройках."
      : "OPENROUTER_API_KEY не настроен. Укажите ключ в Настройках.";
    return NextResponse.json(
      { error },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const media = await prisma.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  if (!media.mimeType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only images are supported for AI SEO" },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "public", media.path);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch (error) {
    throw new ApiError("Media file not found on disk", {
      status: 404,
      code: "MEDIA_FILE_NOT_FOUND",
      cause: error,
    });
  }
  const optimized = await optimizeImageForAi(fileBuffer, media.mimeType);
  const base64Image = optimized.buffer.toString("base64");
  const dataUrl = `data:${optimized.mimeType};base64,${base64Image}`;

  const contextPrompt = media.context
    ? `Контекст использования изображения: ${media.context}. `
    : "Изображение для сайта стоматологической клиники. ";

  const systemPrompt = `Ты эксперт по SEO для медицинских сайтов. Опиши это изображение для alt, title и description.
Верни результат строго JSON без markdown-обертки:
{
  "altText": "краткое описание для alt до 100 символов",
  "seoTitle": "заголовок изображения до 60 символов",
  "seoDescription": "описание для поисковых систем до 160 символов"
}`;

  const aiData = await requestOpenRouter({
    apiKey: ai.apiKey,
    model: ai.model,
    content: [
      { type: "text", text: `${systemPrompt}\n${contextPrompt}` },
      { type: "image_url", image_url: { url: dataUrl } },
    ],
  });

  const content = aiData.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  let parsedJson: {
    altText?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };

  try {
    const rawPayload = JSON.parse(extractJsonString(content));
    const normalizedPayload = normalizeAiSeoPayload(rawPayload);

    parsedJson = parsePayload(
      aiSeoResultSchema,
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

  const updatedMedia = await prisma.media.update({
    where: { id },
    data: {
      altText: parsedJson.altText ?? null,
      seoTitle: parsedJson.seoTitle ?? null,
      seoDescription: parsedJson.seoDescription ?? null,
    },
  });

  revalidatePublicSite();
  return NextResponse.json(updatedMedia);
});
