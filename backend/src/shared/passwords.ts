import bcrypt from "bcryptjs";

const HASH_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, HASH_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
