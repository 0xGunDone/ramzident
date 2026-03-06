export function isUploadedMediaPath(path: string | null | undefined) {
  return typeof path === "string" && path.startsWith("/uploads/");
}
