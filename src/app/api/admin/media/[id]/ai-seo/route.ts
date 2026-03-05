import path from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

async function getAiSettings() {
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: ["openRouterApiKey", "openRouterModel"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    apiKey: map.openRouterApiKey || process.env.OPENROUTER_API_KEY || "",
    model:
      map.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "qwen/qwen3-vl-30b-a3b-thinking",
  };
}

export const POST = withAuth(async (_request, context) => {
  const ai = await getAiSettings();

  if (!ai.apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY не настроен. Укажите ключ в Настройках." },
      { status: 500 }
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
  const fileBuffer = await readFile(filePath);
  const base64Image = fileBuffer.toString("base64");
  const dataUrl = `data:${media.mimeType};base64,${base64Image}`;

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ai.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${systemPrompt}\n${contextPrompt}` },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    return NextResponse.json({ error: "AI API request failed" }, { status: 500 });
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
  }

  let parsedJson: {
    altText?: string;
    seoTitle?: string;
    seoDescription?: string;
  };

  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}") + 1;
    parsedJson = JSON.parse(content.slice(jsonStart, jsonEnd));
  } catch {
    console.error("Failed to parse AI response:", content);
    return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 });
  }

  const updatedMedia = await prisma.media.update({
    where: { id },
    data: {
      altText: parsedJson.altText || null,
      seoTitle: parsedJson.seoTitle || null,
      seoDescription: parsedJson.seoDescription || null,
    },
  });

  return NextResponse.json(updatedMedia);
});
