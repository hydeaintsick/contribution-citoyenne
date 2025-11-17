"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import type {
  Activity,
  ActivityType,
  ActivitiesResponse,
} from "@/lib/activities";
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ORDER,
  ACTIVITY_TYPE_BADGES,
} from "@/lib/activities";
import styles from "./AdminActivityDashboard.module.css";

const PAGE_SIZE = 20;

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUser(user: Activity["user"]) {
  if (!user) {
    return "—";
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

function formatActivityDescription(activity: Activity): string {
  switch (activity.metadata.type) {
    case "USER_LOGIN":
      return `Connexion de ${formatUser(activity.user)}`;
    case "CONTRIBUTION_CREATED":
      return `Création de contribution "${activity.metadata.contributionTitle}"`;
    case "CONTRIBUTION_CLOSED":
      return `Clôture de contribution "${activity.metadata.contributionTitle}"`;
    case "CONTRIBUTION_UPDATED":
      return `Mise à jour de contribution "${activity.metadata.contributionTitle}"`;
    case "CITY_AUDIT":
      return `${activity.metadata.action === "CREATED" ? "Création" : "Modification"} de la commune`;
    case "CONTACT_TICKET_PROCESSED":
      return `Traitement du ticket de contact de ${activity.metadata.contactName}`;
  }
}

function getCommuneName(activity: Activity): string | null {
  switch (activity.metadata.type) {
    case "USER_LOGIN":
      return activity.metadata.communeName ?? null;
    case "CONTRIBUTION_CREATED":
    case "CONTRIBUTION_CLOSED":
    case "CONTRIBUTION_UPDATED":
      return activity.metadata.communeName;
    case "CITY_AUDIT":
      return activity.metadata.communeName;
    case "CONTACT_TICKET_PROCESSED":
      return activity.metadata.communeName ?? null;
  }
}

export function AdminActivityDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<ActivitiesResponse["pagination"]>({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typesParam = searchParams.get("types") || "";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const selectedTypes = useMemo(() => {
    if (!typesParam) {
      return new Set<ActivityType>();
    }
    const types = typesParam.split(",").map((t) => t.trim().toUpperCase());
    return new Set(types.filter(Boolean) as ActivityType[]);
  }, [typesParam]);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const updateFilters = (
    updates: {
      types?: Set<ActivityType>;
      startDate?: string;
      endDate?: string;
      page?: number;
    },
  ) => {
    const params = new URLSearchParams();

    const finalTypes = updates.types !== undefined ? updates.types : selectedTypes;
    const finalStartDate = updates.startDate !== undefined ? updates.startDate : startDate;
    const finalEndDate = updates.endDate !== undefined ? updates.endDate : endDate;
    const finalPage = updates.page !== undefined ? updates.page : currentPage;

    if (finalTypes.size > 0) {
      params.set("types", Array.from(finalTypes).join(","));
    }

    if (finalStartDate) {
      params.set("startDate", finalStartDate);
    }

    if (finalEndDate) {
      params.set("endDate", finalEndDate);
    }

    if (finalPage > 1) {
      params.set("page", String(finalPage));
    }

    const queryString = params.toString();
    router.replace(`/admin/activite${queryString ? `?${queryString}` : ""}`);
  };

  const toggleTypeFilter = (type: ActivityType) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    updateFilters({ types: newTypes, page: 1 });
  };

  const handleStartDateChange = (value: string) => {
    updateFilters({ startDate: value, page: 1 });
  };

  const handleEndDateChange = (value: string) => {
    updateFilters({ endDate: value, page: 1 });
  };

  const resetFilters = () => {
    router.replace("/admin/activite");
  };

  const hasActiveFilters = selectedTypes.size > 0 || startDate || endDate;

  const goToPage = (page: number) => {
    updateFilters({ page });
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedTypes.size > 0) {
      params.set("types", Array.from(selectedTypes).join(","));
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }
    params.set("page", String(currentPage));
    params.set("pageSize", String(PAGE_SIZE));

    fetch(`/api/admin/activities?${params.toString()}`)
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Erreur lors du chargement des activités");
        }
        return response.json() as Promise<ActivitiesResponse>;
      })
      .then((data) => {
        setActivities(data.activities);
        setPagination(data.pagination);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setIsLoading(false);
      });
  }, [currentPage, selectedTypes, startDate, endDate]);

  const totalPages = pagination.totalPages;
  const shouldShowPagination = totalPages > 1;

  return (
    <div className="fr-flow">
      <div className={styles.filtersRow}>
        <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
          <Button
            priority={!hasActiveFilters ? "primary" : "secondary"}
            onClick={resetFilters}
            disabled={isLoading}
          >
            {!hasActiveFilters && (
              <span
                className="fr-icon-check-line fr-mr-1w"
                aria-hidden="true"
              ></span>
            )}
            <span>Tous</span>
          </Button>
          {ACTIVITY_TYPE_ORDER.map((type) => (
            <Button
              key={type}
              priority={selectedTypes.has(type) ? "primary" : "secondary"}
              onClick={() => toggleTypeFilter(type)}
              disabled={isLoading}
            >
              {selectedTypes.has(type) && (
                <span
                  className="fr-icon-check-line fr-mr-1w"
                  aria-hidden="true"
                ></span>
              )}
              <span>{ACTIVITY_TYPE_LABELS[type]}</span>
            </Button>
          ))}
        </div>

        <div className={styles.dateFilters}>
          <div className={styles.dateFilterGroup}>
            <Input
              label="Date de début"
              nativeInputProps={{
                type: "date",
                value: startDate,
                onChange: (e) => handleStartDateChange(e.target.value),
                disabled: isLoading,
              }}
            />
          </div>
          <div className={styles.dateFilterGroup}>
            <Input
              label="Date de fin"
              nativeInputProps={{
                type: "date",
                value: endDate,
                onChange: (e) => handleEndDateChange(e.target.value),
                disabled: isLoading,
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert
          severity="error"
          title="Erreur"
          description={error}
          className="fr-mt-4w"
        />
      )}

      {isLoading ? (
        <div className="fr-mt-4w fr-text--center">
          <p>Chargement des activités...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="fr-mt-4w fr-text--center fr-text-mention--grey">
          <p>Aucune activité ne correspond à vos filtres.</p>
        </div>
      ) : (
        <>
          <div className="fr-table fr-mt-4w">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Description</th>
                  <th scope="col">Commune</th>
                  <th scope="col">Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const communeName = getCommuneName(activity);
                  return (
                    <tr key={activity.id}>
                      <td>{dateTimeFormatter.format(new Date(activity.timestamp))}</td>
                      <td>
                        <Badge small severity={ACTIVITY_TYPE_BADGES[activity.type]}>
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </Badge>
                      </td>
                      <td>{formatActivityDescription(activity)}</td>
                      <td>{communeName ?? "—"}</td>
                      <td>{formatUser(activity.user)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {shouldShowPagination && (
            <div className="fr-table__footer fr-table__footer--middle fr-mt-4w">
              <nav
                className="fr-pagination"
                role="navigation"
                aria-label="Pagination des activités"
              >
                <ul className="fr-pagination__list">
                  <li>
                    <button
                      type="button"
                      className="fr-pagination__link fr-pagination__link--first"
                      onClick={() => goToPage(1)}
                      aria-label="Première page"
                      disabled={currentPage === 1}
                    >
                      Première page
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--label"
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      aria-label="Page précédente"
                      disabled={currentPage === 1}
                    >
                      Page précédente
                    </button>
                  </li>
                  {Array.from({ length: Math.min(totalPages, 10) }).map((_, index) => {
                    let pageNumber: number;
                    if (totalPages <= 10) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 4) {
                      pageNumber = totalPages - 9 + index;
                    } else {
                      pageNumber = currentPage - 5 + index;
                    }

                    return (
                      <li key={pageNumber}>
                        <button
                          type="button"
                          className="fr-pagination__link"
                          aria-current={pageNumber === currentPage ? "page" : undefined}
                          onClick={() => goToPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      className="fr-pagination__link fr-pagination__link--next fr-pagination__link--label"
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      aria-label="Page suivante"
                      disabled={currentPage === totalPages}
                    >
                      Page suivante
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="fr-pagination__link fr-pagination__link--last"
                      onClick={() => goToPage(totalPages)}
                      aria-label="Dernière page"
                      disabled={currentPage === totalPages}
                    >
                      Dernière page
                    </button>
                  </li>
                </ul>
              </nav>
              <p className="fr-text--sm fr-text-mention--grey fr-mt-2w">
                {pagination.total} activité{pagination.total > 1 ? "s" : ""} au total
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

