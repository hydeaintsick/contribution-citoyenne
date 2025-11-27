import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWebhookSecret, sendTestWebhook } from "@/lib/webhook";

const updateWebhookSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .refine(
      (url) => {
        if (process.env.NODE_ENV === "production") {
          return url.startsWith("https://");
        }
        return true; // En développement, autoriser HTTP
      },
      {
        message: "L'URL doit utiliser HTTPS en production",
      },
    ),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "TOWN_MANAGER" && role !== "TOWN_EMPLOYEE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Commune manquante pour l'utilisateur." },
      { status: 403 },
    );
  }

  try {
    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      webhookUrl: commune.webhookUrl ?? null,
      webhookSecret: commune.webhookSecret ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch webhook config", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la configuration du webhook." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "TOWN_MANAGER" && role !== "TOWN_EMPLOYEE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Commune manquante pour l'utilisateur." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalide." },
      { status: 400 },
    );
  }

  const parsed = updateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Données invalides.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: {
        id: true,
        webhookSecret: true,
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 },
      );
    }

    // Générer un secret si il n'existe pas encore
    const secret = commune.webhookSecret ?? generateWebhookSecret();

    const updated = await prisma.commune.update({
      where: { id: session.user.communeId },
      data: {
        webhookUrl: parsed.data.url,
        webhookSecret: secret,
      },
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    return NextResponse.json({
      webhookUrl: updated.webhookUrl,
      webhookSecret: updated.webhookSecret,
    });
  } catch (error) {
    console.error("Failed to update webhook config", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour la configuration du webhook." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "TOWN_MANAGER" && role !== "TOWN_EMPLOYEE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Commune manquante pour l'utilisateur." },
      { status: 403 },
    );
  }

  try {
    await prisma.commune.update({
      where: { id: session.user.communeId },
      data: {
        webhookUrl: null,
        webhookSecret: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook config", error);
    return NextResponse.json(
      { error: "Impossible de désactiver le webhook." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "TOWN_MANAGER" && role !== "TOWN_EMPLOYEE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Commune manquante pour l'utilisateur." },
      { status: 403 },
    );
  }

  try {
    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: {
        id: true,
        name: true,
        postalCode: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 },
      );
    }

    if (!commune.webhookUrl || !commune.webhookSecret) {
      return NextResponse.json(
        { error: "Webhook non configuré." },
        { status: 400 },
      );
    }

    const result = await sendTestWebhook(commune);

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      responseTime: result.responseTime,
    });
  } catch (error) {
    console.error("Failed to test webhook", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors du test du webhook.",
      },
      { status: 500 },
    );
  }
}

