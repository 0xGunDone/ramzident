export interface MediaItem {
  id: string;
  filename: string;
  label: string | null;
  path: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  mimeType: string;
  altText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  context: string | null;
  usage: string | null;
  usedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  body: string | null;
  priceFrom: string | null;
  duration: string | null;
  icon: string | null;
  badge: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  photoId: string | null;
  photo?: MediaItem | null;
  order: number;
  enabled: boolean;
}

export interface DoctorItem {
  id: string;
  name: string;
  slug: string;
  speciality: string;
  experience: string | null;
  bio: string | null;
  education: string | null;
  schedule: string | null;
  focusAreas: string | null;
  bestFor: string | null;
  careStyle: string | null;
  photoId: string | null;
  photo?: MediaItem | null;
  order: number;
  enabled: boolean;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number;
  source: string | null;
  order: number;
  enabled: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  enabled: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  fileId: string | null;
  file?: MediaItem | null;
  order: number;
  enabled: boolean;
}

export interface SectionItem {
  id: string;
  type: string;
  title: string | null;
  order: number;
  enabled: boolean;
  content: string | null;
}

export interface SiteSettingsMap {
  [key: string]: string;
}

export interface ReorderPayload {
  id: string;
  order: number;
}

export interface MediaOption {
  id: string;
  label: string | null;
  path: string;
  mimeType?: string;
}

export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_UPLOAD_SIZE_ERROR = `Файл слишком большой. Максимум — ${MAX_UPLOAD_SIZE_MB} МБ.`;
