import { describe, expect, test, beforeEach, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const mockBcrypt = vi.hoisted(() => ({
  compare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("bcrypt", () => mockBcrypt);

import { authenticateUser } from "@/lib/auth";

describe("authenticateUser", () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    mockBcrypt.compare.mockReset();
  });

  test("Scenario: returns null when user is not found", async () => {
    console.info("Scenario: authenticateUser returns null for unknown email");

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authenticateUser("missing@example.org", "password");
    expect(result).toBeNull();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("Scenario: returns null when password is invalid", async () => {
    console.info("Scenario: authenticateUser stops on invalid password");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.org",
      password: "hashed",
      role: "ADMIN",
      communeId: null,
      firstName: "Admin",
      lastName: "User",
    });
    mockBcrypt.compare.mockResolvedValue(false);

    const result = await authenticateUser("user@example.org", "wrong");
    expect(result).toBeNull();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test("Scenario: returns session user and logs login on success", async () => {
    console.info("Scenario: authenticateUser updates last login and returns session user");

    const userRecord = {
      id: "user-1",
      email: "user@example.org",
      password: "hashed",
      role: "ADMIN",
      communeId: "commune-1",
      firstName: "Admin",
      lastName: "User",
    };

    mockPrisma.user.findUnique.mockResolvedValue(userRecord);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({});

    const session = await authenticateUser("user@example.org", "correct", {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(session).toMatchObject({
      id: "user-1",
      email: "user@example.org",
      role: "ADMIN",
      communeId: "commune-1",
      firstName: "Admin",
      lastName: "User",
    });
    expect(typeof session?.lastLoginAt).toBe("string");

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          loginLogs: {
            create: {
              ipAddress: "127.0.0.1",
              userAgent: "Vitest",
            },
          },
        }),
      }),
    );
  });
});

