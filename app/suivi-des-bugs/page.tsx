import { BugReportStatus, Prisma } from "@prisma/client";
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

const PAGE_SIZE = 12;
const COMPLETED_STATUSES: BugReportStatus[] = ["DEPLOYED", "DONE"];
const numberFormatter = new Intl.NumberFormat("fr-FR");

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

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function isPromise<T>(
  value: Promise<T> | T | undefined,
): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<T>).then === "function"
  );
}

function toSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildPaginationSequence(current: number, total: number, maxLength = 7) {
  if (total <= maxLength) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const output: Array<number | "..."> = [];
  const siblings = 1;
  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);

  output.push(1);

  if (start > 2) {
    output.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    output.push(page);
  }

  if (end < total - 1) {
    output.push("...");
  }

  output.push(total);

  return output;
}

function createPageHref(page: number, searchTerm?: string) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (searchTerm) {
    params.set("q", searchTerm);
  }

  const query = params.toString();
  return query ? `/suivi-des-bugs?${query}` : "/suivi-des-bugs";
}

function Pagination({
  currentPage,
  totalPages,
  searchTerm,
}: {
  currentPage: number;
  totalPages: number;
  searchTerm?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const sequence = buildPaginationSequence(currentPage, totalPages);

  return (
    <nav
      className="fr-pagination fr-mb-5w"
      role="navigation"
      aria-label="Pagination des retours"
    >
      <ul className="fr-pagination__list">
        <li>
          {currentPage > 1 ? (
            <Link
              className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
              href={createPageHref(currentPage - 1, searchTerm)}
              scroll={false}
            >
              Page précédente
            </Link>
          ) : (
            <span className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label">
              Page précédente
            </span>
          )}
        </li>

        {sequence.map((entry, index) =>
          entry === "..." ? (
            <li key={`ellipsis-${index}`}>
              <span className="fr-pagination__link" aria-hidden="true">
                ...
              </span>
            </li>
          ) : (
            <li key={entry}>
              {entry === currentPage ? (
                <span
                  className="fr-pagination__link"
                  aria-current="page"
                >
                  {entry}
                </span>
              ) : (
                <Link
                  className="fr-pagination__link"
                  href={createPageHref(entry, searchTerm)}
                  scroll={false}
                >
                  {entry}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {currentPage < totalPages ? (
            <Link
              className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
              href={createPageHref(currentPage + 1, searchTerm)}
              scroll={false}
            >
              Page suivante
            </Link>
          ) : (
            <span className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label">
              Page suivante
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

function KpiCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="fr-col-12 fr-col-sm-4">
      <article className="fr-tile fr-tile--horizontal fr-tile--no-icon">
        <div className="fr-tile__body">
          <p className="fr-tag fr-tag--sm fr-mb-1w fr-text--bold">{label}</p>
          <p className="fr-text--lead fr-mb-1w">{value}</p>
          {description ? (
            <p className="fr-text--sm fr-text-mention--grey">{description}</p>
          ) : null}
        </div>
      </article>
    </div>
  );
}

export default async function BugTrackingPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = isPromise(searchParams)
    ? await searchParams
    : searchParams ?? {};

  const pageParam = toSingleValue(resolvedSearchParams.page);
  const parsedPage = Number(pageParam);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const rawSearchTerm = toSingleValue(resolvedSearchParams.q);
  const searchTerm = rawSearchTerm?.trim() ?? "";
  const hasSearchTerm = searchTerm.length > 0;

  const baseFilters: Prisma.BugReportWhereInput = {
      status: {
        in: PUBLIC_BUG_REPORT_STATUSES,
    },
  };

  const filteredWhere: Prisma.BugReportWhereInput = hasSearchTerm
    ? {
        ...baseFilters,
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      }
    : baseFilters;

  const [totalTrackedCount, treatedBugsCount, approvedFeaturesCount] =
    await Promise.all([
      prisma.bugReport.count({
        where: baseFilters,
      }),
      prisma.bugReport.count({
        where: {
          ...baseFilters,
          type: "BUG",
          status: {
            in: COMPLETED_STATUSES,
          },
        },
      }),
      prisma.bugReport.count({
        where: {
          ...baseFilters,
          type: "FEATURE",
          status: {
            in: COMPLETED_STATUSES,
          },
        },
      }),
    ]);

  const filteredCount = hasSearchTerm
    ? await prisma.bugReport.count({
        where: filteredWhere,
      })
    : totalTrackedCount;

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const bugReports = await prisma.bugReport.findMany({
    where: filteredWhere,
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

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

            <div className="fr-grid-row fr-grid-row--gutters fr-mb-7w">
              <KpiCard
                label="Retours publics suivis"
                value={formatNumber(totalTrackedCount)}
                description="Nombre total de bugs et fonctionnalités suivis."
              />
              <KpiCard
                label="Bugs traités"
                value={formatNumber(treatedBugsCount)}
                description="Corrections mises en production ou terminées."
              />
              <KpiCard
                label="Fonctionnalités approuvées"
                value={formatNumber(approvedFeaturesCount)}
                description="Évolutions disponibles pour la communauté."
              />
            </div>

            <form
              className="fr-search-bar fr-mb-6w"
              role="search"
              method="get"
              action="/suivi-des-bugs"
              aria-label="Recherche d'un bug ou d'une fonctionnalité"
            >
              <label className="fr-label" htmlFor="bug-search-input">
                Rechercher un bug ou une fonctionnalité
              </label>
              <input
                id="bug-search-input"
                name="q"
                className="fr-input"
                type="search"
                placeholder="Titre ou description"
                defaultValue={searchTerm}
              />
              <button className="fr-btn" type="submit">
                Rechercher
              </button>
            </form>
            {hasSearchTerm ? (
              <p className="fr-text--sm fr-mb-5w">
                Résultats pour <span className="fr-text--bold">{searchTerm}</span>.
                {" "}
                <Link className="fr-link fr-ml-2w" href="/suivi-des-bugs">
                  Réinitialiser
                </Link>
              </p>
            ) : null}

            {bugReports.length === 0 ? (
              <div className="fr-alert fr-alert--info">
                <p className="fr-alert__title">
                  {hasSearchTerm
                    ? "Aucun retour public ne correspond à votre recherche"
                    : "Aucun bug public pour le moment"}
                </p>
                <p className="fr-alert__desc">
                  {hasSearchTerm
                    ? "Essayez avec un autre mot-clé ou explorez l’ensemble des retours."
                    : "Les prochains retours qualifiés apparaîtront ici dès qu’ils seront planifiés."}
                </p>
              </div>
            ) : (
              <>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchTerm={hasSearchTerm ? searchTerm : undefined}
                />
                <div id="resultats" className="fr-grid-row fr-grid-row--gutters">
                  {bugReports.map((report) => (
                      <div key={report.id} className="fr-col-12">
                        <article className="fr-tile fr-tile--no-header">
                          <div className="fr-tile__body">
                          <div className="fr-mb-2w fr-grid-row fr-grid-row--middle">
                            <h3 className="fr-col fr-h5 fr-mb-0">{report.title}</h3>
                          </div>
                          <div className="fr-mb-3w">
                            <span
                              className={`fr-badge fr-badge--sm fr-mr-2w ${BUG_REPORT_STATUS_BADGES[report.status]}`}
                            >
                              {BUG_REPORT_STATUS_LABELS[report.status]}
                            </span>
                              <span
                              className={`fr-badge fr-badge--sm ${BUG_REPORT_TYPE_BADGES[report.type]}`}
                              >
                              {report.type === "FEATURE"
                                ? "Fonctionnalité"
                                : BUG_REPORT_TYPE_LABELS[report.type]}
                              </span>
                            </div>
                          <p className="fr-tile__desc fr-mb-3w">
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
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
