import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { getSettingValue } from "@/lib/settings-store";
import { parseRequestJson } from "@/lib/validators";

const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_MAX_RETRIES = 2;

interface AiSettings {
  apiKey: string;
  model: string;
  hasEncryptedDbKeyButUnreadable: boolean;
}

type JsonRecord = Record<string, unknown>;

const nullableShortText = z.union([z.string().max(500), z.null()]).optional();
const nullableLongText = z.union([z.string().max(20_000), z.null()]).optional();

const serviceDraftPayloadSchema = z
  .object({
    title: z.string().max(160),
    summary: nullableShortText,
    description: nullableLongText,
    body: nullableLongText,
    priceFrom: z.union([z.string().max(120), z.null()]).optional(),
    duration: z.union([z.string().max(120), z.null()]).optional(),
    badge: z.union([z.string().max(120), z.null()]).optional(),
    seoTitle: z.union([z.string().max(60), z.null()]).optional(),
    seoDescription: z.union([z.string().max(160), z.null()]).optional(),
  })
  .strict();

const documentDraftPayloadSchema = z
  .object({
    title: z.union([z.string().max(200), z.null()]).optional(),
    description: z.union([z.string().max(1_000), z.null()]).optional(),
    type: z.union([z.string().max(120), z.null()]).optional(),
    file: z
      .object({
        label: z.union([z.string().max(240), z.null()]).optional(),
        path: z.string().max(1_000),
        mimeType: z.union([z.string().max(120), z.null()]).optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

const faqDraftPayloadSchema = z
  .object({
    question: z.union([z.string().max(500), z.null()]).optional(),
    answer: z.union([z.string().max(20_000), z.null()]).optional(),
  })
  .strict();

const testimonialDraftPayloadSchema = z
  .object({
    author: z.union([z.string().max(160), z.null()]).optional(),
    role: z.union([z.string().max(160), z.null()]).optional(),
    quote: z.union([z.string().max(4_000), z.null()]).optional(),
    source: z.union([z.string().max(240), z.null()]).optional(),
    rating: z.union([z.number().int().min(1).max(5), z.null()]).optional(),
  })
  .strict();

const genericContentSchema = z.object({}).catchall(z.unknown());

const sectionDraftPayloadSchema = z
  .object({
    sectionType: z.enum([
      "hero",
      "about",
      "services",
      "doctors",
      "gallery",
      "testimonials",
      "faq",
      "documents",
      "contacts",
    ]),
    sectionTitle: z.union([z.string().max(200), z.null()]).optional(),
    content: genericContentSchema.optional(),
  })
  .strict();

const aiDraftRequestSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("service"), payload: serviceDraftPayloadSchema }).strict(),
    z.object({ kind: z.literal("document"), payload: documentDraftPayloadSchema }).strict(),
    z.object({ kind: z.literal("faq"), payload: faqDraftPayloadSchema }).strict(),
    z
      .object({
        kind: z.literal("testimonial"),
        payload: testimonialDraftPayloadSchema,
    })
      .strict(),
    z.object({ kind: z.literal("section"), payload: sectionDraftPayloadSchema }).strict(),
  ]);

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
        `[AI][AdminDraft] OpenRouter request failed with ${response.status}:`,
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSingleLineText(
  value: unknown,
  maxLength: number
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const chars = Array.from(normalized);
  return chars.slice(0, maxLength).join("").trim();
}

function normalizeMultilineText(
  value: unknown,
  maxLength: number
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return null;

  const chars = Array.from(normalized);
  return chars.slice(0, maxLength).join("").trim();
}

function normalizeStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const rawItems = Array.isArray(value) ? value : [value];
  const items = Array.from(
    new Set(
      rawItems
        .flatMap((item) =>
          typeof item === "string" ? item.split(/[\n,;]+/) : [String(item)]
        )
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .map((item) => Array.from(item).slice(0, maxItemLength).join("").trim())
        .filter(Boolean)
    )
  ).slice(0, maxItems);

  return items.length > 0 ? items : null;
}

