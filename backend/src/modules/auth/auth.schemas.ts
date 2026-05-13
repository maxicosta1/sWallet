import { z } from "zod";

const passwordSchema = z.string().min(8).max(128);

export const bootstrapSchema = z.object({
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(40).regex(/^[a-z0-9._-]+$/).optional(),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: passwordSchema
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional()
});
