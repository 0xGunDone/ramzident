import { randomUUID } from "node:crypto";

export function createRequestId() {
  return randomUUID();
}

function normalizeForwardedFor(value: string | null) {
  if (!value) return "";
  const [first] = value.split(",");
  return first?.trim() || "";
}

export function getClientIp(request: Request) {
  return (
    normalizeForwardedFor(request.headers.get("x-forwarded-for")) ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}
