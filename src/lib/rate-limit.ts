export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();
  private cleanupCounter = 0;

  constructor(private readonly options: RateLimitOptions) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    this.maybeCleanup(now);

    const existing = this.store.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + this.options.windowMs;
      const entry: RateLimitEntry = { count: 1, resetAt };
      this.store.set(key, entry);
      return {
        allowed: true,
        limit: this.options.max,
        remaining: Math.max(0, this.options.max - entry.count),
        retryAfterSeconds: 0,
        resetAt,
      };
    }

    existing.count += 1;
    const allowed = existing.count <= this.options.max;
    const retryAfterSeconds = allowed
      ? 0
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    return {
      allowed,
      limit: this.options.max,
      remaining: Math.max(0, this.options.max - existing.count),
      retryAfterSeconds,
      resetAt: existing.resetAt,
    };
  }

  private maybeCleanup(now: number) {
    this.cleanupCounter += 1;
    if (this.cleanupCounter % 100 !== 0) {
      return;
    }

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
