import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z
    .string()
    .trim()
    .max(280, "La description ne doit pas dépasser 280 caractères.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  isActive: z.boolean().optional(),
});

function canManageConfiguration(role: string) {
  return role === "ADMIN" || role === "ACCOUNT_MANAGER";
}

function serializeCategory(category: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || !canManageConfiguration(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    categories: categories.map(serializeCategory),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || !canManageConfiguration(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json(
      { error: "Payload JSON invalide." },
      { status: 400 },
    );
  }

  const parseResult = createSchema.safeParse(json);

  if (!parseResult.success) {
    const message =
      parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, description, isActive } = parseResult.data;

  try {
    const created = await prisma.category.create({
      data: {
        name,
        description: description ?? null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        category: serializeCategory(created),
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string" &&
      (error as { code: string }).code === "P2002"
        ? "Une catégorie portant ce nom existe déjà pour cette commune."
        : "La création de la catégorie a échoué.";

    console.error("Failed to create category", error);

    return NextResponse.json(
      {
        error: message,
      },
      { status: message.includes("existe déjà") ? 409 : 500 },
    );
  }
}


