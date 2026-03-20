export type AdminAiDraftKind =
  | "service"
  | "document"
  | "faq"
  | "testimonial"
  | "section";

export async function getApiErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error;
    }
  } catch {
    // ignore malformed response payload
  }

  return fallback;
}

export async function requestAdminAiDraft<T>(
  kind: AdminAiDraftKind,
  payload: unknown
): Promise<T> {
  const response = await fetch("/api/admin/ai/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, payload }),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "AI черновик недоступен"));
  }

  return (await response.json()) as T;
}