function buildServicePrompt(payload: z.infer<typeof serviceDraftPayloadSchema>) {
  return `Ты редактор сайта стоматологической клиники.
Подготовь аккуратный текстовый черновик для страницы услуги.
Используй только факты из входных данных.
Нельзя придумывать цены, длительность, оборудование, врачей, обещания результата, противопоказания, этапы лечения и любые другие факты, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown:
{
  "summary": "краткое описание карточки до 500 символов или null",
  "description": "основное короткое описание услуги до 3000 символов или null",
  "body": "развёрнутый текст страницы услуги в 2-4 абзаца или null",
  "badge": "короткий бейдж 1-3 слова или null",
  "seoTitle": "SEO title до 60 символов или null",
  "seoDescription": "SEO description до 160 символов или null"
}

Требования:
- Русский язык.
- Спокойный, профессиональный тон без агрессивной рекламы.
- summary и description можно улучшать и переписывать на основе title, summary, description, body, priceFrom, duration, badge.
- body должен быть plain text без markdown-разметки.
- seoTitle и seoDescription должны быть полезными и естественными, без переспама.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
}

function buildDocumentPrompt(payload: z.infer<typeof documentDraftPayloadSchema>) {
  return `Ты редактор контента для раздела документов на сайте стоматологической клиники.
Нужно подготовить аккуратный черновик карточки документа.
Используй только факты из входных данных.
Нельзя придумывать номера лицензий, даты, юридический статус документа, кем и когда он утверждён, состав приложений и любые другие факты, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown:
{
  "title": "название документа или null",
  "description": "краткое пояснение к документу до 1000 символов или null",
  "type": "короткий тип документа или null"
}

Требования:
- Русский язык.
- Нейтральный деловой тон.
- description должна быть понятной пользователю и не содержать вымышленных деталей.
- type можно менять только если это прямо следует из title, description или метаданных файла. Иначе верни null.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
}

function buildFaqPrompt(payload: z.infer<typeof faqDraftPayloadSchema>) {
  return `Ты редактор FAQ для сайта стоматологической клиники.
Помоги аккуратно переписать вопрос и ответ.
Используй только факты из входных данных.
Нельзя придумывать цены, акции, режим работы, адрес, контакты, медицинские рекомендации и организационные правила, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown:
{
  "question": "короткий и понятный вопрос или null",
  "answer": "спокойный и точный ответ без выдуманных деталей или null"
}

Требования:
- Русский язык.
- question должен быть естественным и коротким.
- answer можно улучшить по стилю и структуре, но нельзя добавлять новые факты.
- Если во входных данных нет достаточно материала для ответа, верни answer: null.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
}

function buildTestimonialPrompt(payload: z.infer<typeof testimonialDraftPayloadSchema>) {
  return `Ты редактор блока отзывов для сайта стоматологической клиники.
Подготовь аккуратный черновик отзыва для публикации.
Используй только факты из входных данных.
Нельзя придумывать имя пациента, диагноз, длительность лечения, процедуры, обещания результата и любые другие факты, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown:
{
  "role": "короткая подпись к отзыву или null",
  "quote": "аккуратно отредактированный текст отзыва или null"
}

Требования:
- Русский язык.
- quote должен звучать естественно и по-человечески.
- Можно исправить повторения и сделать текст чище, но нельзя менять смысл.
- role разрешено формировать только из имеющегося role, source, author и quote без выдуманных регалий.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
}

