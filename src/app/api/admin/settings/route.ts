import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { generateAllStaticOgImages } from "@/lib/og-static";
import { parseRequestJson, settingsUpdateSchema } from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";
import { getAdminSettingsPayload, upsertSettings } from "@/lib/settings-store";

export const GET = withAuth(async () => {
  const settings = await getAdminSettingsPayload();
  return NextResponse.json(settings);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, settingsUpdateSchema);

  const entries: Array<[string, string]> = [];
  const clearOpenRouterApiKey = body.clearOpenRouterApiKey ?? false;

  for (const [key, value] of Object.entries(body)) {
    if (key === "clearOpenRouterApiKey") {
      continue;
    }

    if (key === "openRouterApiKey") {
      const normalized = String(value ?? "").trim();
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

  enqueueOgJob("settings:update", async () => {
    await generateAllStaticOgImages();
  });

  return NextResponse.json({ success: true });
});
