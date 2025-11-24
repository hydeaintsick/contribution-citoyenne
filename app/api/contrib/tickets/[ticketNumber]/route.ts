import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    ticketNumber: string;
  }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { ticketNumber } = await context.params;

  if (!ticketNumber || ticketNumber.length !== 10) {
    return NextResponse.json(
      { error: "Numéro de ticket invalide." },
      { status: 400 }
    );
  }

  try {
    const contribution = await prisma.contribution.findUnique({
      where: {
        ticketNumber: ticketNumber.toUpperCase(),
      },
      select: {
        id: true,
        ticketNumber: true,
        type: true,
        status: true,
        title: true,
        details: true,
        categoryLabel: true,
        category: {
          select: {
            badgeColor: true,
            badgeTextColor: true,
          },
        },
        locationLabel: true,
        createdAt: true,
        closedAt: true,
        closureNote: true,
        isPotentiallyMalicious: true,
        commune: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: "Ticket introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticket: {
        id: contribution.id,
        ticketNumber: contribution.ticketNumber,
        type: contribution.type,
        status: contribution.status,
        title: contribution.title,
        details: contribution.details,
        categoryLabel: contribution.categoryLabel,
        categoryColor: contribution.category?.badgeColor ?? null,
        categoryTextColor: contribution.category?.badgeTextColor ?? null,
        locationLabel: contribution.locationLabel,
        communeName: contribution.commune.name,
        createdAt: contribution.createdAt.toISOString(),
        closedAt: contribution.closedAt
          ? contribution.closedAt.toISOString()
          : null,
        closureNote: contribution.closureNote,
        isPotentiallyMalicious: contribution.isPotentiallyMalicious,
      },
    });
  } catch (error) {
    console.error("Failed to fetch ticket", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le ticket pour le moment." },
      { status: 500 }
    );
  }
}

