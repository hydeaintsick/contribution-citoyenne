import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
};

export type SessionData = {
  user: SessionUser;
  expiresAt: number;
};

