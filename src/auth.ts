import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  credential: z.string().min(3).max(80),
  password: z.string().min(8)
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        credential: { label: "Usuario", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const allowedUsername = resolveAllowedUsername(parsed.data.credential, parsed.data.password);
        if (!allowedUsername) return null;

        const user = await ensureAllowedUser(allowedUsername);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = resolveRole(token.role);
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

function resolveAllowedUsername(credential: string, password: string) {
  const allowedPassword = process.env.ALLOWED_LOGIN_PASSWORD;
  if (!allowedPassword || password !== allowedPassword) return null;

  const normalizedCredential = normalizeCredential(credential);
  const allowedUsers = (process.env.ALLOWED_LOGIN_USERS ?? "")
    .split(",")
    .map((user) => user.trim())
    .filter(Boolean);

  return allowedUsers.find((user) => normalizeCredential(user) === normalizedCredential) ?? null;
}

async function ensureAllowedUser(username: string) {
  const email = `${normalizeCredential(username)}@swallet.local`;
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }]
    }
  });

  if (existing) {
    if (existing.deletedAt || existing.status !== "activo" || existing.role !== "admin") {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          username,
          email,
          name: username,
          role: "admin",
          status: "activo",
          deletedAt: null,
          permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"]
        }
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      username,
      email,
      name: username,
      role: "admin",
      status: "activo",
      permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"]
    }
  });
}

function normalizeCredential(value: string) {
  return value.trim().toLowerCase();
}

function resolveRole(role: unknown): Role {
  return role === "admin" || role === "finanzas" || role === "desarrollador" || role === "solo_lectura"
    ? role
    : "solo_lectura";
}
