export function isPrismaErrorCode(error: unknown, code: string) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && (error as { code?: unknown }).code === code;
}

export function isPrismaMissingTableError(error: unknown) {
  return isPrismaErrorCode(error, "P2021");
}
