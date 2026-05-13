import { prisma } from "../../db/prisma.js";
import { badRequest, conflict, forbidden, unauthorized } from "../../shared/errors.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/jwt.js";
import { hashPassword, verifyPassword } from "../../shared/passwords.js";
import { serializeUser } from "../../shared/users.js";

type BootstrapInput = {
  name: string;
  username?: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
};

export async function bootstrapAdmin(input: BootstrapInput) {
  const usersCount = await prisma.user.count();
  if (usersCount > 0) throw forbidden("Bootstrap is only allowed before first user exists.");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "admin",
      status: "activo",
      permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"]
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      type: "creado",
      title: "Admin bootstrap",
      body: "Primer usuario administrador creado desde backend."
    }
  });

  return serializeUser(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt || user.status !== "activo" || !user.passwordHash) {
    throw unauthorized("Invalid credentials.");
  }

  const validPassword = await verifyPassword(input.password, user.passwordHash);
  if (!validPassword) throw unauthorized("Invalid credentials.");

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
