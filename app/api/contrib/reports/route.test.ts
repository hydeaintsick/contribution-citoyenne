import { describe, expect, test, beforeEach, vi } from "vitest";
import { ContributionStatus, ContributionType } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    commune: {
      findUnique: vi.fn(),
    },
    contribution: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "./route";

type PrismaMock = {
  commune: { findUnique: ReturnType<typeof vi.fn> };
  contribution: { create: ReturnType<typeof vi.fn> };
};

const prismaMock = prisma as unknown as PrismaMock;

describe("POST /api/contrib/reports", () => {
  beforeEach(() => {
    prismaMock.commune.findUnique.mockReset();
    prismaMock.contribution.create.mockReset();
  });

  test("returns 400 when the JSON payload is invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/contrib/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload JSON invalide.",
    });
  });

  test("returns 404 when the commune does not exist or is not visible", async () => {
    prismaMock.commune.findUnique.mockResolvedValue(null);

    const payload = {
      communeId: "commune-404",
      type: "alert",
      category: { value: "voirie", label: "Voirie" },
      subcategory: "Nid-de-poule",
      details: "Description valide pour le signalement.",
      location: "Rue de la Paix",
      coordinates: { latitude: 48.5, longitude: 2.3 },
      photo: null,
    };

    const response = await POST(
      new Request("http://localhost/api/contrib/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(prismaMock.commune.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.contribution.create).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "Commune introuvable ou indisponible.",
    });
  });

  test("creates a contribution and returns 201 for a valid payload", async () => {
    const now = new Date("2024-01-01T00:00:00.000Z");

    prismaMock.commune.findUnique.mockResolvedValue({
      id: "commune-1",
      isVisible: true,
    });

    prismaMock.contribution.create.mockResolvedValue({
      id: "contrib-1",
      communeId: "commune-1",
      type: ContributionType.ALERT,
      status: ContributionStatus.OPEN,
      categoryValue: "voirie",
      categoryLabel: "Voirie",
      subcategory: "Nid-de-poule",
      details: "Description valide pour le signalement.",
      locationLabel: "Rue de la Paix",
      latitude: 48.5,
      longitude: 2.3,
      photoUrl: null,
      photoPublicId: null,
      createdAt: now,
    });

    const payload = {
      communeId: "commune-1",
      type: "alert",
      category: { value: "voirie", label: "Voirie" },
      subcategory: "Nid-de-poule",
      details: "Description valide pour le signalement.",
      location: "Rue de la Paix",
      coordinates: { latitude: 48.5, longitude: 2.3 },
      photo: {
        url: "https://cdn.local/photo.webp",
        publicId: "photo-123",
      },
    };

    const response = await POST(
      new Request("http://localhost/api/contrib/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    expect(prismaMock.contribution.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.contribution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        communeId: "commune-1",
        type: ContributionType.ALERT,
        status: ContributionStatus.OPEN,
        categoryValue: "voirie",
        categoryLabel: "Voirie",
        subcategory: "Nid-de-poule",
        details: "Description valide pour le signalement.",
        locationLabel: "Rue de la Paix",
        latitude: 48.5,
        longitude: 2.3,
        photoUrl: "https://cdn.local/photo.webp",
        photoPublicId: "photo-123",
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      contribution: {
        id: "contrib-1",
        communeId: "commune-1",
        type: ContributionType.ALERT,
        status: ContributionStatus.OPEN,
        categoryValue: "voirie",
        categoryLabel: "Voirie",
        subcategory: "Nid-de-poule",
        locationLabel: "Rue de la Paix",
        latitude: 48.5,
        longitude: 2.3,
        createdAt: now.toISOString(),
      },
    });
  });
});
