import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CityAuditAction, Role, Prisma } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const websiteUrlSchema = z
  .union([
    z.string().trim().length(0),
    z.string().trim().url("L’URL du site doit être valide."),
  ])
  .optional()
  .transform((value) => {
    if (!value || value.length === 0) {
      return null;
    }
    return value;
  });

const managerSchema = z
  .object({
    id: z.string().trim().min(1, "Identifiant du manager manquant."),
    email: z.string().email("Email du manager invalide."),
    firstName: z.string().trim().min(1, "Prénom du manager requis."),
    lastName: z.string().trim().min(1, "Nom du manager requis."),
    phone: z
      .union([
        z.string().trim().length(0),
        z.string().trim().min(3, "Téléphone trop court."),
      ])
      .optional()
      .transform((value) => {
        if (!value || value.length === 0) {
          return null;
        }
        return value;
      }),
  })
  .optional();

const updateSchema = z
  .object({
    websiteUrl: websiteUrlSchema,
    isVisible: z.boolean().optional(),
    isPartner: z.boolean().optional(),
    manager: managerSchema,
  })
  .refine(
    (value) =>
      typeof value.websiteUrl !== "undefined" ||
      typeof value.isVisible !== "undefined" ||
      typeof value.isPartner !== "undefined" ||
      typeof value.manager !== "undefined",
    { message: "Aucune modification demandée." }
  );

function ensureAdminOrAccountManager(role: Role) {
  return role === "ADMIN" || role === "ACCOUNT_MANAGER";
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

  if (!session || !ensureAdminOrAccountManager(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Aucune donnée fournie." },
      { status: 400 }
    );
  }

  const parseResult = updateSchema.safeParse(payload);

  if (!parseResult.success) {
    const message =
      parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { websiteUrl, isVisible, isPartner, manager } = parseResult.data;

  try {
    const updateResult = await prisma.$transaction(async (tx) => {
      const commune = await tx.commune.findUnique({
        where: { id: communeId },
        select: {
          id: true,
          name: true,
          slug: true,
          websiteUrl: true,
          isVisible: true,
          isPartner: true,
          users: {
            where: { role: "TOWN_MANAGER" },
            select: {
              id: true,
              email: true,
            },
            take: 1,
          },
        },
      });

      if (!commune) {
        throw new Error("COMMUNE_NOT_FOUND");
      }

      const updates: Record<string, unknown> = {};
      const auditDetails: Prisma.JsonObject = {};

      if (
        typeof websiteUrl !== "undefined" &&
        websiteUrl !== commune.websiteUrl
      ) {
        updates.websiteUrl = websiteUrl ?? null;
        auditDetails.websiteUrl = {
          before: commune.websiteUrl ?? null,
          after: websiteUrl ?? null,
        };
      }

      if (typeof isVisible !== "undefined" && isVisible !== commune.isVisible) {
        updates.isVisible = isVisible;
        auditDetails.isVisible = {
          before: commune.isVisible,
          after: isVisible,
        };
      }

      if (typeof isPartner !== "undefined" && isPartner !== commune.isPartner) {
        updates.isPartner = isPartner;
        auditDetails.isPartner = {
          before: commune.isPartner,
          after: isPartner,
        };
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedById = session.user.id;
        await tx.commune.update({
          where: { id: communeId },
          data: updates,
        });
      }

      if (manager) {
        const currentManager = commune.users[0];

        if (!currentManager || currentManager.id !== manager.id) {
          throw new Error("MANAGER_INVALID");
        }

        if (manager.email !== currentManager.email) {
          const existingEmail = await tx.user.findUnique({
            where: { email: manager.email },
            select: { id: true },
          });

          if (existingEmail && existingEmail.id !== manager.id) {
            throw new Error("MANAGER_EMAIL_EXISTS");
          }
        }

        await tx.user.update({
          where: { id: manager.id },
          data: {
            email: manager.email,
            firstName: manager.firstName,
            lastName: manager.lastName,
            phone: manager.phone,
          },
        });

        auditDetails.manager = {
          id: manager.id,
          email: manager.email,
        };
      }

      if (Object.keys(auditDetails).length > 0) {
        await tx.cityAuditLog.create({
          data: {
            communeId,
            userId: session.user.id,
            action: CityAuditAction.UPDATED,
            details: auditDetails,
          },
        });
      }

      const updatedCommune = await tx.commune.findUnique({
        where: { id: communeId },
        select: {
          id: true,
          name: true,
          slug: true,
          postalCode: true,
          websiteUrl: true,
          isVisible: true,
          isPartner: true,
          users: {
            where: { role: "TOWN_MANAGER" },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
            take: 1,
          },
        },
      });

      return updatedCommune;
    });

    return NextResponse.json({ commune: updateResult });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COMMUNE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Commune introuvable." },
          { status: 404 }
        );
      }
      if (error.message === "MANAGER_INVALID") {
        return NextResponse.json(
          { error: "Le manager indiqué n’est pas associé à cette commune." },
          { status: 400 }
        );
      }
      if (error.message === "MANAGER_EMAIL_EXISTS") {
        return NextResponse.json(
          { error: "Un compte utilise déjà cet email." },
          { status: 409 }
        );
      }
    }

    console.error("Failed to update commune", error);
    return NextResponse.json(
      { error: "La mise à jour de la commune est impossible pour le moment." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { communeId } = await context.params;

  if (!communeId) {
    return NextResponse.json(
      { error: "Identifiant de commune manquant." },
      { status: 400 }
    );
  }

  const session = await getSessionFromRequest(request);

  if (!session || !ensureAdminOrAccountManager(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const commune = await prisma.$transaction(async (tx) => {
      const existing = await tx.commune.findUnique({
        where: { id: communeId },
        select: {
          id: true,
          name: true,
          postalCode: true,
        },
      });

      if (!existing) {
        throw new Error("COMMUNE_NOT_FOUND");
      }

      await tx.user.deleteMany({
        where: {
          communeId,
        },
      });

      await tx.commune.delete({
        where: { id: communeId },
      });

      return existing;
    });

    return NextResponse.json({ deleted: commune });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMUNE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 }
      );
    }

    console.error("Failed to delete commune", error);
    return NextResponse.json(
      { error: "La suppression de la commune est impossible pour le moment." },
      { status: 500 }
    );
  }
}
