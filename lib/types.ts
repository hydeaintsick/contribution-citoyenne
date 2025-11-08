import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  communeId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  lastLoginAt?: string | null;
};

export type SessionData = {
  user: SessionUser;
  expiresAt: number;
};

