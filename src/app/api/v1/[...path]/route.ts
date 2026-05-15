import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_USERS = ["FranPernil", "MaxiTaxi"];
const DEFAULT_PASSWORD = "LiamVillero123";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

type TokenPayload = {
  userId: string;
  username: string;
  type: "access" | "refresh";
  exp: number;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

async function handleRequest(request: NextRequest, context: RouteContext) {
  try {
    const path = await routePath(context);
    const method = request.method.toUpperCase();

    if (method === "GET" && path === "") {
      return json({ ok: true, service: "sWallet Supabase API" });
    }

    if (method === "POST" && path === "auth/login") {
      return login(request);
    }

    if (method === "GET" && path === "auth/me") {
      const session = await requireSession(request, "access");
      return json({ user: userPayload(session) });
    }

    if (method === "POST" && path === "auth/refresh") {
      const body = await readJson(request);
      const session = await verifyToken(String(body.refreshToken || ""), "refresh");
      if (!session) return unauthorized("Sesion expirada. Inicia sesion nuevamente.");
      return json(sessionPayload(session));
    }

    if (method === "POST" && path === "auth/logout") {
      return json({ ok: true });
    }

    if (method === "GET" && path === "state") {
      const session = await requireSession(request, "access");
      const snapshot = await prisma.appSnapshot.findUnique({
        where: { userId: session.userId }
      });
      return json({ snapshot: snapshot?.data ?? null, updatedAt: snapshot?.updatedAt ?? null });
    }

    if ((method === "POST" || method === "PUT") && path === "state") {
      const session = await requireSession(request, "access");
      const body = await readJson(request);
      const snapshot = sanitizeSnapshot(body.snapshot ?? body);
      const saved = await prisma.appSnapshot.upsert({
        where: { userId: session.userId },
        create: { userId: session.userId, data: snapshot },
        update: { data: snapshot }
      });
      return json({ ok: true, updatedAt: saved.updatedAt });
    }

    return json({ message: "Ruta no encontrada." }, 404);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error(error);
    return json({ message: "Error interno del servidor." }, 500);
  }
}

async function login(request: NextRequest) {
  const body = await readJson(request);
  const credential = String(body.credential || body.email || body.username || "").trim();
  const password = String(body.password || "").trim();
  const username = allowedUsername(credential);

  if (!username || password !== allowedPassword()) {
    return unauthorized("Usuario o contrasena incorrectos.");
  }

  return json(sessionPayload({ userId: userIdFor(username), username }));
}

function sessionPayload(session: { userId: string; username: string }) {
  return {
    user: userPayload(session),
    accessToken: createToken({ ...session, type: "access" }, ACCESS_TTL_SECONDS),
    refreshToken: createToken({ ...session, type: "refresh" }, REFRESH_TTL_SECONDS),
    expiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000).toISOString()
  };
}

function userPayload(session: { userId: string; username: string }) {
  return {
    id: session.userId,
    name: session.username,
    username: session.username,
    email: `${session.username.toLowerCase()}@swallet.local`,
    role: "admin",
    status: "activo",
    permissions: ["read", "write", "delete", "admin"]
  };
}

async function requireSession(request: NextRequest, type: "access" | "refresh") {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw unauthorizedError();
  const session = await verifyToken(match[1], type);
  if (!session) throw unauthorizedError();
  return session;
}

async function verifyToken(token: string, type: "access" | "refresh") {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (!safeEqual(signature, sign(encodedPayload))) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  if (payload.type !== type || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (!allowedUsername(payload.username)) return null;

  return { userId: payload.userId, username: payload.username };
}

function createToken(payload: Omit<TokenPayload, "exp">, ttlSeconds: number) {
  const encodedPayload = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  })).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function sign(value: string) {
  return createHmac("sha256", tokenSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function tokenSecret() {
  return process.env.AUTH_SECRET || process.env.JWT_ACCESS_SECRET || "swallet-local-secret-change-me";
}

function allowedUsers() {
  return (process.env.ALLOWED_LOGIN_USERS || DEFAULT_USERS.join(","))
    .split(",")
    .map((user) => user.trim())
    .filter(Boolean);
}

function allowedPassword() {
  return process.env.ALLOWED_LOGIN_PASSWORD?.trim() || DEFAULT_PASSWORD;
}

function allowedUsername(credential: string) {
  return allowedUsers().find((username) => username.toLowerCase() === credential.toLowerCase()) || null;
}

function sanitizeSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {};
  }
  return {
    ...(snapshot as Record<string, unknown>),
    savedAt: new Date().toISOString()
  };
}

function userIdFor(username: string) {
  return username.trim().toLowerCase();
}

async function routePath(context: RouteContext) {
  const params = await context.params;
  return (params.path || []).join("/");
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function unauthorized(message = "Sesion expirada. Inicia sesion nuevamente.") {
  return json({ message }, 401);
}

function unauthorizedError() {
  return new AuthError("Sesion expirada. Inicia sesion nuevamente.");
}

class AuthError extends Error {}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  };
}