function buildSectionPrompt(payload: z.infer<typeof sectionDraftPayloadSchema>) {
  const baseHeader = `Ты редактор главной страницы сайта стоматологической клиники.
Подготовь текстовый черновик для секции.
Используй только факты из входных данных.
Нельзя придумывать цены, цифры, юридические факты, адреса, режим работы, количество врачей, рейтинги, отзывы, ссылки и любые другие данные, которых нет во входных данных.
Если данных для поля недостаточно, верни null.
Верни строго JSON без markdown.`;

  switch (payload.sectionType) {
    case "hero":
      return `${baseHeader}
Формат ответа:
{
  "sectionTitle": "заголовок секции или null",
  "content": {
    "eyebrow": "короткая плашка или null",
    "title": "главный заголовок hero или null",
    "accent": "акцентная строка или null",
    "description": "основное описание hero или null",
    "primaryLabel": "подпись основной кнопки или null",
    "secondaryLabel": "подпись второй кнопки или null",
    "badges": ["короткие бейджи"] или null
  }
}

Требования:
- badges: до 6 коротких пунктов.
- Не меняй trustItems, ссылки и изображения.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
    case "about":
      return `${baseHeader}
Формат ответа:
{
  "sectionTitle": "заголовок секции или null",
  "content": {
    "description": "вводное описание секции или null",
    "paragraphs": ["2-4 абзаца о клинике"] или null,
    "highlights": ["короткие преимущества"] или null
  }
}

Требования:
- Не меняй изображения.
- paragraphs: до 4 абзацев.
- highlights: до 6 коротких пунктов.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
    case "testimonials":
      return `${baseHeader}
Формат ответа:
{
  "sectionTitle": "заголовок секции или null",
  "content": {
    "sourceLabel": "подпись источника или null"
  }
}

Требования:
- Не меняй sourceUrl.
- Не придумывай новый источник.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
    default:
      return `${baseHeader}
Формат ответа:
{
  "sectionTitle": "заголовок секции или null",
  "content": {
    "description": "описание секции или null"
  }
}

Требования:
- Не меняй ссылки, изображения, файлы и другие структурные поля.

Входные данные:
${JSON.stringify(payload, null, 2)}`;
  }
}

function sanitizeServiceDraft(payload: unknown) {
  if (!isRecord(payload)) {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  return {
    summary: normalizeSingleLineText(payload.summary, 500),
    description: normalizeSingleLineText(payload.description, 3_000),
    body: normalizeMultilineText(payload.body, 20_000),
    badge: normalizeSingleLineText(payload.badge, 120),
    seoTitle: normalizeSingleLineText(payload.seoTitle, 60),
    seoDescription: normalizeSingleLineText(payload.seoDescription, 160),
  };
}

function sanitizeDocumentDraft(payload: unknown) {
  if (!isRecord(payload)) {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  return {
    title: normalizeSingleLineText(payload.title, 200),
    description: normalizeSingleLineText(payload.description, 1_000),
    type: normalizeSingleLineText(payload.type, 120),
  };
}

function sanitizeFaqDraft(payload: unknown) {
  if (!isRecord(payload)) {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  return {
    question: normalizeSingleLineText(payload.question, 500),
    answer: normalizeMultilineText(payload.answer, 20_000),
  };
}

function sanitizeTestimonialDraft(payload: unknown) {
  if (!isRecord(payload)) {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  return {
    role: normalizeSingleLineText(payload.role, 160),
    quote: normalizeMultilineText(payload.quote, 4_000),
  };
}

function sanitizeSectionDraft(
  payload: unknown,
  sectionType: z.infer<typeof sectionDraftPayloadSchema>["sectionType"]
) {
  if (!isRecord(payload)) {
    throw new ApiError("Invalid AI response", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
    });
  }

  const content = isRecord(payload.content) ? payload.content : {};
  const sectionTitle = normalizeSingleLineText(payload.sectionTitle, 200);

  switch (sectionType) {
    case "hero":
      return {
        sectionTitle,
        content: {
          eyebrow: normalizeSingleLineText(content.eyebrow, 120),
          title: normalizeSingleLineText(content.title, 200),
          accent: normalizeSingleLineText(content.accent, 220),
          description: normalizeMultilineText(content.description, 1_500),
          primaryLabel: normalizeSingleLineText(content.primaryLabel, 80),
          secondaryLabel: normalizeSingleLineText(content.secondaryLabel, 80),
          badges: normalizeStringArray(content.badges, 6, 80),
        },
      };
    case "about":
      return {
        sectionTitle,
        content: {
          description: normalizeMultilineText(content.description, 1_500),
          paragraphs: normalizeStringArray(content.paragraphs, 4, 700),
          highlights: normalizeStringArray(content.highlights, 6, 180),
        },
      };
    case "testimonials":
      return {
        sectionTitle,
        content: {
          sourceLabel: normalizeSingleLineText(content.sourceLabel, 120),
        },
      };
    default:
      return {
        sectionTitle,
        content: {
          description: normalizeMultilineText(content.description, 1_500),
        },
      };
  }
}

export const POST = withAuth(async (request) => {
  const ai = await getAiSettings();

  if (!ai.apiKey) {
    const error = ai.hasEncryptedDbKeyButUnreadable
      ? "Ключ OpenRouter найден в БД, но не может быть расшифрован. Проверьте, что SETTINGS_ENCRYPTION_KEY задан и не меняется между перезапусками, затем сохраните ключ повторно в Настройках."
      : "OPENROUTER_API_KEY не настроен. Укажите ключ в Настройках.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const body = await parseRequestJson(request, aiDraftRequestSchema);

  let prompt = "";

  switch (body.kind) {
    case "service":
      prompt = buildServicePrompt(body.payload);
      break;
    case "document":
      prompt = buildDocumentPrompt(body.payload);
      break;
    case "faq":
      prompt = buildFaqPrompt(body.payload);
      break;
    case "testimonial":
      prompt = buildTestimonialPrompt(body.payload);
      break;
    case "section":
      prompt = buildSectionPrompt(body.payload);
      break;
    default:
      throw new ApiError("Unsupported AI draft kind", {
        status: 400,
        code: "AI_UNSUPPORTED_KIND",
      });
  }

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

  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(extractJsonString(content));
  } catch (error) {
    throw new ApiError("Failed to parse AI output", {
      status: 502,
      code: "AI_INVALID_RESPONSE",
      cause: error,
    });
  }

  switch (body.kind) {
    case "service":
      return NextResponse.json(sanitizeServiceDraft(rawPayload));
    case "document":
      return NextResponse.json(sanitizeDocumentDraft(rawPayload));
    case "faq":
      return NextResponse.json(sanitizeFaqDraft(rawPayload));
    case "testimonial":
      return NextResponse.json(sanitizeTestimonialDraft(rawPayload));
    case "section":
      return NextResponse.json(sanitizeSectionDraft(rawPayload, body.payload.sectionType));
    default:
      throw new ApiError("Unsupported AI draft kind", {
        status: 400,
        code: "AI_UNSUPPORTED_KIND",
      });
  }
});
