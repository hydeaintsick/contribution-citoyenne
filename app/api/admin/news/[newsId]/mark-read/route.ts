import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    newsId: string;
  }>;
};

const markReadSchema = z.object({
  communeId: z.string().min(1, "L'ID de la commune est requis."),
});

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { newsId } = await context.params;

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json(
      { error: "Veuillez fournir l'ID de la commune." },
      { status: 400 },
    );
  }

  const parseResult = markReadSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { communeId } = parseResult.data;

  try {
    // Vérifier que l'annonce existe
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true },
    });

    if (!news) {
      return NextResponse.json(
        { error: "Annonce introuvable." },
        { status: 404 },
      );
    }

    // Vérifier que la commune existe
    const commune = await prisma.commune.findUnique({
      where: { id: communeId },
      select: { id: true },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 },
      );
    }

    // Créer ou mettre à jour l'enregistrement NewsRead
    // Utiliser upsert pour éviter les doublons grâce à l'index unique
    await prisma.newsRead.upsert({
      where: {
        newsId_communeId: {
          newsId,
          communeId,
        },
      },
      create: {
        newsId,
        communeId,
      },
      update: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark news as read", error);
    return NextResponse.json(
      {
        error: "Impossible de marquer l'annonce comme lue pour le moment.",
      },
      { status: 500 },
    );
  }
}

