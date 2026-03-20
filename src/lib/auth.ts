import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { InMemoryRateLimiter } from "@/lib/rate-limit";

const loginRateLimiter = new InMemoryRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
});

const passwordPlaceholderHash =
  "$2b$10$Jf37R1XQvlvQ4iNCTHIGeewD8M9mKE3F4Xjly6NfAzwM.8LJkK9fK";

function getAuthRequestIp(input: unknown) {
  if (!input || typeof input !== "object" || !("headers" in input)) {
    return "unknown";
  }

  const headers = (input as { headers?: Record<string, string | string[]> }).headers;
  if (!headers) return "unknown";

  const pickHeader = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const resolved =
    pickHeader(headers["x-forwarded-for"]) ||
    pickHeader(headers["x-real-ip"]) ||
    pickHeader(headers["cf-connecting-ip"]);

  if (!resolved) return "unknown";
  const [first] = resolved.split(",");
  return first?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        const rateLimit = loginRateLimiter.consume(
          `${getAuthRequestIp(request)}:${normalizedEmail}`
        );
        if (!rateLimit.allowed) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.adminUser.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

        if (!user?.password) {
          await bcrypt.compare(credentials.password, passwordPlaceholderHash);
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
