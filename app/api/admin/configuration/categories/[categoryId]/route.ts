import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(280, "La description ne doit pas dépasser 280 caractères.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.isActive !== undefined,
    {
      message: "Aucune modification à appliquer.",
    },
  );

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

type RouteContext = {
  params: { categoryId: string } | Promise<{ categoryId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getSessionFromRequest(request);

  if (!session || !canManageConfiguration(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  const parseResult = updateSchema.safeParse(json);
  if (!parseResult.success) {
    const message =
      parseResult.error.issues[0]?.message ?? "Aucune modification à appliquer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { categoryId } = await context.params;

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  }

  try {
    const updated = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name: parseResult.data.name ?? undefined,
        description:
          parseResult.data.description !== undefined
            ? parseResult.data.description ?? null
            : undefined,
        isActive: parseResult.data.isActive ?? undefined,
      },
    });

    return NextResponse.json({
      category: serializeCategory(updated),
    });
  } catch (error) {
    const message =
      error instanceof Error &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string" &&
      (error as { code: string }).code === "P2002"
        ? "Une catégorie portant ce nom existe déjà pour cette commune."
        : "La mise à jour de la catégorie a échoué.";

    console.error("Failed to update category", error);

    return NextResponse.json(
      {
        error: message,
      },
      { status: message.includes("existe déjà") ? 409 : 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getSessionFromRequest(request);

  if (!session || !canManageConfiguration(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { categoryId } = await context.params;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  }

  const usageCount = await prisma.contribution.count({
    where: {
      categoryId: categoryId,
    },
  });

  if (usageCount > 0) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer cette catégorie tant qu’elle est associée à des remontées.",
      },
      { status: 409 },
    );
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return NextResponse.json({ success: true });
}


