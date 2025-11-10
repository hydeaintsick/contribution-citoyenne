import { NextRequest } from "next/server";
import { describe, expect, test, beforeEach, vi } from "vitest";

const mockAuthenticate = vi.hoisted(() => vi.fn());
const mockCreateSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  authenticateUser: mockAuthenticate,
  createSession: mockCreateSession,
}));

import { POST } from "./route";

function createRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: body ? JSON.stringify(body) : null,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockCreateSession.mockReset();
  });

  test("Scenario: rejects invalid payloads with 400", async () => {
    console.info("Scenario: Login route validates incoming payload");

    const response = await POST(createRequest({ email: "bad" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Requête invalide." });
  });

  test("Scenario: returns 401 when credentials are invalid", async () => {
    console.info("Scenario: Login route handles invalid credentials");

    mockAuthenticate.mockResolvedValue(null);

    const response = await POST(
      createRequest({ email: "admin@example.org", password: "wrong" }, {
        "x-forwarded-for": "192.168.0.1",
        "user-agent": "Vitest",
      }),
    );

    expect(mockAuthenticate).toHaveBeenCalledWith("admin@example.org", "wrong", {
      ipAddress: "192.168.0.1",
      userAgent: "Vitest",
    });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Identifiants invalides.",
    });
  });

  test("Scenario: successful login creates session cookie", async () => {
    console.info("Scenario: Login route issues session cookie on success");

    const sessionUser = {
      id: "user-1",
      email: "admin@example.org",
      role: "ADMIN",
      communeId: null,
      firstName: "Admin",
      lastName: "User",
      lastLoginAt: new Date().toISOString(),
    };

    mockAuthenticate.mockResolvedValue(sessionUser);
    mockCreateSession.mockResolvedValue({
      name: "session-token",
      value: "secure-cookie",
      options: { httpOnly: true, path: "/" },
    });

    const response = await POST(
      createRequest({ email: "admin@example.org", password: "correct" }, {
        "x-forwarded-for": "10.0.0.1",
        "user-agent": "Vitest",
      }),
    );
    const body = await response.json();

    expect(mockAuthenticate).toHaveBeenCalledWith("admin@example.org", "correct", {
      ipAddress: "10.0.0.1",
      userAgent: "Vitest",
    });
    expect(mockCreateSession).toHaveBeenCalledWith(sessionUser);
    expect(response.status).toBe(200);
    expect(body).toEqual({ user: sessionUser });
    const cookie = response.cookies.get("session-token");
    expect(cookie?.value).toBe("secure-cookie");
  });
});

