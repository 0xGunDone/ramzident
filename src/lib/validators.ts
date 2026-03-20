import { z } from "zod";
import { ApiError } from "./errors";

const MAX_LONG_TEXT = 20_000;

const requiredText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "Required field");

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value === undefined ? undefined : value.trim()));

const optionalNullableText = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    });

const integerLike = z.union([z.number(), z.string()]).transform((value, ctx) => {
  const parsed =
    typeof value === "number"
      ? value
      : value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expected integer value",
    });
    return z.NEVER;
  }
  return parsed;
});

const nonNegativeInt = integerLike.refine((value) => value >= 0, {
  message: "Expected non-negative integer",
});

const ratingValue = integerLike.refine((value) => value >= 1 && value <= 5, {
  message: "Rating must be from 1 to 5",
});

const booleanLike = z.union([z.boolean(), z.string(), z.number()]).transform((value, ctx) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off", ""].includes(normalized)) return false;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Expected boolean value",
  });
  return z.NEVER;
});

const reorderItemSchema = z.object({
  id: requiredText(191),
  order: nonNegativeInt,
});

const serviceFields = {
  title: requiredText(160),
  slug: optionalText(180),
  summary: optionalNullableText(500),
  description: optionalText(3_000),
  body: optionalNullableText(MAX_LONG_TEXT),
  priceFrom: optionalNullableText(120),
  duration: optionalNullableText(120),
  icon: optionalNullableText(80),
  badge: optionalNullableText(120),
  seoTitle: optionalNullableText(60),
  seoDescription: optionalNullableText(160),
  photoId: optionalNullableText(191),
  enabled: booleanLike.optional(),
};

export const serviceCreateSchema = z.object(serviceFields).strict();
export const serviceUpdateSchema = z
  .object({
    ...serviceFields,
    title: serviceFields.title.optional(),
    order: nonNegativeInt.optional(),
  })
  .strict();
export const serviceReorderSchema = z
  .object({
    services: z.array(reorderItemSchema).min(1),
  })
  .strict();

const doctorFields = {
  name: requiredText(160),
  slug: optionalText(180),
  speciality: optionalText(160),
  experience: optionalNullableText(160),
  bio: optionalNullableText(4_000),
  education: optionalNullableText(4_000),
  schedule: optionalNullableText(200),
  photoId: optionalNullableText(191),
  enabled: booleanLike.optional(),
};

export const doctorCreateSchema = z.object(doctorFields).strict();
export const doctorUpdateSchema = z
  .object({
    ...doctorFields,
    name: doctorFields.name.optional(),
    order: nonNegativeInt.optional(),
  })
  .strict();
export const doctorReorderSchema = z
  .object({
    doctors: z.array(reorderItemSchema).min(1),
  })
  .strict();

const documentFields = {
  title: requiredText(200),
  slug: optionalText(180),
  description: optionalNullableText(1_000),
  type: optionalText(120),
  fileId: optionalNullableText(191),
  enabled: booleanLike.optional(),
};

export const documentCreateSchema = z.object(documentFields).strict();
export const documentUpdateSchema = z
  .object({
    ...documentFields,
    title: documentFields.title.optional(),
    order: nonNegativeInt.optional(),
  })
  .strict();
export const documentReorderSchema = z
  .object({
    documents: z.array(reorderItemSchema).min(1),
  })
  .strict();

export const faqCreateSchema = z
  .object({
    question: requiredText(500),
    answer: requiredText(MAX_LONG_TEXT),
    enabled: booleanLike.optional(),
  })
  .strict();

export const faqUpdateSchema = z
  .object({
    question: optionalText(500),
    answer: optionalText(MAX_LONG_TEXT),
    enabled: booleanLike.optional(),
    order: nonNegativeInt.optional(),
  })
  .strict();

export const faqReorderSchema = z
  .object({
    items: z.array(reorderItemSchema).min(1),
  })
  .strict();

const testimonialFields = {
  author: optionalText(160),
  role: optionalNullableText(160),
  quote: requiredText(4_000),
  rating: ratingValue.optional(),
  source: optionalNullableText(240),
  enabled: booleanLike.optional(),
};

export const testimonialCreateSchema = z.object(testimonialFields).strict();
export const testimonialUpdateSchema = z
  .object({
    ...testimonialFields,
    quote: testimonialFields.quote.optional(),
    order: nonNegativeInt.optional(),
  })
  .strict();

export const testimonialReorderSchema = z
  .object({
    testimonials: z.array(reorderItemSchema).min(1),
  })
  .strict();

export const sectionUpdateSchema = z
  .object({
    title: optionalNullableText(200),
    enabled: booleanLike.optional(),
    content: optionalNullableText(MAX_LONG_TEXT),
  })
  .strict();

export const sectionReorderSchema = z
  .object({
    sections: z
      .array(
        z.object({
          ...reorderItemSchema.shape,
          enabled: booleanLike.optional(),
        })
      )
      .min(1),
  })
  .strict();

export const mediaMetadataUpdateSchema = z
  .object({
    label: optionalNullableText(240),
    altText: optionalNullableText(180),
    seoTitle: optionalNullableText(60),
    seoDescription: optionalNullableText(160),
    context: optionalNullableText(1_000),
    usage: optionalNullableText(120),
    usedBy: optionalNullableText(120),
  })
  .strict();

export const settingsUpdateSchema = z
  .object({
    clinicName: optionalText(180),
    phone: optionalText(80),
    phoneRaw: optionalText(40),
    email: optionalText(180),
    address: optionalText(300),
    city: optionalText(120),
    region: optionalText(120),
    postalCode: optionalText(20),
    workHoursWeekdays: optionalText(60),
    workHoursWeekend: optionalText(60),
    mapCenterLat: optionalText(32),
    mapCenterLng: optionalText(32),
    mapPinLat: optionalText(32),
    mapPinLng: optionalText(32),
    mapZoom: optionalText(8),
    yandexMapsApiKey: optionalText(512),
    yandexMetrikaId: optionalText(32),
    googleAnalyticsId: optionalText(32),
    copyrightText: optionalText(300),
    creatorName: optionalText(120),
    creatorUrl: optionalText(300),
    openRouterApiKey: optionalText(1_024),
    openRouterModel: optionalText(120),
    clearOpenRouterApiKey: booleanLike.optional(),
  })
  .strict();

export const aiSeoResultSchema = z
  .object({
    altText: optionalNullableText(100),
    seoTitle: optionalNullableText(60),
    seoDescription: optionalNullableText(160),
  })
  .strip();

export function parsePayload<T>(schema: z.ZodType<T>, payload: unknown, message = "Invalid request payload"): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(message, {
      status: 400,
      code: "VALIDATION_ERROR",
      details: parsed.error.flatten(),
    });
  }

  return parsed.data;
}

export async function parseRequestJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  message = "Invalid request payload"
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    throw new ApiError("Malformed JSON payload", {
      status: 400,
      code: "INVALID_JSON",
      cause: error,
    });
  }

  return parsePayload(schema, payload, message);
}
