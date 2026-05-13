import type { Role } from "./domain.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: Role;
        tokenId: string;
      };
    }
  }
}

export {};
