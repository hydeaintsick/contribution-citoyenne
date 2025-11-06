import bcrypt from "bcrypt";
import { prisma } from "./prisma";
import type { SessionUser } from "./types";

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return sessionUser;
}

export {
  createSession,
  createSessionCookie,
  destroySessionCookie,
  getSessionFromRequest,
  clearSession,
  attachSessionToResponse,
  parseSessionCookie,
  getSessionCookieName,
} from "./session";

