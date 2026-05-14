import { z } from "zod";

const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  credential: z.string().min(3).max(80).transform((value) => value.trim()),
  password: passwordSchema
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional()
});
