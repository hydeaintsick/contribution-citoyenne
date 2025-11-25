import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

type RouteContext = {
  params: Promise<{
    newsId: string;
  }>;
};

const updateNewsSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").optional(),
  content: z.string().trim().min(1, "Le contenu est requis.").optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { newsId } = await context.params;

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json(
      { error: "Veuillez fournir les informations à mettre à jour." },
      { status: 400 },
    );
  }

  const parseResult = updateNewsSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const existingNews = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: "Annonce introuvable." },
        { status: 404 },
      );
    }

    const updateData: {
      title?: string;
      content?: string;
      isActive?: boolean;
    } = {};

    if (parseResult.data.title !== undefined) {
      updateData.title = parseResult.data.title;
    }

    if (parseResult.data.content !== undefined) {
      updateData.content = sanitizeHtml(parseResult.data.content);
    }

    if (parseResult.data.isActive !== undefined) {
      updateData.isActive = parseResult.data.isActive;
    }

    const news = await prisma.news.update({
      where: { id: newsId },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("News update failed", error);
    return NextResponse.json(
      {
        error: "La mise à jour de l'annonce est impossible pour le moment.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { newsId } = await context.params;

  try {
    const existingNews = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: "Annonce introuvable." },
        { status: 404 },
      );
    }

    // Désactiver plutôt que supprimer pour garder l'historique
    await prisma.news.update({
      where: { id: newsId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News deletion failed", error);
    return NextResponse.json(
      {
        error: "La suppression de l'annonce est impossible pour le moment.",
      },
      { status: 500 },
    );
  }
}

