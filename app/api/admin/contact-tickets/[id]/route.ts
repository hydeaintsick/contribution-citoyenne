import { NextRequest, NextResponse } from "next/server";
import { ContactTicketStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

const updateSchema = z.object({
  status: z.nativeEnum(ContactTicketStatus),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch (error) {
    console.warn("Invalid contact ticket update payload", error);
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Statut invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status } = parsed.data;
  const isResolved = status === ContactTicketStatus.RESOLVED;

  try {
    const ticket = await prisma.contactTicket.update({
      where: { id },
      data: {
        status,
        processedAt: isResolved ? new Date() : null,
        processedById: isResolved ? session.user.id : null,
      },
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
        consent: true,
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

    console.info("Contact ticket updated", {
      contactTicketId: ticket.id,
      status: ticket.status,
    });

    return NextResponse.json({
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        processedAt: ticket.processedAt ? ticket.processedAt.toISOString() : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
    }

    console.error("Failed to update contact ticket", error);
    return NextResponse.json(
      { error: "La mise à jour du ticket a échoué." },
      { status: 500 },
    );
  }
}

