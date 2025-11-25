import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSafeModeSchema = z.object({
  safeModeEnabled: z.boolean(),
});

function ensureTownManagerOrEmployee(role: Role) {
  return role === "TOWN_MANAGER" || role === "TOWN_EMPLOYEE";
}

type RouteContext = {
  params: { communeId: string } | Promise<{ communeId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { communeId } = await context.params;

  if (!communeId) {
    return NextResponse.json(
      { error: "Identifiant de commune manquant." },
      { status: 400 }
    );
  }

  const session = await getSessionFromRequest(request);

  if (!session || !ensureTownManagerOrEmployee(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId || session.user.communeId !== communeId) {
    return NextResponse.json(
      { error: "Vous n'avez pas accès à cette commune." },
      { status: 403 }
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Aucune donnée fournie." },
      { status: 400 }
    );
  }

  const parseResult = updateSafeModeSchema.safeParse(payload);

  if (!parseResult.success) {
    const message =
      parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { safeModeEnabled } = parseResult.data;

  try {
    const commune = await prisma.commune.findUnique({
      where: { id: communeId },
      select: {
        id: true,
        safeModeEnabled: true,
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 }
      );
    }

    const updatedCommune = await prisma.commune.update({
      where: { id: communeId },
      data: {
        safeModeEnabled,
      },
      select: {
        id: true,
        safeModeEnabled: true,
      },
    });

    return NextResponse.json({
      commune: updatedCommune,
    });
  } catch (error) {
    console.error("Failed to update safe mode", error);
    return NextResponse.json(
      { error: "Une erreur est survenue pendant la mise à jour." },
      { status: 500 }
    );
  }
}

