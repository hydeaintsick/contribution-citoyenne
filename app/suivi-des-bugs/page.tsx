import type { Metadata } from "next";
import Link from "next/link";
import {
  BUG_REPORT_STATUS_BADGES,
  BUG_REPORT_STATUS_LABELS,
  BUG_REPORT_TYPE_BADGES,
  BUG_REPORT_TYPE_LABELS,
  PUBLIC_BUG_REPORT_STATUSES,
} from "@/lib/bugReports";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Suivi des bugs publics - Contribcit",
  description:
    "Visualisez l’avancement des bugs et demandes de fonctionnalités retenus sur Contribcit.",
};

export const revalidate = 60;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

export default async function BugTrackingPage() {
  const bugReports = await prisma.bugReport.findMany({
    where: {
      status: {
        in: PUBLIC_BUG_REPORT_STATUSES,
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
  });

  const statusGroups = PUBLIC_BUG_REPORT_STATUSES.map((status) => ({
    status,
    reports: bugReports
      .filter((report) => report.status === status)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
  })).filter((group) => group.reports.length > 0);

  return (
    <main className="fr-py-9w fr-background-alt--grey">
      <section className="fr-container fr-pb-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-xl-9">
            <span className="fr-badge fr-badge--success fr-mb-3w">
              Transparence produit
            </span>
            <h1 className="fr-display--sm fr-mb-2w">Suivi des bugs publics</h1>
            <p className="fr-text--lg fr-mb-3w">
              Retrouvez ici les bugs et demandes de fonctionnalités planifiés ou en
              cours. Lorsque le statut passe à “Déployé” ou “Terminé”, la correction
              est disponible sur Contribcit.
            </p>
            <p className="fr-text--sm fr-mb-5w">
              Vous avez rencontré un autre problème ?{" "}
              <Link className="fr-link" href="/bug">
                Signaler un bug
              </Link>
              .
            </p>

            {statusGroups.length === 0 ? (
              <div className="fr-alert fr-alert--info">
                <p className="fr-alert__title">Aucun bug public pour le moment</p>
                <p className="fr-alert__desc">
                  Les prochains retours qualifiés apparaîtront ici dès qu’ils
                  seront planifiés.
                </p>
              </div>
            ) : (
              statusGroups.map((group) => (
                <section key={group.status} className="fr-mb-6w">
                  <header className="fr-mb-3w">
                    <span
                      className={`fr-badge ${BUG_REPORT_STATUS_BADGES[group.status]}`}
                    >
                      {BUG_REPORT_STATUS_LABELS[group.status]}
                    </span>
                  </header>

                  <div className="fr-grid-row fr-grid-row--gutters">
                    {group.reports.map((report) => (
                      <div key={report.id} className="fr-col-12">
                        <article className="fr-tile fr-tile--no-header">
                          <div className="fr-tile__body">
                            <div className="fr-mb-2w">
                              <h3 className="fr-h6 fr-mb-1w">{report.title}</h3>
                              <span
                                className={`fr-badge ${BUG_REPORT_TYPE_BADGES[report.type]} fr-mr-2w`}
                              >
                                {BUG_REPORT_TYPE_LABELS[report.type]}
                              </span>
                            </div>
                            <p className="fr-tile__desc fr-mb-2w">
                              {report.description}
                            </p>
                            <p className="fr-text--sm fr-mb-0">
                              Signalé le {formatDate(report.createdAt)} —{" "}
                              {report.resolvedAt
                                ? `Mis en production le ${formatDate(report.resolvedAt)}`
                                : `Dernière mise à jour le ${formatDate(report.updatedAt)}`}
                            </p>
                            {report.githubCommitUrl ? (
                              <p className="fr-mt-2w fr-text--sm fr-mb-0">
                                <a
                                  className="fr-link"
                                  href={report.githubCommitUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Voir le commit GitHub associé
                                </a>
                              </p>
                            ) : null}
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


