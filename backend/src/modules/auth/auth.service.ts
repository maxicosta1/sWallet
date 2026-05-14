import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { badRequest, conflict, unauthorized } from "../../shared/errors.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/jwt.js";
import { serializeUser } from "../../shared/users.js";

type LoginInput = {
  credential: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
};

export async function login(input: LoginInput) {
  const allowedUsername = resolveAllowedUsername(input.credential, input.password);
  if (!allowedUsername) {
    throw unauthorized("Invalid credentials.");
  }

  const user = await ensureAllowedUser(allowedUsername);

  const access = signAccessToken({ userId: user.id, role: user.role });
  const refresh = signRefreshToken({ userId: user.id, role: user.role });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh.token),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: new Date(refresh.payload.exp * 1000)
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      type: "login",
      title: "Login backend",
      metadata: { userAgent: input.userAgent, ipAddress: input.ipAddress }
    }
  });

  return {
    user: serializeUser(user),
    accessToken: access.token,
    refreshToken: refresh.token,
    expiresAt: new Date(access.payload.exp * 1000).toISOString()
  };
}

export async function refreshSession(refreshToken: string, requestMeta: { userAgent?: string; ipAddress?: string }) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) throw unauthorized("Refresh token expired.");
  if (stored.user.deletedAt || stored.user.status !== "activo") throw unauthorized("User not found or inactive.");

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  });

  const access = signAccessToken({ userId: payload.sub, role: stored.user.role });
  const refresh = signRefreshToken({ userId: payload.sub, role: stored.user.role });

  await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      tokenHash: hashToken(refresh.token),
      userAgent: requestMeta.userAgent,
      ipAddress: requestMeta.ipAddress,
      expiresAt: new Date(refresh.payload.exp * 1000)
    }
  });

  return {
    user: serializeUser(stored.user),
    accessToken: access.token,
    refreshToken: refresh.token,
    expiresAt: new Date(access.payload.exp * 1000).toISOString()
  };
}

export async function logout(userId: string | undefined, refreshToken?: string) {
  if (!userId && !refreshToken) throw badRequest("Missing active session or refresh token.");

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: "activo" }
  });

  if (!user) throw unauthorized("User not found or inactive.");
  return serializeUser(user);
}

export async function assertEmailAvailable(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict("Email already exists.");
}

function resolveAllowedUsername(credential: string, password: string) {
  if (!env.allowedLogin.password || password !== env.allowedLogin.password) return null;

  const normalizedCredential = normalizeCredential(credential);
  return env.allowedLogin.users.find((user) => normalizeCredential(user) === normalizedCredential) ?? null;
}

async function ensureAllowedUser(username: string) {
  const email = allowedUserEmail(username);
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
          permissions: adminPermissions()
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
      permissions: adminPermissions()
    }
  });
}

function normalizeCredential(value: string) {
  return value.trim().toLowerCase();
}

function allowedUserEmail(username: string) {
  return `${normalizeCredential(username)}@swallet.local`;
}

function adminPermissions() {
  return ["clients", "finance", "projects", "reports", "settings", "write", "delete"];
}
