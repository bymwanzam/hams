import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  // Auth.js only auto-trusts the request's Host header in dev, or when it
  // detects Vercel/Cloudflare Pages or an AUTH_URL/AUTH_TRUST_HOST env var
  // — none of which apply to this app's documented deployment (`next
  // start` behind the hospital's own reverse proxy, config via the legacy
  // NEXTAUTH_URL/NEXTAUTH_SECRET names). Without this, every request in
  // production fails auth with an "UntrustedHost" error. Safe here because
  // this is a single self-hosted deployment, not a multi-tenant service
  // fronted by untrusted proxies.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        // A single field that accepts either the user's email address or
        // their username — see the OR lookup below.
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const identifier = (
          credentials?.identifier as string | undefined
        )?.trim();
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] },
        });
        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
