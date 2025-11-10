import { NextRequest, NextResponse } from "next/server";
import { ContactTicketStatus, ContactTicketType } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

function parseFilters<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: Set<T>,
): T[] {
  const values = params.getAll(key).flatMap((entry) => entry.split(","));

  return values
    .map((value) => value.trim())
    .filter((value): value is T => allowed.has(value as T));
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const allowedStatuses = new Set(Object.values(ContactTicketStatus));
  const statusFilters = parseFilters(searchParams, "status", allowedStatuses);

  const allowedTypes = new Set(Object.values(ContactTicketType));
  const typeFilters = parseFilters(searchParams, "contactType", allowedTypes);

  const search = searchParams.get("search")?.trim() ?? "";

  const tickets = await prisma.contactTicket.findMany({
    where: {
      ...(statusFilters.length > 0 ? { status: { in: statusFilters } } : {}),
      ...(typeFilters.length > 0 ? { contactType: { in: typeFilters } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { commune: { contains: search, mode: "insensitive" } },
              { organisme: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      contactType: true,
      status: true,
      name: true,
      email: true,
      function: true,
      commune: true,
      organisme: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      processedAt: true,
      processedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      processedAt: ticket.processedAt ? ticket.processedAt.toISOString() : null,
    })),
  });
}

