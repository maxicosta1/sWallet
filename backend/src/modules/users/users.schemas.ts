import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(40).regex(/^[a-z0-9._-]+$/).optional(),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "finanzas", "desarrollador", "solo_lectura"]).default("solo_lectura"),
  status: z.enum(["activo", "inactivo", "invitado"]).default("activo")
});
