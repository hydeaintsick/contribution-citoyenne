import { GraphQLError } from "graphql";
import { prisma } from "@/lib/prisma";
import type { GraphQLContext } from "./auth";
import { buildTownDashboardData } from "@/lib/contributionStats";
import type { ContributionType, ContributionStatus } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Helper pour créer un cursor à partir d'un ID
function createCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}

// Helper pour décoder un cursor
function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, "base64").toString("utf-8");
  } catch {
    throw new GraphQLError("Cursor invalide");
  }
}

// Helper pour la pagination
async function paginateContributions(
  communeId: string,
  filter: any,
  pagination: any,
) {
  const where: any = {
    communeId,
    ...(filter?.status && { status: filter.status }),
    ...(filter?.type && { type: filter.type }),
    ...(filter?.categoryId && { categoryId: filter.categoryId }),
    ...(filter?.startDate || filter?.endDate
      ? {
          createdAt: {
            ...(filter.startDate && { gte: new Date(filter.startDate) }),
            ...(filter.endDate && { lte: new Date(filter.endDate) }),
          },
        }
      : {}),
  };

  const totalCount = await prisma.contribution.count({ where });

  // Déterminer la direction et la limite
  const isForward = pagination?.first !== undefined || pagination?.after !== undefined;
  const limit = Math.min(
    pagination?.first || pagination?.last || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  let cursor: any = undefined;
  let skip = 0;

  if (pagination?.after) {
    const afterId = decodeCursor(pagination.after);
    cursor = { id: afterId };
    skip = 1;
  } else if (pagination?.before) {
    const beforeId = decodeCursor(pagination.before);
    cursor = { id: beforeId };
    skip = 1;
  }

  // Pour la pagination en arrière, on doit inverser l'ordre de tri
  const orderBy = isForward
    ? { createdAt: "desc" as const }
    : { createdAt: "asc" as const };

  const contributions = await prisma.contribution.findMany({
    where,
    take: limit + 1, // Prendre un de plus pour vérifier s'il y a une page suivante
    skip,
    cursor: cursor ? { id: cursor.id } : undefined,
    orderBy,
    include: {
      commune: true,
      category: true,
      closedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const hasMore = contributions.length > limit;
  let edges = (hasMore ? contributions.slice(0, limit) : contributions).map(
    (contribution) => ({
      node: contribution,
      cursor: createCursor(contribution.id),
    }),
  );

  // Si on pagine en arrière, inverser l'ordre pour avoir le bon ordre chronologique
  if (!isForward) {
    edges.reverse();
  }

  return {
    edges,
    pageInfo: {
      hasNextPage: isForward ? hasMore : false,
      hasPreviousPage: !isForward ? hasMore : false,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
    totalCount,
  };
}

export const resolvers = {
  DateTime: {
    serialize: (value: Date) => value.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: any) => new Date(ast.value),
  },

  Query: {
    commune: async (_: any, __: any, context: GraphQLContext) => {
      const commune = await prisma.commune.findUnique({
        where: { id: context.communeId },
      });

      if (!commune) {
        throw new GraphQLError("Commune introuvable");
      }

      return commune;
    },

    contribution: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext,
    ) => {
      const contribution = await prisma.contribution.findFirst({
        where: {
          id,
          communeId: context.communeId, // Sécurité : filtrer par communeId
        },
        include: {
          commune: true,
          category: true,
          closedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return contribution;
    },

    contributions: async (
      _: any,
      {
        filter,
        pagination,
      }: {
        filter?: {
          status?: ContributionStatus;
          type?: ContributionType;
          categoryId?: string;
          startDate?: string;
          endDate?: string;
        };
        pagination?: {
          first?: number;
          after?: string;
          last?: number;
          before?: string;
        };
      },
      context: GraphQLContext,
    ) => {
      return paginateContributions(context.communeId, filter, pagination);
    },

    stats: async (
      _: any,
      {
        startDate,
        endDate,
      }: {
        startDate?: string;
        endDate?: string;
      },
      context: GraphQLContext,
    ) => {
      const commune = await prisma.commune.findUnique({
        where: { id: context.communeId },
        select: {
          id: true,
          bbox: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!commune) {
        throw new GraphQLError("Commune introuvable");
      }

      const where: any = {
        communeId: context.communeId,
      };

      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        };
      }

      const contributions = await prisma.contribution.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          latitude: true,
          longitude: true,
          locationLabel: true,
        },
      });

      const stats = buildTownDashboardData(
        contributions.map((c) => ({
          id: c.id,
          type: c.type,
          status: c.status,
          createdAt: c.createdAt,
          latitude: c.latitude,
          longitude: c.longitude,
          locationLabel: c.locationLabel,
        })),
        {
          bbox: commune.bbox,
          latitude: commune.latitude,
          longitude: commune.longitude,
        },
      );

      return stats;
    },

    categories: async (_: any, __: any, context: GraphQLContext) => {
      return prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    },
  },

  Contribution: {
    location: (contribution: any) => {
      if (!contribution.latitude && !contribution.longitude && !contribution.locationLabel) {
        return null;
      }
      return {
        label: contribution.locationLabel,
        latitude: contribution.latitude,
        longitude: contribution.longitude,
      };
    },

    photo: (contribution: any) => {
      if (!contribution.photoUrl) {
        return null;
      }
      return {
        url: contribution.photoUrl,
        publicId: contribution.photoPublicId,
      };
    },
  },

  ContributionMap: {
    bounds: (map: any) => {
      // Convertir [[lat, lng], [lat, lng]] en { southwest: [lat, lng], northeast: [lat, lng] }
      const bounds = map.bounds;
      if (Array.isArray(bounds) && bounds.length === 2) {
        return {
          southwest: bounds[0],
          northeast: bounds[1],
        };
      }
      // Fallback si le format n'est pas correct
      return {
        southwest: [0, 0],
        northeast: [0, 0],
      };
    },
  },
};

