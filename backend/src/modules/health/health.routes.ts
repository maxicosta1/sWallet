import { Router } from "express";
import { prisma } from "../../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "swallet-backend",
    uptime: process.uptime()
  });
});

healthRouter.get("/db", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "reachable" });
  } catch (error) {
    next(error);
  }
});
