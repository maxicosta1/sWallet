import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { unauthorized } from "./errors.js";

type JwtPayload = {
  sub: string;
  role: string;
  type: "access" | "refresh";
  jti: string;
  iat: number;
  exp: number;
};

type TokenInput = {
  userId: string;
  role: string;
};

const encoder = new TextEncoder();

export function signAccessToken(input: TokenInput) {
  return signToken({ ...input, type: "access", ttlSeconds: parseDuration(env.jwt.accessExpiresIn) }, env.jwt.accessSecret);
}

export function signRefreshToken(input: TokenInput) {
  return signToken({ ...input, type: "refresh", ttlSeconds: parseDuration(env.jwt.refreshExpiresIn) }, env.jwt.refreshSecret);
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, env.jwt.accessSecret, "access");
}

export function verifyRefreshToken(token: string) {
  return verifyToken(token, env.jwt.refreshSecret, "refresh");
}

export function hashToken(token: string) {
  return createHmac("sha256", env.jwt.refreshSecret).update(token).digest("hex");
}

function signToken(input: TokenInput & { type: JwtPayload["type"]; ttlSeconds: number }, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: input.userId,
    role: input.role,
    type: input.type,
    jti: randomUUID(),
    iat: now,
    exp: now + input.ttlSeconds
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    payload
  };
}

function verifyToken(token: string, secret: string, type: JwtPayload["type"]) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw unauthorized("Invalid token.");

  const expected = sign(`${encodedHeader}.${encodedPayload}`, secret);
  if (!safeEqual(encodedSignature, expected)) throw unauthorized("Invalid token.");

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as JwtPayload;
  if (payload.type !== type) throw unauthorized("Invalid token type.");
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw unauthorized("Token expired.");

  return payload;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

function parseDuration(value: string) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  return amount * 24 * 60 * 60;
}
