import { NextResponse } from "next/server";
import { z } from "zod";
import { ContributionStatus, ContributionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { predictCategory, detectMaliciousContent } from "@/lib/mistral";
import { generateUniqueTicketNumber } from "@/lib/ticket";
import { verifyTurnstileToken, getClientIp } from "@/lib/turnstile";
import { sendWebhookForContribution } from "@/lib/webhook";

export const runtime = "nodejs";

const reportSchema = z.object({
  communeId: z.string().min(1),
  type: z.enum(["alert", "suggestion"]),
  title: z.string().trim().min(3),
  details: z.string().min(12),
  email: z
    .string()
    .email("Email invalide")
    .optional()
    .nullable()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : null)),
  location: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  photo: z
    .object({
      url: z.string().url(),
      publicId: z.string().min(1),
    })
    .optional()
    .nullable(),
  coordinates: z
    .object({
      latitude: z.number().finite(),
      longitude: z.number().finite(),
    })
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  turnstileToken: z.string().optional().nullable(),
  honeypot: z.string().optional().nullable(),
});

// Simple in-memory rate limiting (for MVP)
// In production, consider using Redis or a database
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string | undefined): boolean {
  if (!ip) {
    // If we can't determine IP, allow but log
    console.warn("Could not determine client IP for rate limiting");
    return true;
  }

  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt < now) {
    // New IP or window expired, create new record
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  rateLimitStore.set(ip, record);
  return true;
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      if (record.resetAt < now) {
        rateLimitStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  // 1. Check honeypot field (bots often fill all fields)
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    console.warn("Bot detected: honeypot field filled", {
      honeypot: payload.honeypot,
    });
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }

  // 2. Rate limiting by IP
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    console.warn("Rate limit exceeded", { ip: clientIp });
    return NextResponse.json(
      {
        error:
          "Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.",
      },
      { status: 429 }
    );
  }

  // 3. Verify Turnstile token
  if (payload.turnstileToken) {
    const turnstileResult = await verifyTurnstileToken(
      payload.turnstileToken,
      clientIp
    );

    if (!turnstileResult.success) {
      console.warn("Turnstile verification failed", {
        errorCodes: turnstileResult["error-codes"],
        ip: clientIp,
      });
      return NextResponse.json(
        {
          error:
            "Vérification de sécurité échouée. Veuillez réessayer dans quelques instants.",
        },
        { status: 400 }
      );
    }
  } else {
    // If Turnstile is configured but token is missing, reject
    // (allows graceful degradation if Turnstile is not configured)
    if (process.env.TURNSTILE_SECRET_KEY) {
      console.warn("Turnstile token missing but secret key is configured", {
        ip: clientIp,
      });
      return NextResponse.json(
        {
          error:
            "Vérification de sécurité requise. Veuillez actualiser la page et réessayer.",
        },
        { status: 400 }
      );
    }
  }

  try {
    const commune = await prisma.commune.findUnique({
      where: {
        id: payload.communeId,
      },
      select: {
        id: true,
        isVisible: true,
      },
    });

    if (!commune || !commune.isVisible) {
      return NextResponse.json(
        { error: "Commune introuvable ou indisponible." },
        { status: 404 },
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (categories.length === 0) {
      return NextResponse.json(
        {
          error:
            "Aucune catégorie n’est disponible pour le moment. Contactez un administrateur.",
        },
        { status: 422 },
      );
    }

    const mistralResult = await predictCategory({
      categories: categories.map((category) => category.name),
      title: payload.title,
      details: payload.details,
    }).catch((error) => {
      console.error("Mistral classification failed", error);
      return null;
    });

    const isPotentiallyMalicious = await detectMaliciousContent({
      title: payload.title,
      details: payload.details,
    }).catch((error) => {
      console.error("Mistral malicious content detection failed", error);
      return false;
    });

    const normalizedCategoryName =
      mistralResult?.category ?? categories[0]?.name ?? null;

    if (!normalizedCategoryName) {
      return NextResponse.json(
        {
          error:
            "Impossible de déterminer une catégorie pour cette remontée. Merci de réessayer plus tard.",
        },
        { status: 503 },
      );
    }

    const matchedCategory = categories.find(
      (category) =>
        category.name.localeCompare(normalizedCategoryName, "fr", {
          sensitivity: "accent",
          usage: "search",
        }) === 0,
    );

    if (!matchedCategory) {
      return NextResponse.json(
        {
          error:
            "La catégorie déterminée n'est pas reconnue. Merci de réessayer ultérieurement.",
        },
        { status: 502 },
      );
    }

    // Générer un numéro de ticket unique
    const ticketNumber = await generateUniqueTicketNumber(async (tn) => {
      const existing = await prisma.contribution.findUnique({
        where: { ticketNumber: tn },
        select: { id: true },
      });
      return !!existing;
    });

    console.info("Generated ticket number:", ticketNumber);

    const contribution = await prisma.contribution.create({
      data: {
        communeId: commune.id,
        type:
          payload.type === "alert"
            ? ContributionType.ALERT
            : ContributionType.SUGGESTION,
        status: ContributionStatus.OPEN,
        categoryId: matchedCategory.id,
        categoryLabel: matchedCategory.name,
        title: payload.title.trim(),
        details: payload.details.trim(),
        email: payload.email ?? null,
        ticketNumber,
        locationLabel: payload.location ?? null,
        latitude: payload.coordinates?.latitude ?? null,
        longitude: payload.coordinates?.longitude ?? null,
        photoUrl: payload.photo?.url ?? null,
        photoPublicId: payload.photo?.publicId ?? null,
        isPotentiallyMalicious,
      },
    });

    console.info("Citizen report recorded", {
      contributionId: contribution.id,
      communeId: commune.id,
      type: contribution.type,
      category: matchedCategory.name,
      ticketNumber: contribution.ticketNumber,
      classificationConfidence: mistralResult?.confidence,
    });

    if (!contribution.ticketNumber) {
      console.error("WARNING: Contribution created without ticketNumber!", {
        contributionId: contribution.id,
      });
    }

    // Envoyer le webhook de manière asynchrone (ne pas bloquer la réponse)
    // Charger les données complètes nécessaires pour le webhook
    prisma.contribution
      .findUnique({
        where: { id: contribution.id },
        include: {
          commune: {
            select: {
              id: true,
              name: true,
              postalCode: true,
              webhookUrl: true,
              webhookSecret: true,
            },
          },
          category: true,
        },
      })
      .then((fullContribution) => {
        if (fullContribution) {
          return sendWebhookForContribution(fullContribution);
        }
      })
      .catch((error) => {
        console.error("Failed to send webhook for contribution", {
          contributionId: contribution.id,
          error,
        });
      });

    return NextResponse.json(
      {
        success: true,
        message: "Signalement enregistré. Merci pour votre contribution.",
        contribution: {
          id: contribution.id,
          communeId: contribution.communeId,
          type: contribution.type,
          status: contribution.status,
          categoryLabel: contribution.categoryLabel,
          categoryId: contribution.categoryId,
          title: contribution.title,
          ticketNumber: contribution.ticketNumber ?? null,
          locationLabel: contribution.locationLabel,
          latitude: contribution.latitude,
          longitude: contribution.longitude,
          createdAt: contribution.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Citizen report persistence failed", error);
    return NextResponse.json(
      {
        error:
          "L’enregistrement de votre remontée est impossible pour le moment. Merci de réessayer plus tard.",
      },
      { status: 500 },
    );
  }
}


