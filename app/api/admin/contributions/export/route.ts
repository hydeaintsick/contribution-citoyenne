import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Fonction pour échapper les valeurs CSV
function escapeCsvValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  // Remplacer les retours à la ligne par des espaces
  const cleaned = value.replace(/\r\n/g, " ").replace(/\n/g, " ");
  // Si la valeur contient des guillemets, des virgules ou des sauts de ligne, l'entourer de guillemets et doubler les guillemets
  if (
    cleaned.includes('"') ||
    cleaned.includes(",") ||
    cleaned.includes("\n")
  ) {
    return `"${cleaned.replace(/"/g, '""')}"`;
  }
  return cleaned;
}

// Fonction pour formater la date en français
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    !["TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Aucune commune associée." },
      { status: 403 }
    );
  }

  try {
    // Récupérer toutes les contributions de la commune
    const contributions = await prisma.contribution.findMany({
      where: {
        communeId: session.user.communeId,
      },
      select: {
        createdAt: true,
        categoryLabel: true,
        details: true,
        locationLabel: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Générer le CSV
    const csvRows: string[] = [];

    // En-têtes
    csvRows.push("Date,Catégorie,Contenu,Lieu");

    // Données
    for (const contribution of contributions) {
      const date = escapeCsvValue(formatDate(contribution.createdAt));
      const category = escapeCsvValue(contribution.categoryLabel);
      const content = escapeCsvValue(contribution.details);
      const location = escapeCsvValue(contribution.locationLabel);

      csvRows.push(`${date},${category},${content},${location}`);
    }

    const csvContent = csvRows.join("\n");

    // Retourner le fichier CSV avec les bons headers
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="retours-citoyens-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export contributions", error);
    return NextResponse.json(
      { error: "L'export des contributions est impossible pour le moment." },
      { status: 500 }
    );
  }
}
