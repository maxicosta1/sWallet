import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import type { Role } from "../types/domain.js";
import { forbidden, unauthorized } from "../shared/errors.js";
import { verifyAccessToken } from "../shared/jwt.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token) throw unauthorized();

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: "activo" },
      select: { id: true, role: true }
    });

    if (!user) throw unauthorized("User not found or inactive.");

    req.auth = {
      userId: user.id,
      role: user.role,
      tokenId: payload.jti
    };
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized());
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(forbidden());
      return;
    }

    next();
  };
}
