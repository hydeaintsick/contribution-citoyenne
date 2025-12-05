import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCommuneStats } from "@/lib/communeStats";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // Pour les ACCOUNT_MANAGER, retourner des KPI différents
    if (session.user.role === "ACCOUNT_MANAGER") {
      const whereClause: any = {
        OR: [
          { accountManagerId: session.user.id },
          { createdById: session.user.id, isVisible: false },
        ],
      };

      const communes = await prisma.commune.findMany({
        where: whereClause,
        select: {
          id: true,
        },
      });

      // Calculer le CA du mois en cours (pour l'instant N/C)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // Pour l'instant, on retourne des valeurs par défaut
      // TODO: Implémenter le calcul réel du CA et MRR quand les données seront disponibles
      return NextResponse.json({
        kpi: {
          communesEnGestion: communes.length,
          caCeMois: null, // N/C
          mrrHt: 0, // En attente d'implémentation
        },
      });
    }

    // Pour les ADMIN, retourner les KPI existants
    const whereClause: any = {
      isVisible: true,
    };

    const communes = await prisma.commune.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        postalCode: true,
        bbox: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const stats = await buildCommuneStats(
      communes.map((commune) => ({
        id: commune.id,
        name: commune.name,
        postalCode: commune.postalCode,
        bbox: commune.bbox,
        createdAt: commune.createdAt,
      })),
    );

    return NextResponse.json({
      kpi: {
        communes: stats.totals.communes,
        population: stats.totals.population,
        surfaceKm2: stats.totals.surfaceKm2,
      },
    });
  } catch (error) {
    console.error("Failed to fetch KPI stats", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les KPI pour le moment." },
      { status: 500 },
    );
  }
}

