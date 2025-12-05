import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  getCommuneStatsByRegion,
  getAccountManagerStats,
  getCommuneProgression,
} from "@/lib/crm";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const [regionStats, accountManagerStats, progression] = await Promise.all([
      getCommuneStatsByRegion(),
      getAccountManagerStats(),
      getCommuneProgression(startDate, endDate),
    ]);

    return NextResponse.json({
      regions: regionStats,
      accountManagers: accountManagerStats,
      progression,
    });
  } catch (error) {
    console.error("Failed to fetch CRM stats", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les statistiques pour le moment." },
      { status: 500 },
    );
  }
}

