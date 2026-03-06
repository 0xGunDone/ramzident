import path from "node:path";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import type { Service, SiteDocument } from "@prisma/client";
import sharp from "sharp";
import { getOgFonts } from "./og-fonts";
import {
  getDocumentStaticOgPath,
  getServiceStaticOgPath,
  STATIC_OG_PATHS,
  versionOgAsset,
} from "./og-paths";
import { prisma } from "./prisma";
import { env, siteConfig } from "./env";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_QUALITY = 88;
const OG_ROOT = "/og";

type SiteSettingsMap = Record<string, string>;

type OgRenderableService = Pick<
  Service,
  | "slug"
  | "title"
  | "summary"
  | "description"
  | "priceFrom"
  | "duration"
  | "seoTitle"
  | "seoDescription"
  | "enabled"
  | "updatedAt"
>;

type OgRenderableDocument = Pick<
  SiteDocument,
  "slug" | "title" | "description" | "type" | "fileId" | "enabled" | "updatedAt"
>;

interface ResolvedSiteSettings {
  clinicName: string;
  phone: string;
  city: string;
  workHoursWeekdays: string;
}

interface OgCardInput {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: string;
  tags?: string[];
}

function getPublicAbsolutePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
}

function getSiteHost() {
  try {
    return new URL(env.siteUrl).hostname.replace(/^www\./, "");
  } catch {
    return "ramzident.ru";
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  const normalized = normalizeSpaces(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function splitIntoLines(value: string, maxCharsPerLine: number, maxLines: number) {
  const words = normalizeSpaces(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      if (lines.length === maxLines) {
        return lines;
      }
    }

    if (word.length > maxCharsPerLine) {
      lines.push(truncateText(word, maxCharsPerLine));
      current = "";
    } else {
      current = word;
    }

    if (lines.length === maxLines) {
      return lines;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (words.length > 0 && lines.length === maxLines) {
    lines[maxLines - 1] = truncateText(lines[maxLines - 1], maxCharsPerLine);
  }

  return lines;
}

function renderTextBlock(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  color: string,
  weight: 400 | 700 = 700
) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Ramzi OG" font-size="${fontSize}" font-weight="${weight}">${lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("")}</text>`;
}

async function getEmbeddedFontCss() {
  const fonts = await getOgFonts();

  const regularSources = fonts
    .filter((font) => font.weight === 400)
    .map(
      (font) =>
        `url(data:font/woff;base64,${Buffer.from(font.data).toString("base64")}) format('woff')`
    )
    .join(", ");

  const boldSources = fonts
    .filter((font) => font.weight === 700)
    .map(
      (font) =>
        `url(data:font/woff;base64,${Buffer.from(font.data).toString("base64")}) format('woff')`
    )
    .join(", ");

  return `
    @font-face {
      font-family: 'Ramzi OG';
      src: ${regularSources};
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: 'Ramzi OG';
      src: ${boldSources};
      font-style: normal;
      font-weight: 700;
    }
  `;
}

async function createOgSvg({
  eyebrow,
  title,
  description,
  accent,
  tags = [],
}: OgCardInput) {
  const fontCss = await getEmbeddedFontCss();
  const titleLines = splitIntoLines(truncateText(title, 96), 24, accent ? 2 : 3);
  const accentLines = accent ? splitIntoLines(truncateText(accent, 72), 24, 1) : [];
  const descriptionLines = description
    ? splitIntoLines(truncateText(description, 180), 58, 3)
    : [];
  const visibleTags = tags.map(normalizeSpaces).filter(Boolean).slice(0, 3);
  const host = escapeXml(getSiteHost());

  const titleBlock = renderTextBlock(titleLines, 72, 232, 68, 78, "#102e35", 700);
  const accentBlock = accentLines.length
    ? renderTextBlock(accentLines, 72, 232 + titleLines.length * 78, 68, 78, "#b99858", 700)
    : "";

  const descriptionY = accentLines.length
    ? 232 + titleLines.length * 78 + accentLines.length * 78 + 28
    : 232 + titleLines.length * 78 + 28;
  const descriptionBlock = descriptionLines.length
    ? renderTextBlock(descriptionLines, 72, descriptionY, 28, 40, "#5f767b", 400)
    : "";

  const eyebrowMarkup = eyebrow
    ? `<g>
        <rect x="914" y="58" rx="26" ry="26" width="214" height="54" fill="rgba(255,255,255,0.72)" stroke="rgba(185,152,88,0.24)" />
        <text x="1021" y="92" text-anchor="middle" fill="#b99858" font-family="Ramzi OG" font-size="15" font-weight="700" letter-spacing="2.2">${escapeXml(
          truncateText(eyebrow.toUpperCase(), 28)
        )}</text>
      </g>`
    : "";

  const tagMarkup = visibleTags
    .map((tag, index) => {
      const x = 72 + index * 220;
      return `
        <g>
          <rect x="${x}" y="540" rx="22" ry="22" width="200" height="44" fill="rgba(255,255,255,0.74)" stroke="rgba(16,46,53,0.1)" />
          <text x="${x + 20}" y="568" fill="#24454d" font-family="Ramzi OG" font-size="18" font-weight="400">${escapeXml(
            truncateText(tag, 26)
          )}</text>
        </g>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
      <style>${fontCss}</style>
      <defs>
        <radialGradient id="orb-gold" cx="0.18" cy="0.12" r="0.42">
          <stop offset="0%" stop-color="rgba(201,176,113,0.22)" />
          <stop offset="100%" stop-color="rgba(201,176,113,0)" />
        </radialGradient>
        <radialGradient id="orb-ink" cx="0.86" cy="0.18" r="0.32">
          <stop offset="0%" stop-color="rgba(23,60,67,0.18)" />
          <stop offset="100%" stop-color="rgba(23,60,67,0)" />
        </radialGradient>
        <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8f3ea" />
          <stop offset="100%" stop-color="#f0e6d8" />
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="120" cy="86" r="210" fill="url(#orb-gold)" />
      <circle cx="1080" cy="560" r="180" fill="rgba(23,60,67,0.12)" />
      <circle cx="1030" cy="120" r="160" fill="url(#orb-ink)" />

      <g>
        <rect x="72" y="56" rx="18" ry="18" width="52" height="52" fill="rgba(255,255,255,0.72)" stroke="rgba(16,46,53,0.12)" />
        <text x="98" y="90" text-anchor="middle" fill="#b99858" font-family="Ramzi OG" font-size="22" font-weight="700">R</text>
        <text x="140" y="90" fill="#102e35" font-family="Ramzi OG" font-size="34" font-weight="700">Рамзи Дент</text>
        <text x="140" y="112" fill="#b99858" font-family="Ramzi OG" font-size="13" font-weight="700" letter-spacing="3.6">СТОМАТОЛОГИЧЕСКАЯ КЛИНИКА</text>
      </g>

      ${eyebrowMarkup}
      ${titleBlock}
      ${accentBlock}
      ${descriptionBlock}
      ${tagMarkup}

      <g>
        <rect x="964" y="534" rx="24" ry="24" width="164" height="50" fill="#102e35" />
        <text x="1046" y="565" text-anchor="middle" fill="#ffffff" font-family="Ramzi OG" font-size="18" font-weight="700">${host}</text>
      </g>
    </svg>
  `;
}

async function renderStaticOgImage(publicPath: string, card: OgCardInput) {
  const svg = await createOgSvg(card);
  const absolutePath = getPublicAbsolutePath(publicPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await sharp(Buffer.from(svg))
    .jpeg({
      quality: OG_QUALITY,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(absolutePath);
}

async function getSiteSettingsMap() {
  const items = await prisma.siteSettings.findMany();
  return items.reduce<SiteSettingsMap>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

async function getResolvedSiteSettings(): Promise<ResolvedSiteSettings> {
  const settings = await getSiteSettingsMap();
  return {
    clinicName: settings.clinicName || siteConfig.name,
    phone: settings.phone || siteConfig.phone,
    city: settings.city || siteConfig.city,
    workHoursWeekdays: settings.workHoursWeekdays || siteConfig.workHoursWeekdays,
  };
}

export async function getHomeStaticOgPath() {
  const latestSetting = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return versionOgAsset(STATIC_OG_PATHS.home, latestSetting?.updatedAt);
}

export async function getServicesIndexStaticOgPath() {
  const [latestService, latestSetting] = await Promise.all([
    prisma.service.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.siteSettings.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const latest =
    latestService?.updatedAt &&
    latestSetting?.updatedAt &&
    latestService.updatedAt > latestSetting.updatedAt
      ? latestService.updatedAt
      : latestService?.updatedAt || latestSetting?.updatedAt;

  return versionOgAsset(STATIC_OG_PATHS.servicesIndex, latest);
}

export async function getDocumentsIndexStaticOgPath() {
  const [latestDocument, latestSetting] = await Promise.all([
    prisma.siteDocument.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.siteSettings.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const latest =
    latestDocument?.updatedAt &&
    latestSetting?.updatedAt &&
    latestDocument.updatedAt > latestSetting.updatedAt
      ? latestDocument.updatedAt
      : latestDocument?.updatedAt || latestSetting?.updatedAt;

  return versionOgAsset(STATIC_OG_PATHS.documentsIndex, latest);
}

export async function generateGlobalStaticOgImages() {
  const settings = await getResolvedSiteSettings();

  await renderStaticOgImage(STATIC_OG_PATHS.home, {
    eyebrow: `Стоматология в ${settings.city}`,
    title: settings.clinicName,
    accent: "для взрослых и детей",
    description:
      "Терапия, детская стоматология, ортодонтия, хирургия, имплантация и эстетические процедуры.",
    tags: [settings.city, settings.workHoursWeekdays, settings.phone],
  });

  await renderStaticOgImage(STATIC_OG_PATHS.servicesIndex, {
    eyebrow: "Услуги",
    title: `Услуги клиники ${settings.clinicName}`,
    description:
      "Терапия, хирургия, имплантация, ортодонтия, детская стоматология и эстетические процедуры.",
    tags: [settings.city, "Запись по телефону", settings.phone],
  });

  await renderStaticOgImage(STATIC_OG_PATHS.documentsIndex, {
    eyebrow: "Документы",
    title: `Документы клиники ${settings.clinicName}`,
    description:
      "Лицензии, политика конфиденциальности и обязательная информация стоматологической клиники.",
    tags: [settings.city, "Официальная информация"],
  });

  await renderStaticOgImage(STATIC_OG_PATHS.notFound, {
    eyebrow: "404",
    title: "Страница не найдена",
    description:
      "Страница отсутствует или была перенесена. Перейдите на главную страницу клиники.",
    tags: [settings.clinicName],
  });
}

export async function generateServiceStaticOgImage(service: OgRenderableService) {
  await renderStaticOgImage(getServiceStaticOgPath(service.slug), {
    eyebrow: "Услуга",
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.summary || service.description,
    tags: [service.priceFrom || "", service.duration || "", "Рамзи Дент"],
  });
}

export async function generateDocumentStaticOgImage(document: OgRenderableDocument) {
  await renderStaticOgImage(getDocumentStaticOgPath(document.slug), {
    eyebrow: document.type || "Документ",
    title: document.title,
    description:
      document.description ||
      `${document.type} стоматологической клиники Рамзи Дент в Твери.`,
    tags: [document.type, "Рамзи Дент"],
  });
}

async function removeStaticOgFile(publicPath: string) {
  const absolutePath = getPublicAbsolutePath(publicPath);
  await rm(absolutePath, { force: true }).catch(() => {});
}

async function cleanupDirectory(publicDirectory: string, keepFileNames: string[]) {
  const absoluteDirectory = getPublicAbsolutePath(publicDirectory);
  await mkdir(absoluteDirectory, { recursive: true });

  const fileNames = await readdir(absoluteDirectory).catch(() => []);
  const keep = new Set(keepFileNames);

  await Promise.all(
    fileNames.map(async (fileName) => {
      if (!keep.has(fileName)) {
        await rm(path.join(absoluteDirectory, fileName), { force: true });
      }
    })
  );
}

export async function syncServiceStaticOgAssets(
  currentService: OgRenderableService,
  previousSlug?: string | null
) {
  if (previousSlug && previousSlug !== currentService.slug) {
    await removeStaticOgFile(getServiceStaticOgPath(previousSlug));
  }

  if (currentService.enabled) {
    await generateServiceStaticOgImage(currentService);
  } else {
    await removeStaticOgFile(getServiceStaticOgPath(currentService.slug));
  }

  await generateGlobalStaticOgImages();
}

export async function syncDocumentStaticOgAssets(
  currentDocument: OgRenderableDocument,
  previousSlug?: string | null
) {
  if (previousSlug && previousSlug !== currentDocument.slug) {
    await removeStaticOgFile(getDocumentStaticOgPath(previousSlug));
  }

  if (currentDocument.enabled && currentDocument.fileId) {
    await generateDocumentStaticOgImage(currentDocument);
  } else {
    await removeStaticOgFile(getDocumentStaticOgPath(currentDocument.slug));
  }

  await generateGlobalStaticOgImages();
}

export async function removeServiceStaticOgAssets(slug: string) {
  await removeStaticOgFile(getServiceStaticOgPath(slug));
  await generateGlobalStaticOgImages();
}

export async function removeDocumentStaticOgAssets(slug: string) {
  await removeStaticOgFile(getDocumentStaticOgPath(slug));
  await generateGlobalStaticOgImages();
}

export async function generateAllStaticOgImages() {
  const [services, documents] = await Promise.all([
    prisma.service.findMany({
      where: { enabled: true },
      select: {
        slug: true,
        title: true,
        summary: true,
        description: true,
        priceFrom: true,
        duration: true,
        seoTitle: true,
        seoDescription: true,
        enabled: true,
        updatedAt: true,
      },
    }),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      select: {
        slug: true,
        title: true,
        description: true,
        type: true,
        fileId: true,
        enabled: true,
        updatedAt: true,
      },
    }),
  ]);

  await generateGlobalStaticOgImages();
  await mkdir(getPublicAbsolutePath(OG_ROOT), { recursive: true });
  await mkdir(getPublicAbsolutePath(`${OG_ROOT}/services`), { recursive: true });
  await mkdir(getPublicAbsolutePath(`${OG_ROOT}/documents`), { recursive: true });

  await Promise.all(services.map((service) => generateServiceStaticOgImage(service)));
  await Promise.all(documents.map((document) => generateDocumentStaticOgImage(document)));

  await cleanupDirectory(
    `${OG_ROOT}/services`,
    services.map((service) => `${service.slug}.jpg`)
  );
  await cleanupDirectory(
    `${OG_ROOT}/documents`,
    documents.map((document) => `${document.slug}.jpg`)
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    siteUrl: env.siteUrl,
    services: services.length,
    documents: documents.length,
  };

  await writeFile(
    getPublicAbsolutePath(`${OG_ROOT}/manifest.json`),
    JSON.stringify(manifest, null, 2)
  );
}
