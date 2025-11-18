import { NextResponse } from "next/server";
import { BugReportStatus, BugReportType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken, getClientIp } from "@/lib/turnstile";

export const runtime = "nodejs";

const screenshotSchema = z.object({
  url: z.string().url(),
  publicId: z.string().trim().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
});

const bugReportSchema = z.object({
  type: z
    .enum(["BUG", "FEATURE", "FONCTIONNALITE"])
    .transform((value) => (value === "FONCTIONNALITE" ? "FEATURE" : value)),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(12).max(2000),
  screenshot: screenshotSchema.optional(),
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

type BugReportPayload = z.infer<typeof bugReportSchema>;

function mapBugReportType(value: BugReportPayload["type"]) {
  if (value === "BUG") {
    return BugReportType.BUG;
  }

  return BugReportType.FEATURE;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalide." },
      { status: 400 }
    );
  }

  const parsed = bugReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Le formulaire est invalide.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 1. Check honeypot field (bots often fill all fields)
  if (data.honeypot && data.honeypot.trim().length > 0) {
    console.warn("Bot detected: honeypot field filled", {
      honeypot: data.honeypot,
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
  if (data.turnstileToken) {
    const turnstileResult = await verifyTurnstileToken(
      data.turnstileToken,
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
    const bugReport = await prisma.bugReport.create({
      data: {
        type: mapBugReportType(data.type),
        title: data.title.trim(),
        description: data.description.trim(),
        status: BugReportStatus.TO_BE_QUALIFIED,
        screenshotUrl: data.screenshot?.url ?? null,
        screenshotPublicId: data.screenshot?.publicId ?? null,
        screenshotWidth: data.screenshot?.width ?? null,
        screenshotHeight: data.screenshot?.height ?? null,
        screenshotBytes: data.screenshot?.bytes ?? null,
      } as Prisma.BugReportCreateInput,
    });

    console.info("Bug report created", {
      bugReportId: bugReport.id,
      type: bugReport.type,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Merci pour votre participation.",
      },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("Bug report creation failed", error);

    const response = NextResponse.json(
      {
        error:
          "Le signalement n’a pas pu être enregistré. Merci de réessayer plus tard.",
      },
      { status: 500 }
    );

    return response;
  }
}
