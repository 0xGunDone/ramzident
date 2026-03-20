const OG_ROOT = "/og";

export const STATIC_OG_PATHS = {
  home: `${OG_ROOT}/site.jpg`,
  servicesIndex: `${OG_ROOT}/services.jpg`,
  documentsIndex: `${OG_ROOT}/documents.jpg`,
  notFound: `${OG_ROOT}/404.jpg`,
} as const;

function toVersionToken(value: Date | number | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return String(value.getTime());
  }

  if (typeof value === "number") {
    return String(value);
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? encodeURIComponent(value) : String(parsed);
}

export function versionOgAsset(
  publicPath: string,
  version: Date | number | string | null | undefined
) {
  const token = toVersionToken(version);
  if (!token) {
    return publicPath;
  }

  return `${publicPath}?v=${token}`;
}

export function getServiceStaticOgPath(slug: string) {
  return `${OG_ROOT}/services/${slug}.jpg`;
}

export function getDocumentStaticOgPath(slug: string) {
  return `${OG_ROOT}/documents/${slug}.jpg`;
}

export function getNotFoundStaticOgPath() {
  return STATIC_OG_PATHS.notFound;
}

export function getServiceStaticOgPathWithVersion(service: {
  slug: string;
  updatedAt: Date;
}) {
  return versionOgAsset(getServiceStaticOgPath(service.slug), service.updatedAt);
}

export function getDocumentStaticOgPathWithVersion(
  document: {
    slug: string;
    updatedAt: Date;
  }
) {
  return versionOgAsset(getDocumentStaticOgPath(document.slug), document.updatedAt);
}
