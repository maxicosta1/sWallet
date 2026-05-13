import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`sWallet backend listening on :${env.port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing backend.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
