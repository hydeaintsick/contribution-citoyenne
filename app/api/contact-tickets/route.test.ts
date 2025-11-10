import { describe, expect, test, beforeEach, vi } from "vitest";
const prismaMock = vi.hoisted(() => ({
  contactTicket: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { POST } from "./route";

describe("POST /api/contact-tickets", () => {
  beforeEach(() => {
    prismaMock.contactTicket.findFirst.mockReset();
    prismaMock.contactTicket.create.mockReset();
  });

  test("Scenario: invalid JSON payload returns 400", async () => {
    console.info("Scenario: Reject malformed JSON payload for contact tickets");

    const response = await POST(
      new Request("http://localhost/api/contact-tickets", {
        method: "POST",
        body: "{invalid",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Corps de requête invalide.",
    });
  });

  test("Scenario: validation errors return 400 with details", async () => {
    console.info("Scenario: Reject invalid form data for contact tickets");

    const response = await POST(
      new Request("http://localhost/api/contact-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactType: "commune",
          name: "A",
          email: "not-an-email",
          function: "",
          commune: "",
          message: "",
          consent: false,
          fingerprint: "short",
        }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toHaveProperty("error", "Validation invalide.");
  });

  test("Scenario: cooldown prevents duplicate submissions", async () => {
    console.info("Scenario: Enforce cooldown when recent ticket exists");

    const recentDate = new Date();

    prismaMock.contactTicket.findFirst.mockResolvedValue({
      createdAt: recentDate,
    });

    const validPayload = {
      contactType: "commune",
      name: "Marie Curie",
      email: "marie.curie@example.org",
      function: "Maire",
      commune: "Test-sur-Loire",
      message: "Besoin d'une démonstration.",
      consent: true,
      fingerprint: "fingerprint-1234567890",
    };

    const response = await POST(
      new Request("http://localhost/api/contact-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(prismaMock.contactTicket.findFirst).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload).toMatchObject({
      error: expect.stringContaining("Vous avez déjà envoyé une demande récemment"),
      retryAfter: expect.any(String),
    });
  });

  test("Scenario: successful submission creates contact ticket", async () => {
    console.info("Scenario: Persist contact ticket when payload is valid");

    prismaMock.contactTicket.findFirst.mockResolvedValue(null);

    const now = new Date("2024-01-01T12:00:00.000Z");
    const createdTicket = {
      id: "ticket-42",
      status: "PENDING",
      createdAt: now,
    };

    prismaMock.contactTicket.create.mockResolvedValue(createdTicket);

    const payload = {
      contactType: "commune",
      name: "  Jeanne Martin  ",
      email: "jeanne.martin@example.org",
      function: " Responsable innovation ",
      commune: "  DemoCity ",
      message: "  Merci pour votre retour rapide. ",
      consent: true,
      fingerprint: "fingerprint-commune-001",
    };

    const response = await POST(
      new Request("http://localhost/api/contact-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const body = await response.json();

    if (response.status !== 201) {
      console.error("Contact ticket creation failed", body);
    }

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      id: "ticket-42",
      retryAfter: expect.any(String),
    });

    expect(prismaMock.contactTicket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactType: "COMMUNE",
        name: "Jeanne Martin",
        email: "jeanne.martin@example.org",
        function: "Responsable innovation",
        commune: "DemoCity",
        message: "Merci pour votre retour rapide.",
        consent: true,
        fingerprint: "fingerprint-commune-001",
      }),
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  });

  test("Scenario: unexpected errors during creation return 500", async () => {
    console.info("Scenario: Handle database failure during ticket creation");

    prismaMock.contactTicket.findFirst.mockResolvedValue(null);
    prismaMock.contactTicket.create.mockRejectedValue(new Error("db down"));

    const payload = {
      contactType: "commune",
      name: "Alice",
      email: "alice@example.org",
      function: "Directrice",
      commune: "Paris",
      message: "Test erreur serveur",
      consent: true,
      fingerprint: "fingerprint-error",
    };

    const response = await POST(
      new Request("http://localhost/api/contact-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: "La création du ticket a échoué. Merci de réessayer plus tard.",
    });
  });
});

