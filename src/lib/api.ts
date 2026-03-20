import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { isApiError } from "@/lib/errors";
import { createRequestId, getClientIp } from "@/lib/request";
import { InMemoryRateLimiter } from "@/lib/rate-limit";

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const adminMutationLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  max: 120,
});

function withCommonHeaders(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  response.headers.set("cache-control", "no-store");
  return response;
}

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestId = createRequestId();
    const pathname = new URL(request.url).pathname;
    const ip = getClientIp(request);

    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return withCommonHeaders(
          NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 }),
          requestId
        );
      }

      if (mutatingMethods.has(request.method.toUpperCase())) {
        const rateLimit = adminMutationLimiter.consume(
          `${request.method}:${pathname}:${ip}`
        );
        if (!rateLimit.allowed) {
          const response = NextResponse.json(
            {
              error: "Too many requests. Please retry later.",
              requestId,
            },
            { status: 429 }
          );
          response.headers.set(
            "retry-after",
            String(rateLimit.retryAfterSeconds || 1)
          );
          response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
          response.headers.set(
            "x-ratelimit-remaining",
            String(rateLimit.remaining)
          );
          return withCommonHeaders(response, requestId);
        }
      }

      const response = await handler(request, context);
      return withCommonHeaders(response, requestId);
    } catch (error) {
      if (isApiError(error)) {
        const body: Record<string, unknown> = {
          error: error.message,
          code: error.code,
          requestId,
        };
        if (error.details) {
          body.details = error.details;
        }
        return withCommonHeaders(
          NextResponse.json(body, { status: error.status }),
          requestId
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return withCommonHeaders(
          NextResponse.json(
            {
              error: "Conflict: duplicate value",
              code: "CONFLICT",
              requestId,
            },
            { status: 409 }
          ),
          requestId
        );
      }

      console.error(`[API][${requestId}] ${request.method} ${request.url}:`, error);
      return withCommonHeaders(
        NextResponse.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
            requestId,
          },
          { status: 500 }
        ),
        requestId
      );
    }
  };
}
