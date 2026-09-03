import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/auth/rate-limit";
import type { CompanyRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required behind a reverse proxy (Coolify/Traefik, Docker, etc.): the
  // incoming Host header is proxied and won't necessarily match what
  // Auth.js expects, so it must be told to trust it explicitly.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (isRateLimited(ip)) return null;

        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase().trim(), active: true },
          include: { company: true },
        });

        if (!user) {
          recordFailedAttempt(ip);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          recordFailedAttempt(ip);
          return null;
        }

        if (user.userType === "COMPANY_USER" && user.company?.deletedAt) {
          return null;
        }

        clearAttempts(ip);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          companyId: user.companyId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.companyId = user.companyId;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as "SUPER_ADMIN" | "COMPANY_USER";
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.role = (token.role as CompanyRole | null) ?? null;
      }
      return session;
    },
  },
});
