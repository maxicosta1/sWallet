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
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  ALLOWED_LOGIN_USERS: z.string().default(""),
  ALLOWED_LOGIN_PASSWORD: z.string().min(8).optional()
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
  },
  allowedLogin: {
    users: parsed.ALLOWED_LOGIN_USERS.split(",").map((user) => user.trim()).filter(Boolean),
    password: parsed.ALLOWED_LOGIN_PASSWORD
  }
} as const;
