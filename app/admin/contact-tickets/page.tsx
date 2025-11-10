import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ContactTicketStatus, ContactTicketType } from "@prisma/client";
import { AdminContactTicketsDashboard, type ContactTicketRow } from "@/components/AdminContactTicketsDashboard";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

export const metadata: Metadata = {
  title: "Demandes de contact - Contribcit",
};

function mapTicketStatus(status: ContactTicketStatus): ContactTicketRow["status"] {
  return status;
}

function mapTicketType(contactType: ContactTicketType): ContactTicketRow["contactType"] {
  return contactType;
}

export default async function AdminContactTicketsPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    redirect("/admin");
  }

  const tickets = await prisma.contactTicket.findMany({
    orderBy: {
      createdAt: "desc",
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

  const initialTickets: ContactTicketRow[] = tickets.map((ticket) => ({
    id: ticket.id,
    contactType: mapTicketType(ticket.contactType),
    status: mapTicketStatus(ticket.status),
    name: ticket.name,
    email: ticket.email,
    function: ticket.function,
    commune: ticket.commune,
    organisme: ticket.organisme,
    message: ticket.message,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    processedAt: ticket.processedAt ? ticket.processedAt.toISOString() : null,
    processedBy: ticket.processedBy
      ? {
          id: ticket.processedBy.id,
          firstName: ticket.processedBy.firstName,
          lastName: ticket.processedBy.lastName,
          email: ticket.processedBy.email,
        }
      : null,
  }));

  return (
    <div className="fr-container fr-mx-auto">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <header className="fr-mb-6w">
            <h1 className="fr-display--sm fr-mb-2w">Demandes de contact</h1>
            <p className="fr-text--md fr-text-mention--grey fr-mb-0">
              Suivez et traitez les demandes reçues via le formulaire public.
            </p>
          </header>
          <AdminContactTicketsDashboard initialTickets={initialTickets} />
        </div>
      </div>
    </div>
  );
}

