import type { Role } from "../types/domain.js";

type UserRecord = {
  id: string;
  name: string | null;
  username?: string | null;
  email: string;
  role: Role;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    role: user.role,
    status: user.status ?? "activo",
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString()
  };
}
