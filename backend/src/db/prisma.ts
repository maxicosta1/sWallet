import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.BACKEND_NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.BACKEND_NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
