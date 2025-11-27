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
      { status: 403 }
    );
  }

  try {
    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: {
        hasPremiumAccess: true,
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 }
      );
    }

    const hasPremiumAccess =
      (commune as { hasPremiumAccess?: boolean }).hasPremiumAccess ?? false;

    return NextResponse.json(
      { hasPremiumAccess },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch premium access", error);
    return NextResponse.json(
      { error: "Impossible de récupérer l'accès premium." },
      { status: 500 }
    );
  }
}
