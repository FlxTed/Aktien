import { getServerSession as getSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};

/** Safe getServerSession: returns null on error so pages don't crash. */
export async function getServerSession(): Promise<Session | null> {
  try {
    return await getSession(authOptions);
  } catch (e) {
    console.error("[auth] getServerSession failed:", e);
    return null;
  }
}

const GUEST_EMAIL = "guest@aktien.local";

function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

/** Get userId for the request, or null if no DB (app still works with empty data). */
export async function getUserIdForRequest(): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const session = await getSession(authOptions);
    if (session?.user && (session.user as { id?: string }).id) {
      return (session.user as { id: string }).id;
    }
    const guest = await prisma.user.upsert({
      where: { email: GUEST_EMAIL },
      create: { email: GUEST_EMAIL, name: "Guest" },
      update: {},
    });
    return guest.id;
  } catch {
    return null;
  }
}
