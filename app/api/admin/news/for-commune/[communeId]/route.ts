import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    communeId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { communeId } = await context.params;

  try {
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

    // Récupérer toutes les annonces actives
    const allActiveNews = await prisma.news.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Récupérer les IDs des annonces déjà lues par cette commune
    const readNewsIds = await prisma.newsRead.findMany({
      where: {
        communeId,
      },
      select: {
        newsId: true,
      },
    });

    const readNewsIdSet = new Set(readNewsIds.map((r) => r.newsId));

    // Filtrer les annonces non lues et limiter à 3
    const unreadNews = allActiveNews
      .filter((news) => !readNewsIdSet.has(news.id))
      .slice(0, 3);

    return NextResponse.json({ news: unreadNews });
  } catch (error) {
    console.error("Failed to fetch news for commune", error);
    return NextResponse.json(
      {
        error: "Impossible de récupérer les annonces pour le moment.",
      },
      { status: 500 },
    );
  }
}

