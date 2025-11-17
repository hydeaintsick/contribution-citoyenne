import { notFound } from "next/navigation";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

type RouteParams = {
  params: Promise<{
    ticketNumber: string;
  }>;
};

type TicketData = {
  id: string;
  ticketNumber: string;
  type: "ALERT" | "SUGGESTION";
  status: "OPEN" | "CLOSED";
  title: string;
  details: string;
  categoryLabel: string;
  categoryColor: string | null;
  categoryTextColor: string | null;
  locationLabel: string | null;
  communeName: string;
  createdAt: Date;
  closedAt: Date | null;
  closureNote: string | null;
};

const DEFAULT_CATEGORY_BADGE_COLOR = "#E5E5F4";
const DEFAULT_CATEGORY_BADGE_TEXT_COLOR = "#161616";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function fetchTicket(ticketNumber: string): Promise<TicketData | null> {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: {
        ticketNumber: ticketNumber.toUpperCase(),
      },
      select: {
        id: true,
        ticketNumber: true,
        type: true,
        status: true,
        title: true,
        details: true,
        categoryLabel: true,
        category: {
          select: {
            badgeColor: true,
            badgeTextColor: true,
          },
        },
        locationLabel: true,
        createdAt: true,
        closedAt: true,
        closureNote: true,
        commune: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!contribution) {
      return null;
    }

    return {
      id: contribution.id,
      ticketNumber: contribution.ticketNumber!,
      type: contribution.type,
      status: contribution.status,
      title: contribution.title,
      details: contribution.details,
      categoryLabel: contribution.categoryLabel,
      categoryColor: contribution.category?.badgeColor ?? null,
      categoryTextColor: contribution.category?.badgeTextColor ?? null,
      locationLabel: contribution.locationLabel,
      communeName: contribution.commune.name,
      createdAt: contribution.createdAt,
      closedAt: contribution.closedAt,
      closureNote: contribution.closureNote,
    };
  } catch (error) {
    console.error("Failed to fetch ticket", error);
    return null;
  }
}

export default async function TicketStatusPage({ params }: RouteParams) {
  const { ticketNumber } = await params;

  if (!ticketNumber || ticketNumber.length !== 10) {
    notFound();
  }

  const ticket = await fetchTicket(ticketNumber.toUpperCase());

  if (!ticket) {
    notFound();
  }

  const isClosed = ticket.status === "CLOSED";
  const hasResponse = isClosed && ticket.closureNote;
  const sanitizedClosureNote = ticket.closureNote
    ? sanitizeHtml(ticket.closureNote)
    : null;

  return (
    <div className="fr-container fr-container--fluid fr-px-2w fr-px-md-4w fr-py-6w">
      <div className="fr-flow">
        <header className="fr-flow">
          <h1 className="fr-h3 fr-mb-1">Suivi de votre retour</h1>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Numéro de ticket : <strong>{ticket.ticketNumber}</strong>
          </p>
        </header>

        <Stepper
          currentStep={hasResponse ? 2 : 1}
          stepCount={2}
          title={
            hasResponse
              ? "Votre mairie vous a répondu"
              : "En attente de lecture par votre mairie"
          }
          nextTitle={hasResponse ? undefined : "Réponse de votre mairie"}
          className="fr-mb-4w"
        />

        <div className="fr-card fr-card--no-border fr-card--shadow">
          <div className="fr-card__body" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
            <h2 className="fr-h4 fr-mb-2w">{ticket.title}</h2>
            
            <div className="fr-text--sm fr-text-mention--grey fr-mb-3w">
              <p className="fr-mb-1w">
                Créé le {dateFormatter.format(ticket.createdAt)} •{" "}
                {ticket.communeName}
              </p>
              {ticket.locationLabel && (
                <p className="fr-mb-2w">
                  <strong>Lieu :</strong> {ticket.locationLabel}
                </p>
              )}
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mb-3w" style={{ alignItems: "center" }}>
              <div className="fr-col-auto">
                <Badge
                  small
                  severity={ticket.type === "ALERT" ? "error" : "info"}
                >
                  {ticket.type === "ALERT" ? "Alerte" : "Suggestion"}
                </Badge>
              </div>
              <div className="fr-col-auto">
                <Badge
                  small
                  severity={isClosed ? "success" : "warning"}
                >
                  {isClosed ? "Traité" : "En attente"}
                </Badge>
              </div>
              {ticket.categoryLabel && (
                <div className="fr-col-auto" style={{ display: "flex", alignItems: "center" }}>
                  <Badge
                    small
                    style={{
                      backgroundColor:
                        ticket.categoryColor ?? DEFAULT_CATEGORY_BADGE_COLOR,
                      color:
                        ticket.categoryTextColor ??
                        DEFAULT_CATEGORY_BADGE_TEXT_COLOR,
                    }}
                  >
                    {ticket.categoryLabel}
                  </Badge>
                </div>
              )}
            </div>

            <div className="fr-separator fr-mb-3w" />

            <div>
              <p className="fr-text--md fr-mb-2w">
                <strong>Description :</strong>
              </p>
              <p className="fr-text--md fr-mb-0">{ticket.details}</p>
            </div>
          </div>
        </div>

        <div className="fr-mt-4w">
          {hasResponse ? (
          <Alert
            severity="success"
            title="Réponse de votre mairie"
            description={
              <div className="fr-flow">
                {ticket.closedAt && (
                  <p className="fr-text--sm fr-mb-0">
                    Répondu le{" "}
                    {dateFormatter.format(ticket.closedAt)}
                  </p>
                )}
                <div
                  className="fr-text--md"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedClosureNote || "",
                  }}
                />
              </div>
            }
          />
        ) : (
          <Alert
            severity="info"
            title="En attente de traitement"
            description="Votre retour a bien été transmis à votre mairie. Elle va l'examiner dans les meilleurs délais. Vous recevrez une notification par email si vous avez laissé votre adresse email lors de la soumission."
          />
          )}
        </div>

        <div className="fr-mt-4w">
          <Button
            priority="secondary"
            iconId="fr-icon-arrow-left-line"
            linkProps={{ href: "/" }}
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}

