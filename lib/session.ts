import { NextRequest, NextResponse } from "next/server";
import type { SessionData, SessionUser } from "./types";

export const SESSION_COOKIE_NAME = "contribcit-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 6; // 6 heures

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET doit être défini dans les variables d'environnement.",
  );
}

const encoder = new TextEncoder();

const keyPromise = crypto.subtle.importKey(
  "raw",
  encoder.encode(SESSION_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

function toBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  const base64 = btoa(value);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }

  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

function base64UrlToUint8Array(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }

  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sign(data: string) {
  const key = await keyPromise;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  if (typeof Buffer !== "undefined") {
    return Buffer.from(signature).toString("base64url");
  }

  const bytes = new Uint8Array(signature);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifySignature(data: string, signature: string) {
  const key = await keyPromise;
  const signatureBytes = base64UrlToUint8Array(signature);
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(data),
  );
}

async function serializeSession(session: SessionData) {
  const json = JSON.stringify(session);
  const payload = toBase64Url(json);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

async function deserializeSession(token: string): Promise<SessionData | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const isValid = await verifySignature(payload, signature);
  if (!isValid) {
    return null;
  }

  try {
    const json = fromBase64Url(payload);
    const session = JSON.parse(json) as SessionData;

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function createSessionCookie(session: SessionData) {
  const value = await serializeSession(session);
  return {
    name: SESSION_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export async function createSession(user: SessionUser) {
  const session: SessionData = {
    user,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  return createSessionCookie(session);
}

export function destroySessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export async function getSessionFromRequest(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) {
    return null;
  }

  return deserializeSession(cookie);
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function parseSessionCookie(value: string | undefined) {
  if (!value) {
    return null;
  }
  return deserializeSession(value);
}

export async function attachSessionToResponse(
  response: NextResponse,
  session: SessionData,
) {
  const cookie = await createSessionCookie(session);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export function clearSession(response: NextResponse) {
  const cookie = destroySessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

