import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(request) {
    if (
      request.nextUrl.pathname === "/admin/login" &&
      request.nextauth.token
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (
          req.nextUrl.pathname.startsWith("/admin") &&
          req.nextUrl.pathname !== "/admin/login"
        ) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
