import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

const createSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide.")
    .max(2000, "Le commentaire est trop long."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
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

  const bugReport = await prisma.bugReport.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!bugReport) {
    return NextResponse.json(
      { error: "Signalement introuvable." },
      { status: 404 },
    );
  }

  try {
    const comment = await prisma.bugReportComment.create({
      data: {
        bugReportId: bugReport.id,
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
      console.error("Bug report comment creation failed", error);
      return NextResponse.json(
        { error: "Impossible d'ajouter le commentaire." },
        { status: 500 },
      );
    }

    throw error;
  }
}

