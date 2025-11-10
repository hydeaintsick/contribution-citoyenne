import { describe, expect, test } from "vitest";
import {
  contactSchema,
  contactSubmissionSchema,
  CONTACT_FORM_COOLDOWN_MS,
} from "@/lib/contact";

describe("lib/contact schemas", () => {
  test("Scenario: commune contact requires commune field", () => {
    console.info("Scenario: contactSchema validates commune specific requirements");

    const result = contactSchema.safeParse({
      contactType: "commune",
      name: "Jean",
      email: "jean@example.org",
      function: "Maire",
      commune: "",
      organisme: "",
      message: "Bonjour, prenons rendez-vous.",
      consent: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("La commune doit contenir");
    }
  });

  test("Scenario: financier contact requires organisme field", () => {
    console.info("Scenario: contactSchema enforces organisme for financiers");

    const result = contactSchema.safeParse({
      contactType: "organisme_financier",
      name: "Camille",
      email: "camille@example.org",
      function: "Chargé de mission",
      commune: "",
      organisme: "",
      message: "Nous souhaitons soutenir le projet.",
      consent: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("organisme doit contenir");
    }
  });

  test("Scenario: submission schema accepts valid payload", () => {
    console.info("Scenario: contactSubmissionSchema accepts valid data");

    const result = contactSubmissionSchema.safeParse({
      contactType: "commune",
      name: "Marie",
      email: "marie@example.org",
      function: "Responsable",
      commune: "DemoCity",
      organisme: "",
      message: "Merci pour votre accompagnement.",
      consent: true,
      fingerprint: "fingerprint-1234567890",
    });

    expect(result.success).toBe(true);
  });

  test("Scenario: cooldown constant equals 72 hours in milliseconds", () => {
    console.info("Scenario: CONTACT_FORM_COOLDOWN_MS equals 72 hours");

    expect(CONTACT_FORM_COOLDOWN_MS).toBe(72 * 60 * 60 * 1000);
  });
});

