import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

const uploadRoot = path.resolve(process.cwd(), "public", "uploads");

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

interface UploadRouteContext {
  params: Promise<{ segments: string[] }>;
}

function resolveUploadPath(segments: string[]) {
  if (segments.length === 0) {
    return null;
  }

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  const absolutePath = path.resolve(uploadRoot, ...segments);
  if (
    absolutePath === uploadRoot ||
    !absolutePath.startsWith(`${uploadRoot}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  return contentTypes[extension] || "application/octet-stream";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, context: UploadRouteContext) {
  const { segments } = await context.params;
  const absolutePath = resolveUploadPath(segments);

  if (!absolutePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const file = await readFile(absolutePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": getContentType(absolutePath),
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
