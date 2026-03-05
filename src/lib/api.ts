import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[API] ${request.method} ${request.url}:`, error);
      const message =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
