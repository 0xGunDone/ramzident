export interface ApiErrorOptions {
  status?: number;
  code?: string;
  expose?: boolean;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  status: number;
  code: string;
  expose: boolean;
  details?: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status ?? 500;
    this.code = options.code ?? "API_ERROR";
    this.expose = options.expose ?? true;
    this.details = options.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
