import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  Activity,
  ActivityType,
  ActivitiesResponse,
} from "@/lib/activities";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseActivityTypes(
  params: URLSearchParams,
  allowed: Set<ActivityType>,
): ActivityType[] {
  const values = params.getAll("types").flatMap((entry) => entry.split(","));

  return values
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is ActivityType => allowed.has(value as ActivityType));
}

function parseDate(dateString: string | null): Date | null {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function aggregateActivities(
  types: ActivityType[],
  startDate: Date | null,
  endDate: Date | null,
  communeId: string | null,
): Promise<Activity[]> {
  const activities: Activity[] = [];
  const allowedTypes = new Set<ActivityType>([
    "USER_LOGIN",
    "CONTRIBUTION_CREATED",
    "CONTRIBUTION_CLOSED",
    "CONTRIBUTION_UPDATED",
    "CITY_AUDIT",
    "CONTACT_TICKET_PROCESSED",
  ]);

  const shouldInclude = (type: ActivityType) =>
    types.length === 0 || types.includes(type);

  // Get commune name if filtering by communeId (needed for ContactTicket filtering)
  let communeName: string | null = null;
  if (communeId) {
    const commune = await prisma.commune.findUnique({
      where: { id: communeId },
      select: { name: true },
    });
    communeName = commune?.name ?? null;
  }

  // USER_LOGIN activities
  if (shouldInclude("USER_LOGIN")) {
    const loginLogs = await prisma.userLoginLog.findMany({
      where: {
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(communeId
          ? {
              user: {
                communeId,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            commune: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const log of loginLogs) {
      activities.push({
        id: `login-${log.id}`,
        type: "USER_LOGIN",
        timestamp: log.createdAt.toISOString(),
        user: log.user
          ? {
              id: log.user.id,
              email: log.user.email,
              firstName: log.user.firstName,
              lastName: log.user.lastName,
            }
          : null,
        metadata: {
          type: "USER_LOGIN",
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          communeId: log.user?.commune?.id ?? null,
          communeName: log.user?.commune?.name ?? null,
        },
      });
    }
  }

  // CONTRIBUTION activities
  const contributionTypes: ActivityType[] = [
    "CONTRIBUTION_CREATED",
    "CONTRIBUTION_CLOSED",
    "CONTRIBUTION_UPDATED",
  ];
  const needsContributions =
    contributionTypes.some((type) => shouldInclude(type));

  if (needsContributions) {
    const contributions = await prisma.contribution.findMany({
      where: {
        ...(communeId ? { communeId } : {}),
        ...(startDate || endDate
          ? {
              OR: [
                ...(shouldInclude("CONTRIBUTION_CREATED")
                  ? [
                      {
                        createdAt: {
                          ...(startDate ? { gte: startDate } : {}),
                          ...(endDate ? { lte: endDate } : {}),
                        },
                      },
                    ]
                  : []),
                ...(shouldInclude("CONTRIBUTION_CLOSED")
                  ? [
                      {
                        closedAt: {
                          ...(startDate ? { gte: startDate } : {}),
                          ...(endDate ? { lte: endDate } : {}),
                          not: null,
                        },
                      },
                    ]
                  : []),
                ...(shouldInclude("CONTRIBUTION_UPDATED")
                  ? [
                      {
                        updatedAt: {
                          ...(startDate ? { gte: startDate } : {}),
                          ...(endDate ? { lte: endDate } : {}),
                        },
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      include: {
        commune: {
          select: {
            id: true,
            name: true,
          },
        },
        closedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const contribution of contributions) {
      // Created activity
      if (
        shouldInclude("CONTRIBUTION_CREATED") &&
        (!startDate || contribution.createdAt >= startDate) &&
        (!endDate || contribution.createdAt <= endDate)
      ) {
        activities.push({
          id: `contribution-created-${contribution.id}`,
          type: "CONTRIBUTION_CREATED",
          timestamp: contribution.createdAt.toISOString(),
          user: null,
          metadata: {
            type: "CONTRIBUTION_CREATED",
            contributionId: contribution.id,
            communeId: contribution.communeId,
            communeName: contribution.commune.name,
            contributionTitle: contribution.title || "Sans titre",
          },
        });
      }

      // Closed activity
      if (
        contribution.closedAt &&
        shouldInclude("CONTRIBUTION_CLOSED") &&
        (!startDate || contribution.closedAt >= startDate) &&
        (!endDate || contribution.closedAt <= endDate)
      ) {
        activities.push({
          id: `contribution-closed-${contribution.id}`,
          type: "CONTRIBUTION_CLOSED",
          timestamp: contribution.closedAt.toISOString(),
          user: contribution.closedBy
            ? {
                id: contribution.closedBy.id,
                email: contribution.closedBy.email,
                firstName: contribution.closedBy.firstName,
                lastName: contribution.closedBy.lastName,
              }
            : null,
          metadata: {
            type: "CONTRIBUTION_CLOSED",
            contributionId: contribution.id,
            communeId: contribution.communeId,
            communeName: contribution.commune.name,
            contributionTitle: contribution.title || "Sans titre",
          },
        });
      }

      // Updated activity (only if updatedAt is different from createdAt)
      if (
        shouldInclude("CONTRIBUTION_UPDATED") &&
        contribution.updatedAt.getTime() !==
          contribution.createdAt.getTime() &&
        (!startDate || contribution.updatedAt >= startDate) &&
        (!endDate || contribution.updatedAt <= endDate)
      ) {
        activities.push({
          id: `contribution-updated-${contribution.id}-${contribution.updatedAt.getTime()}`,
          type: "CONTRIBUTION_UPDATED",
          timestamp: contribution.updatedAt.toISOString(),
          user: null,
          metadata: {
            type: "CONTRIBUTION_UPDATED",
            contributionId: contribution.id,
            communeId: contribution.communeId,
            communeName: contribution.commune.name,
            contributionTitle: contribution.title || "Sans titre",
          },
        });
      }
    }
  }

  // CITY_AUDIT activities
  if (shouldInclude("CITY_AUDIT")) {
    const auditLogs = await prisma.cityAuditLog.findMany({
      where: {
        ...(communeId ? { communeId } : {}),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        commune: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const log of auditLogs) {
      activities.push({
        id: `city-audit-${log.id}`,
        type: "CITY_AUDIT",
        timestamp: log.createdAt.toISOString(),
        user: log.user
          ? {
              id: log.user.id,
              email: log.user.email,
              firstName: log.user.firstName,
              lastName: log.user.lastName,
            }
          : null,
        metadata: {
          type: "CITY_AUDIT",
          communeId: log.communeId,
          communeName: log.commune.name,
          action: log.action,
          details: log.details,
        },
      });
    }
  }

  // CONTACT_TICKET_PROCESSED activities
  if (shouldInclude("CONTACT_TICKET_PROCESSED")) {
    const tickets = await prisma.contactTicket.findMany({
      where: {
        processedAt: {
          not: null,
          ...(startDate || endDate
            ? {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              }
            : {}),
        },
        ...(communeName
          ? {
              commune: communeName,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        commune: true,
        processedAt: true,
        processedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        processedAt: "desc",
      },
    });

    for (const ticket of tickets) {
      if (ticket.processedAt) {
        activities.push({
          id: `contact-ticket-processed-${ticket.id}`,
          type: "CONTACT_TICKET_PROCESSED",
          timestamp: ticket.processedAt.toISOString(),
          user: ticket.processedBy
            ? {
                id: ticket.processedBy.id,
                email: ticket.processedBy.email,
                firstName: ticket.processedBy.firstName,
                lastName: ticket.processedBy.lastName,
              }
            : null,
          metadata: {
            type: "CONTACT_TICKET_PROCESSED",
            ticketId: ticket.id,
            contactName: ticket.name,
            contactEmail: ticket.email,
            communeName: ticket.commune ?? null,
          },
        });
      }
    }
  }

  // Sort all activities by timestamp descending
  activities.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return activities;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const allowedTypes = new Set<ActivityType>([
    "USER_LOGIN",
    "CONTRIBUTION_CREATED",
    "CONTRIBUTION_CLOSED",
    "CONTRIBUTION_UPDATED",
    "CITY_AUDIT",
    "CONTACT_TICKET_PROCESSED",
  ]);

  const types = parseActivityTypes(searchParams, allowedTypes);
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));
  const communeId = searchParams.get("communeId") || null;

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10)),
  );

  try {
    const allActivities = await aggregateActivities(types, startDate, endDate, communeId);

    const total = allActivities.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedActivities = allActivities.slice(startIndex, endIndex);

    const response: ActivitiesResponse = {
      activities: paginatedActivities,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch activities", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les activités pour le moment." },
      { status: 500 },
    );
  }
}

