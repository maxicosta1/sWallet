import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  BACKEND_NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d")
});

const parsed = envSchema.parse(process.env);

export const env = {
  databaseUrl: parsed.DATABASE_URL,
  port: parsed.BACKEND_PORT,
  nodeEnv: parsed.BACKEND_NODE_ENV,
  corsOrigins: parsed.BACKEND_CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  jwt: {
    accessSecret: parsed.JWT_ACCESS_SECRET,
    refreshSecret: parsed.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN
  }
} as const;
