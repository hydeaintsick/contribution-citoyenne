import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "TOWN_MANAGER" && role !== "TOWN_EMPLOYEE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Commune manquante pour l'utilisateur." },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10),
      100,
    );

    const logs = await prisma.webhookLog.findMany({
      where: {
        communeId: session.user.communeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        url: true,
        statusCode: true,
        success: true,
        errorMessage: true,
        responseTime: true,
        contributionId: true,
        isTest: true,
        createdAt: true,
      },
    });

    // Convertir les dates en string pour la sérialisation JSON
    const logsWithStringDates = logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: logsWithStringDates });
  } catch (error) {
    console.error("Failed to fetch webhook logs", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les logs du webhook." },
      { status: 500 },
    );
  }
}

