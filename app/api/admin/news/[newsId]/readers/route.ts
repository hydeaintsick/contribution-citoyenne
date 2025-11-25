import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    newsId: string;
  }>;
};

export async function GET(
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

    // Récupérer les communes qui ont lu cette annonce
    const readers = await prisma.newsRead.findMany({
      where: {
        newsId,
      },
      select: {
        commune: {
          select: {
            id: true,
            name: true,
            postalCode: true,
          },
        },
        readAt: true,
      },
      orderBy: {
        readAt: "desc",
      },
    });

    return NextResponse.json({
      readers: readers.map((reader) => ({
        communeId: reader.commune.id,
        communeName: reader.commune.name,
        postalCode: reader.commune.postalCode,
        readAt: reader.readAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch news readers", error);
    return NextResponse.json(
      {
        error: "Impossible de récupérer les communes pour le moment.",
      },
      { status: 500 },
    );
  }
}

