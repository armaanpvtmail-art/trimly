import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { logActivity } from "@/lib/activity";

/**
 * NextAuth configuration — Credentials provider with JWT sessions.
 * We intentionally use JWT (not database) sessions so middleware can verify
 * auth at the edge without a DB round-trip. User status is re-checked on every
 * protected server read via the guards in `lib/auth/guards.ts`.
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        if (user.status === "SUSPENDED") {
          throw new Error("ACCOUNT_SUSPENDED");
        }
        if (user.status === "DELETED") {
          throw new Error("ACCOUNT_UNAVAILABLE");
        }

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)
            ?.split(",")[0]
            ?.trim() || undefined;
        await logActivity({
          actorType: "USER",
          userId: user.id,
          action: "auth.login",
          description: `${user.email} logged in`,
          ipAddress: ip,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid;
      }
      return session;
    },
  },
};
