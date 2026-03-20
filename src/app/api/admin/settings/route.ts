import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { generateAllStaticOgImages } from "@/lib/og-static";
import { parseRequestJson, settingsUpdateSchema } from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";
import {
  getAdminSettingsPayload,
  getSettingValue,
  upsertSettings,
} from "@/lib/settings-store";
import { revalidatePublicSite } from "@/lib/public-cache";

export const GET = withAuth(async () => {
  const settings = await getAdminSettingsPayload();
  return NextResponse.json(settings);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, settingsUpdateSchema);

  const entries: Array<[string, string]> = [];
  const clearOpenRouterApiKey = body.clearOpenRouterApiKey ?? false;
  let submittedOpenRouterApiKey = "";

  for (const [key, value] of Object.entries(body)) {
    if (key === "clearOpenRouterApiKey") {
      continue;
    }

    if (key === "openRouterApiKey") {
      const normalized = String(value ?? "").trim();
      submittedOpenRouterApiKey = normalized;
      if (clearOpenRouterApiKey) {
        entries.push([key, ""]);
      } else if (normalized.length > 0) {
        entries.push([key, normalized]);
      }
      continue;
    }

    entries.push([key, String(value ?? "")]);
  }

  await upsertSettings(entries);

  if (submittedOpenRouterApiKey.length > 0 && !clearOpenRouterApiKey) {
    const persisted = (await getSettingValue("openRouterApiKey")).trim();
    if (!persisted) {
      throw new ApiError(
        "Ключ OpenRouter сохранён, но не читается на сервере. Проверьте SETTINGS_ENCRYPTION_KEY/NEXTAUTH_SECRET и сохраните ключ повторно.",
        {
          status: 500,
          code: "OPENROUTER_KEY_UNREADABLE",
        }
      );
    }
  }

  if (clearOpenRouterApiKey) {
    const persisted = (await getSettingValue("openRouterApiKey")).trim();
    if (persisted.length > 0) {
      throw new ApiError("Не удалось очистить ключ OpenRouter.", {
        status: 500,
        code: "OPENROUTER_KEY_CLEAR_FAILED",
      });
    }
  }

  enqueueOgJob("settings:update", async () => {
    await generateAllStaticOgImages();
  });

  revalidatePublicSite();
  return NextResponse.json({ success: true });
});
