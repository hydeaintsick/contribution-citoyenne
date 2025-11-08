import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ContributionStatus } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  action: z.literal("close"),
  closureNote: z
    .string()
    .trim()
    .max(500, "Le message de clôture ne doit pas dépasser 500 caractères.")
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

    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.CLOSED,
        closedAt: now,
        closureNote: parseResult.data.closureNote,
        closedById: session.user.id,
      },
      select: {
        id: true,
        type: true,
        status: true,
        categoryLabel: true,
        subcategory: true,
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

    return NextResponse.json({
      contribution: {
        ...updatedContribution,
        createdAt: updatedContribution.createdAt.toISOString(),
        updatedAt: updatedContribution.updatedAt.toISOString(),
        closedAt: updatedContribution.closedAt
          ? updatedContribution.closedAt.toISOString()
          : null,
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

