import { NextRequest, NextResponse } from "next/server";
import { ContactTicketType } from "@prisma/client";
import {
  CONTACT_FORM_COOLDOWN_MS,
  contactSubmissionSchema,
  type ContactSubmissionData,
} from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mapContactType(
  value: ContactSubmissionData["contactType"],
): ContactTicketType {
  switch (value) {
    case "organisme_financier":
      return ContactTicketType.ORGANISME_FINANCIER;
    case "ministere_public":
      return ContactTicketType.MINISTERE_PUBLIC;
    default:
      return ContactTicketType.COMMUNE;
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.warn("Invalid contact ticket payload", error);
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = contactSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation invalide.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const cutoffDate = new Date(Date.now() - CONTACT_FORM_COOLDOWN_MS);

  const recentTicket = await prisma.contactTicket.findFirst({
    where: {
      fingerprint: data.fingerprint,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
    },
  });

  if (recentTicket) {
    const nextAllowedDate = new Date(recentTicket.createdAt.getTime() + CONTACT_FORM_COOLDOWN_MS);
    return NextResponse.json(
      {
        error: "Vous avez déjà envoyé une demande récemment. Prochaine demande possible dans 72h.",
        retryAfter: nextAllowedDate.toISOString(),
      },
      { status: 429 },
    );
  }

  try {
    const ticket = await prisma.contactTicket.create({
      data: {
        contactType: mapContactType(data.contactType),
        fingerprint: data.fingerprint,
        name: data.name.trim(),
        email: data.email.trim(),
        function: data.function.trim(),
        commune: data.commune?.trim() || null,
        organisme: data.organisme?.trim() || null,
        message: data.message.trim(),
        consent: data.consent,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    console.info("Contact ticket created", {
      contactTicketId: ticket.id,
      createdAt: ticket.createdAt.toISOString(),
    });

    const retryAfter = new Date(Date.now() + CONTACT_FORM_COOLDOWN_MS);

    return NextResponse.json(
      {
        id: ticket.id,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        retryAfter: retryAfter.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create contact ticket", error);
    return NextResponse.json(
      { error: "La création du ticket a échoué. Merci de réessayer plus tard." },
      { status: 500 },
    );
  }
}

