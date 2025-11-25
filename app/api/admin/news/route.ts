import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

const createNewsSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis."),
  content: z.string().trim().min(1, "Le contenu est requis."),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const news = await prisma.news.findMany({
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
        _count: {
          select: {
            reads: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      news: news.map((item) => ({
        ...item,
        readCount: item._count.reads,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch news", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les annonces pour le moment." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json(
      { error: "Veuillez fournir les informations de l'annonce." },
      { status: 400 },
    );
  }

  const parseResult = createNewsSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { title, content, isActive } = parseResult.data;

  try {
    // Sanitize le contenu HTML
    const sanitizedContent = sanitizeHtml(content);

    const news = await prisma.news.create({
      data: {
        title,
        content: sanitizedContent,
        isActive,
        createdById: session.user.id,
      },
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

    return NextResponse.json({ news }, { status: 201 });
  } catch (error) {
    console.error("News creation failed", error);
    return NextResponse.json(
      {
        error: "La création de l'annonce est impossible pour le moment.",
      },
      { status: 500 },
    );
  }
}

