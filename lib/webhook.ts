import { prisma } from "./prisma";
import type { Contribution, Category } from "@prisma/client";
import { randomBytes } from "crypto";

const WEBHOOK_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Génère un secret fort de 32 caractères pour les webhooks
 */
export function generateWebhookSecret(): string {
  // Génère 32 caractères aléatoires (24 bytes = 32 caractères en base64)
  return randomBytes(24).toString("base64");
}

type WebhookRequestResult = {
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  responseTime: number;
};

/**
 * Fonction interne pour envoyer une requête webhook
 */
async function sendWebhookRequest(
  url: string,
  secret: string,
  payload: unknown,
): Promise<WebhookRequestResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const success = response.ok;
    const statusCode = response.status;

    if (!success) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        statusCode,
        errorMessage: `HTTP ${statusCode}: ${errorText.substring(0, 200)}`,
        responseTime,
      };
    }

    return {
      success: true,
      statusCode,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error
        ? error.message
        : error instanceof DOMException && error.name === "AbortError"
          ? "Timeout après 5 secondes"
          : "Erreur inconnue";

    return {
      success: false,
      errorMessage,
      responseTime,
    };
  }
}

type ContributionWithRelations = Contribution & {
  commune: {
    id: string;
    name: string;
    postalCode: string;
    webhookUrl: string | null;
    webhookSecret: string | null;
  };
  category: Category | null;
};

/**
 * Prépare le payload JSON pour un webhook de contribution
 */
function buildContributionPayload(
  contribution: ContributionWithRelations,
): unknown {
  return {
    event: "contribution.created",
    timestamp: new Date().toISOString(),
    contribution: {
      id: contribution.id,
      ticketNumber: contribution.ticketNumber,
      type: contribution.type,
      status: contribution.status,
      category: contribution.category
        ? {
            id: contribution.category.id,
            name: contribution.category.name,
          }
        : null,
      title: contribution.title,
      details: contribution.details,
      email: contribution.email,
      location: {
        label: contribution.locationLabel,
        latitude: contribution.latitude,
        longitude: contribution.longitude,
      },
      photo: contribution.photoUrl
        ? {
            url: contribution.photoUrl,
            publicId: contribution.photoPublicId,
          }
        : null,
      createdAt: contribution.createdAt.toISOString(),
      isPotentiallyMalicious: contribution.isPotentiallyMalicious,
    },
    commune: {
      id: contribution.commune.id,
      name: contribution.commune.name,
      postalCode: contribution.commune.postalCode,
    },
  };
}

/**
 * Prépare le payload JSON pour un test de webhook
 */
function buildTestPayload(commune: {
  id: string;
  name: string;
  postalCode: string;
}): unknown {
  return {
    event: "contribution.created",
    timestamp: new Date().toISOString(),
    contribution: {
      id: "test-contribution-id",
      ticketNumber: "TEST-XXXX",
      type: "ALERT",
      status: "OPEN",
      category: {
        id: "test-category-id",
        name: "Test",
      },
      title: "Message de test",
      details: "Ceci est un message de test envoyé depuis le tableau de bord Contribcit pour vérifier la configuration de votre webhook.",
      email: null,
      location: {
        label: "Adresse de test",
        latitude: 48.8566,
        longitude: 2.3522,
      },
      photo: null,
      createdAt: new Date().toISOString(),
      isPotentiallyMalicious: false,
    },
    commune: {
      id: commune.id,
      name: commune.name,
      postalCode: commune.postalCode,
    },
  };
}

/**
 * Envoie un webhook pour une contribution créée
 */
export async function sendWebhookForContribution(
  contribution: ContributionWithRelations,
): Promise<void> {
  const commune = contribution.commune;

  if (!commune.webhookUrl || !commune.webhookSecret) {
    return;
  }

  const payload = buildContributionPayload(contribution);
  const result = await sendWebhookRequest(
    commune.webhookUrl,
    commune.webhookSecret,
    payload,
  );

  // Enregistrer le log
  await prisma.webhookLog.create({
    data: {
      communeId: commune.id,
      url: commune.webhookUrl,
      statusCode: result.statusCode ?? null,
      success: result.success,
      errorMessage: result.errorMessage ?? null,
      responseTime: result.responseTime,
      contributionId: contribution.id,
      isTest: false,
    },
  });

  if (!result.success) {
    console.error("Webhook failed for contribution", {
      contributionId: contribution.id,
      communeId: commune.id,
      error: result.errorMessage,
      statusCode: result.statusCode,
    });
  }
}

/**
 * Envoie un webhook de test
 */
export async function sendTestWebhook(commune: {
  id: string;
  name: string;
  postalCode: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
}): Promise<WebhookRequestResult> {
  if (!commune.webhookUrl || !commune.webhookSecret) {
    throw new Error("Webhook non configuré pour cette commune");
  }

  const payload = buildTestPayload(commune);
  const result = await sendWebhookRequest(
    commune.webhookUrl,
    commune.webhookSecret,
    payload,
  );

  // Enregistrer le log
  await prisma.webhookLog.create({
    data: {
      communeId: commune.id,
      url: commune.webhookUrl,
      statusCode: result.statusCode ?? null,
      success: result.success,
      errorMessage: result.errorMessage ?? null,
      responseTime: result.responseTime,
      contributionId: null,
      isTest: true,
    },
  });

  return result;
}

