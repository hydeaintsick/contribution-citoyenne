import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

const createSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide.")
    .max(2000, "Le commentaire est trop long."),
});

type RouteContext = {
  params: { communeId: string } | Promise<{ communeId: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { communeId } = await context.params;

  if (!communeId) {
    return NextResponse.json(
      { error: "Identifiant de commune manquant." },
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const whereClause: any = {
    id: communeId,
  };

  // Les ACCOUNT_MANAGER ne peuvent voir que leurs communes CRM
  // Soit celles qui leur sont assignées (accountManagerId), soit celles qu'ils ont créées (createdById)
  if (session.user.role === "ACCOUNT_MANAGER") {
    whereClause.OR = [
      { accountManagerId: session.user.id },
      { createdById: session.user.id, isVisible: false },
    ];
  }

  const commune = await prisma.commune.findFirst({
    where: whereClause,
    select: { id: true },
  });

  if (!commune) {
    return NextResponse.json(
      { error: "Commune introuvable." },
      { status: 404 },
    );
  }

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json({ error: "Payload requis." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Commentaire invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const comment = await prisma.communeComment.create({
      data: {
        communeId: commune.id,
        message: parsed.data.message,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        message: comment.message,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        author: comment.author
          ? {
              id: comment.author.id,
              firstName: comment.author.firstName,
              lastName: comment.author.lastName,
              email: comment.author.email,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Commune comment creation failed", error);
      return NextResponse.json(
        { error: "Impossible d'ajouter le commentaire." },
        { status: 500 },
      );
    }

    throw error;
  }
}

