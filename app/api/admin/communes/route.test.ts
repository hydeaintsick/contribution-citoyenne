import { NextRequest } from "next/server";
import { describe, expect, test, beforeEach, vi } from "vitest";

const mockSession = vi.hoisted(() => ({
  user: { id: "admin-1", role: "ADMIN" },
}));

const { mockPrisma, mockHashPassword, mockGenerateSlug, mockGetSession } = vi.hoisted(() => {
  const communeCreate = vi.fn();
  const userCreate = vi.fn();
  const auditCreate = vi.fn();

  return {
    mockPrisma: {
      commune: {
        findFirst: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (callback) =>
        callback({
          commune: { create: communeCreate },
          user: { create: userCreate },
          cityAuditLog: { create: auditCreate },
        }),
      ),
      __communeCreate: communeCreate,
      __userCreate: userCreate,
      __auditCreate: auditCreate,
    },
    mockHashPassword: vi.fn().mockResolvedValue("hashed-password"),
    mockGenerateSlug: vi.fn().mockReturnValue("testville-75000"),
    mockGetSession: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getSessionFromRequest: mockGetSession,
  hashPassword: mockHashPassword,
}));

vi.mock("@/lib/slug", () => ({
  generateCommuneSlug: mockGenerateSlug,
}));

import { POST } from "./route";

function createRequest(body: unknown, init?: RequestInit) {
  return new NextRequest("http://localhost/api/admin/communes", {
    method: "POST",
    body: body ? JSON.stringify(body) : null,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

describe("POST /api/admin/communes", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockPrisma.commune.findFirst.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$transaction.mockClear();
    mockPrisma.__communeCreate.mockReset();
    mockPrisma.__userCreate.mockReset();
    mockPrisma.__auditCreate.mockReset();
    mockHashPassword.mockClear();
    mockGenerateSlug.mockClear();
  });

  test("Scenario: refuses unauthenticated requests", async () => {
    console.info("Scenario: Admin commune creation requires authenticated admin or account manager");

    mockGetSession.mockResolvedValue(null);

    const response = await POST(createRequest({}));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Non autorisé." });
  });

  test("Scenario: rejects payload validation errors", async () => {
    console.info("Scenario: Commune creation validates request payload");

    mockGetSession.mockResolvedValue(mockSession);

    const response = await POST(
      createRequest({
        postalCode: "7500", // invalid length
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Le code postal doit comporter 5 chiffres"),
    });
  });

  test("Scenario: rejects duplicate commune conflicts", async () => {
    console.info("Scenario: Commune creation guard against existing communes");

    mockGetSession.mockResolvedValue(mockSession);
    mockPrisma.commune.findFirst.mockResolvedValue({
      id: "existing",
      name: "Existing",
      postalCode: "75000",
    });

    const response = await POST(
      createRequest({
        postalCode: "75000",
        name: "Paris",
        osmId: "osm-1",
        osmType: "relation",
        bbox: [1, 2, 3, 4],
        latitude: 48.8,
        longitude: 2.3,
        manager: {
          email: "manager@example.org",
          password: "securepass",
          firstName: "John",
          lastName: "Doe",
          phone: "",
        },
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("est déjà enregistrée"),
    });
  });

  test("Scenario: rejects duplicate manager email", async () => {
    console.info("Scenario: Commune creation detects manager email conflict");

    mockGetSession.mockResolvedValue(mockSession);
    mockPrisma.commune.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" });

    const response = await POST(
      createRequest({
        postalCode: "75000",
        name: "Paris",
        osmId: "osm-1",
        osmType: "relation",
        bbox: [1, 2, 3, 4],
        latitude: 48.8,
        longitude: 2.3,
        manager: {
          email: "manager@example.org",
          password: "securepass",
          firstName: "John",
          lastName: "Doe",
          phone: "",
        },
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Un compte utilise déjà cet email.",
    });
  });

  test("Scenario: creates commune, manager and audit log", async () => {
    console.info("Scenario: Commune creation persists records with audit trail");

    mockGetSession.mockResolvedValue(mockSession);
    mockPrisma.commune.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.__communeCreate.mockResolvedValue({
      id: "commune-new",
      name: "Paris",
      slug: "paris",
      postalCode: "75000",
    });

    const payload = {
      postalCode: "75000",
      name: "Paris",
      osmId: "osm-1",
      osmType: "relation",
      bbox: [1, 2, 3, 4],
      latitude: 48.8,
      longitude: 2.3,
      manager: {
        email: "manager@example.org",
        password: "securepass",
        firstName: "John",
        lastName: "Doe",
        phone: "0102030405",
      },
    };

    const response = await POST(createRequest(payload));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      commune: {
        id: "commune-new",
        name: "Paris",
        postalCode: "75000",
        slug: "paris",
      },
    });

    expect(mockHashPassword).toHaveBeenCalledWith("securepass");
    expect(mockGenerateSlug).toHaveBeenCalledWith("Paris", "75000");
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.__communeCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Paris",
        postalCode: "75000",
        createdById: "admin-1",
        updatedById: "admin-1",
      }),
    });
    expect(mockPrisma.__userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "manager@example.org",
        password: "hashed-password",
        role: "TOWN_MANAGER",
      }),
    });
    expect(mockPrisma.__auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        communeId: "commune-new",
        userId: "admin-1",
        action: "CREATED",
      }),
    });
  });
});

