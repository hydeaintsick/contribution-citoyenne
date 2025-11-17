import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ContributionStatus } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTicketResponseEmail } from "@/lib/email";
import { sanitizeHtml } from "@/lib/sanitize";

const updateSchema = z.object({
  action: z.literal("close"),
  closureNote: z
    .string()
    .trim()
    .max(5000, "Le message de clôture ne doit pas dépasser 5000 caractères.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

type RouteContext = {
  params: { contributionId: string } | Promise<{ contributionId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { contributionId } = await context.params;

  if (!contributionId) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const session = await getSessionFromRequest(request);

  if (
    !session ||
    !["TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json({ error: "Aucune commune associée." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);

  const parseResult = updateSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Requête invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        communeId: true,
        status: true,
        email: true,
        ticketNumber: true,
        title: true,
        commune: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!contribution || contribution.communeId !== session.user.communeId) {
      return NextResponse.json({ error: "Contribution introuvable." }, { status: 404 });
    }

    if (contribution.status === ContributionStatus.CLOSED) {
      return NextResponse.json(
        { error: "La contribution est déjà clôturée." },
        { status: 409 },
      );
    }

    const now = new Date();

    // Sanitizer le HTML avant de le stocker pour prévenir les attaques XSS
    const sanitizedClosureNote = parseResult.data.closureNote
      ? sanitizeHtml(parseResult.data.closureNote)
      : null;

    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.CLOSED,
        closedAt: now,
        closureNote: sanitizedClosureNote,
        closedById: session.user.id,
      },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        categoryLabel: true,
        category: {
          select: {
            badgeColor: true,
            badgeTextColor: true,
          },
        },
        details: true,
        locationLabel: true,
        latitude: true,
        longitude: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        closureNote: true,
        closedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Envoyer un email de notification si l'email est présent, qu'il y a un message de clôture et un numéro de ticket
    if (
      contribution.email &&
      contribution.ticketNumber &&
      parseResult.data.closureNote &&
      updatedContribution.closureNote
    ) {
      try {
        await sendTicketResponseEmail({
          to: contribution.email,
          ticketNumber: contribution.ticketNumber,
          ticketTitle: contribution.title,
          communeName: contribution.commune.name,
          responseContent: updatedContribution.closureNote,
        });
      } catch (emailError) {
        // On log l'erreur mais on ne bloque pas la réponse
        console.error("Failed to send notification email", emailError);
      }
    }

    return NextResponse.json({
      contribution: {
        id: updatedContribution.id,
        type: updatedContribution.type,
        status: updatedContribution.status,
        title: updatedContribution.title,
        categoryLabel: updatedContribution.categoryLabel,
        categoryColor: updatedContribution.category?.badgeColor ?? null,
        categoryTextColor: updatedContribution.category?.badgeTextColor ?? null,
        details: updatedContribution.details,
        locationLabel: updatedContribution.locationLabel,
        latitude: updatedContribution.latitude,
        longitude: updatedContribution.longitude,
        photoUrl: updatedContribution.photoUrl,
        createdAt: updatedContribution.createdAt.toISOString(),
        updatedAt: updatedContribution.updatedAt.toISOString(),
        closedAt: updatedContribution.closedAt
          ? updatedContribution.closedAt.toISOString()
          : null,
        closureNote: updatedContribution.closureNote,
        closedBy: updatedContribution.closedBy,
      },
    });
  } catch (error) {
    console.error("Failed to update contribution", error);
    return NextResponse.json(
      { error: "La mise à jour de la contribution est impossible pour le moment." },
      { status: 500 },
    );
  }
}

