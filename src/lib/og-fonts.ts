import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const fontFile = (filename: string) =>
  path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files",
    filename
  );

export const getOgFonts = cache(async () => {
  const [
    regularLatin,
    regularCyrillic,
    boldLatin,
    boldCyrillic,
  ] = await Promise.all([
    readFile(fontFile("noto-sans-latin-400-normal.woff")),
    readFile(fontFile("noto-sans-cyrillic-400-normal.woff")),
    readFile(fontFile("noto-sans-latin-700-normal.woff")),
    readFile(fontFile("noto-sans-cyrillic-700-normal.woff")),
  ]);

  return [
    {
      name: "Noto Sans",
      data: regularLatin,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "Noto Sans",
      data: regularCyrillic,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "Noto Sans",
      data: boldLatin,
      style: "normal" as const,
      weight: 700 as const,
    },
    {
      name: "Noto Sans",
      data: boldCyrillic,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
});
