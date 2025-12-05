import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CityAuditAction, Role, Prisma } from "@prisma/client";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
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
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .optional()
      .or(z.literal("")),
  })
  .optional();

const updateSchema = z
  .object({
    websiteUrl: websiteUrlSchema,
    isVisible: z.boolean().optional(),
    isPartner: z.boolean().optional(),
    hasPremiumAccess: z.boolean().optional(),
    manager: managerSchema,
  })
  .refine(
    (value) =>
      typeof value.websiteUrl !== "undefined" ||
      typeof value.isVisible !== "undefined" ||
      typeof value.isPartner !== "undefined" ||
      typeof value.hasPremiumAccess !== "undefined" ||
      typeof value.manager !== "undefined",
    { message: "Aucune modification demandée." }
  );

function ensureAdminOrAccountManager(role: Role) {
  return role === "ADMIN" || role === "ACCOUNT_MANAGER";
}

type RouteContext = {
  params: { communeId: string } | Promise<{ communeId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { communeId } = await context.params;

  if (!communeId) {
    return NextResponse.json(
      { error: "Identifiant de commune manquant." },
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);

  if (!session || !ensureAdminOrAccountManager(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const whereClause: any = {
      id: communeId,
    };

    // Les ACCOUNT_MANAGER ne peuvent voir que leurs communes CRM
    // Soit celles qui leur sont assignées (accountManagerId), soit celles qu'ils ont créées (createdById)
    if (session.user.role === "ACCOUNT_MANAGER") {
      whereClause.OR = [
        { accountManagerId: session.user.id },
        { createdById: session.user.id, isVisible: false },
      ];
    }
    // Les ADMIN peuvent voir toutes les communes

    const commune = await prisma.commune.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        postalCode: true,
        slug: true,
        osmId: true,
        osmType: true,
        bbox: true,
        latitude: true,
        longitude: true,
        websiteUrl: true,
        isVisible: true,
        hasPremiumAccess: true,
        isPartner: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        accountManagerId: true,
        accountManager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
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
        comments: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            updatedAt: true,
            authorId: true,
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!commune) {
      return NextResponse.json(
        { error: "Commune introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      commune: {
        ...commune,
        createdAt: commune.createdAt.toISOString(),
        updatedAt: commune.updatedAt.toISOString(),
        comments: commune.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch commune", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la commune pour le moment." },
      { status: 500 },
    );
  }
}

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

  const { websiteUrl, isVisible, isPartner, hasPremiumAccess, manager } =
    parseResult.data;

  try {
    const updateResult = await prisma.$transaction(async (tx) => {
      const whereClause: any = {
        id: communeId,
      };

      // Les ACCOUNT_MANAGER ne peuvent modifier que leurs communes CRM
      // Soit celles qui leur sont assignées (accountManagerId), soit celles qu'ils ont créées (createdById)
      if (session.user.role === "ACCOUNT_MANAGER") {
        whereClause.OR = [
          { accountManagerId: session.user.id },
          { createdById: session.user.id, isVisible: false },
        ];
      }

      const commune = await tx.commune.findFirst({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          websiteUrl: true,
          isVisible: true,
          isPartner: true,
          hasPremiumAccess: true,
          accountManagerId: true,
          createdById: true,
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

      // Seuls les ADMIN peuvent modifier isVisible, isPartner et hasPremiumAccess
      if (session.user.role === "ADMIN") {
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

        if (typeof hasPremiumAccess !== "undefined") {
          const currentValue = commune.hasPremiumAccess ?? false;
          if (hasPremiumAccess !== currentValue) {
            updates.hasPremiumAccess = hasPremiumAccess;
            auditDetails.hasPremiumAccess = {
              before: currentValue,
              after: hasPremiumAccess,
            };
          }
        }
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

        const updateData: {
          email: string;
          firstName: string;
          lastName: string;
          phone: string | null;
          password?: string;
        } = {
          email: manager.email,
          firstName: manager.firstName,
          lastName: manager.lastName,
          phone: manager.phone,
        };

        if (manager.password && manager.password.length >= 8) {
          updateData.password = await hashPassword(manager.password);
        }

        await tx.user.update({
          where: { id: manager.id },
          data: updateData,
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
          hasPremiumAccess: true,
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
