"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { ExportContributionsButton } from "./ExportContributionsButton";
import styles from "./TownContributionsTable.module.css";

type ContributionListItem = {
  id: string;
  type: "ALERT" | "SUGGESTION";
  status: "OPEN" | "CLOSED";
  title: string;
  categoryLabel: string;
  categoryColor?: string | null;
  categoryTextColor?: string | null;
  createdAt: string;
  locationLabel?: string | null;
};

type Filter = "open" | "alert" | "suggestion";

type CategoryFilterOption = {
  value: string;
  label: string;
  badgeColor: string;
  badgeTextColor: string;
  count: number;
};

const DEFAULT_CATEGORY_BADGE_COLOR = "#E5E5F4";
const DEFAULT_CATEGORY_BADGE_TEXT_COLOR = "#161616";
const UNCATEGORIZED_FILTER = "__uncategorized__";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TownContributionsTable({
  items,
}: {
  items: ContributionListItem[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Lire les filtres depuis l'URL au chargement
  const initialFilters = useMemo(() => {
    const fParam = searchParams.get("f");
    if (!fParam) return [];
    return fParam.split(",").filter((f): f is Filter => 
      f === "open" || f === "alert" || f === "suggestion"
    );
  }, [searchParams]);

  const initialCategory = useMemo(() => {
    const cParam = searchParams.get("c");
    if (!cParam) return null;
    return cParam === UNCATEGORIZED_FILTER ? UNCATEGORIZED_FILTER : cParam;
  }, [searchParams]);

  const [filters, setFilters] = useState<Filter[]>(initialFilters);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const isInitialMount = useRef(true);
  const prevSearchParams = useRef(searchParams.toString());

  // Fonction pour mettre à jour l'URL avec les filtres actuels
  const updateURL = useCallback((newFilters: Filter[], newCategory: string | null) => {
    const params = new URLSearchParams();
    
    if (newFilters.length > 0) {
      params.set("f", newFilters.join(","));
    }
    
    if (newCategory !== null) {
      params.set("c", newCategory);
    }

    const queryString = params.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.replace(newURL, { scroll: false });
  }, [pathname, router]);

  // Synchroniser les filtres quand l'URL change (navigation navigateur)
  useEffect(() => {
    const currentSearchParams = searchParams.toString();
    // Seulement mettre à jour si l'URL a vraiment changé (pas à cause de notre propre mise à jour)
    if (prevSearchParams.current !== currentSearchParams) {
      setFilters(initialFilters);
      setSelectedCategory(initialCategory);
      isInitialMount.current = true;
      prevSearchParams.current = currentSearchParams;
    }
  }, [searchParams, initialFilters, initialCategory]);

  // Synchroniser l'URL quand les filtres changent (mais pas au premier rendu)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateURL(filters, selectedCategory);
    // Mettre à jour prevSearchParams pour éviter que le premier useEffect ne se déclenche
    const params = new URLSearchParams();
    if (filters.length > 0) {
      params.set("f", filters.join(","));
    }
    if (selectedCategory !== null) {
      params.set("c", selectedCategory);
    }
    prevSearchParams.current = params.toString();
  }, [filters, selectedCategory, updateURL]);

  const { categoryOptions, uncategorizedCount } = useMemo(() => {
    const map = new Map<string, CategoryFilterOption>();
    let uncategorized = 0;

    items.forEach((item) => {
      const label = (item.categoryLabel ?? "").trim();

      if (label.length === 0) {
        uncategorized += 1;
        return;
      }

      const normalized = label.toLowerCase();
      const existing = map.get(normalized);

      if (existing) {
        existing.count += 1;
        return;
      }

      map.set(normalized, {
        value: normalized,
        label,
        badgeColor: item.categoryColor ?? DEFAULT_CATEGORY_BADGE_COLOR,
        badgeTextColor:
          item.categoryTextColor ?? DEFAULT_CATEGORY_BADGE_TEXT_COLOR,
        count: 1,
      });
    });

    const categoryOptions = Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "fr"),
    );

    return { categoryOptions, uncategorizedCount: uncategorized };
  }, [items]);

  const toggleFilter = (filter: Filter) => {
    setFilters((current) =>
      current.includes(filter)
        ? current.filter((value) => value !== filter)
        : [...current, filter]
    );
  };

  const filteredItems = useMemo(() => {
    const hasOpenFilter = filters.includes("open");
    const hasAlertFilter = filters.includes("alert");
    const hasSuggestionFilter = filters.includes("suggestion");
    const normalizedCategoryFilter = selectedCategory;

    return items.filter((item) => {
      if (hasOpenFilter && item.status !== "OPEN") {
        return false;
      }

      if (hasAlertFilter && !hasSuggestionFilter) {
        return item.type === "ALERT";
      }

      if (hasSuggestionFilter && !hasAlertFilter) {
        return item.type === "SUGGESTION";
      }

      if (normalizedCategoryFilter) {
        const label = (item.categoryLabel ?? "").trim();
        const normalizedLabel = label.toLowerCase();

        if (normalizedCategoryFilter === UNCATEGORIZED_FILTER) {
          if (normalizedLabel.length > 0) {
            return false;
          }
        } else if (normalizedLabel !== normalizedCategoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [filters, items, selectedCategory]);

  const hasCategoryFilters =
    categoryOptions.length > 0 || uncategorizedCount > 0;

  return (
    <div className="fr-flow">
      <div className={styles.filtersRow}>
        <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
          <Button
            priority={
              filters.length === 0 && selectedCategory === null
                ? "primary"
                : "secondary"
            }
            onClick={() => {
              setFilters([]);
              setSelectedCategory(null);
            }}
          >
            {filters.length === 0 && selectedCategory === null && (
              <span
                className="fr-icon-check-line fr-mr-1w"
                aria-hidden="true"
              ></span>
            )}
            <span>Tous</span>
          </Button>
          <Button
            priority={filters.includes("open") ? "primary" : "secondary"}
            onClick={() => toggleFilter("open")}
          >
            {filters.includes("open") && (
              <span
                className="fr-icon-check-line fr-mr-1w"
                aria-hidden="true"
              ></span>
            )}
            <span>Non traité</span>
          </Button>
          <Button
            priority={filters.includes("alert") ? "primary" : "secondary"}
            onClick={() => toggleFilter("alert")}
          >
            {filters.includes("alert") && (
              <span
                className="fr-icon-check-line fr-mr-1w"
                aria-hidden="true"
              ></span>
            )}
            <span>Alertes</span>
          </Button>
          <Button
            priority={
              filters.includes("suggestion") ? "primary" : "secondary"
            }
            onClick={() => toggleFilter("suggestion")}
          >
            {filters.includes("suggestion") && (
              <span
                className="fr-icon-check-line fr-mr-1w"
                aria-hidden="true"
              ></span>
            )}
            <span>Suggestions</span>
          </Button>
        </div>

        {hasCategoryFilters ? (
          <div>
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
              Catégories
            </p>
            <div className={styles.categoryFilters}>
              <Button
                priority={selectedCategory === null ? "primary" : "secondary"}
                size="small"
                onClick={() => setSelectedCategory(null)}
              >
                <span>Tout afficher</span>
              </Button>
              {categoryOptions.map((option) => (
                <Button
                  key={option.value}
                  priority={
                    selectedCategory === option.value ? "primary" : "secondary"
                  }
                  size="small"
                  className={styles.categoryFilterButton}
                  onClick={() => setSelectedCategory(option.value)}
                >
                  <span
                    className={styles.categoryFilterDot}
                    style={{ backgroundColor: option.badgeColor }}
                    aria-hidden="true"
                  />
                  <span>{option.label}</span>
                  <span className={styles.categoryFilterCount}>
                    ({option.count})
                  </span>
                </Button>
              ))}
              {uncategorizedCount > 0 ? (
                <Button
                  priority={
                    selectedCategory === UNCATEGORIZED_FILTER
                      ? "primary"
                      : "secondary"
                  }
                  size="small"
                  className={styles.categoryFilterButton}
                  onClick={() => setSelectedCategory(UNCATEGORIZED_FILTER)}
                >
                  <span
                    className={styles.categoryFilterDot}
                    style={{ backgroundColor: "#f5f5f5" }}
                    aria-hidden="true"
                  />
                  <span>Non catégorisé</span>
                  <span className={styles.categoryFilterCount}>
                    ({uncategorizedCount})
                  </span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {filteredItems.length === 0 ? (
        <div className="fr-alert fr-alert--info fr-mt-3w">
          <p className="fr-alert__title fr-mb-1v">Aucun retour pour ce filtre</p>
          <p className="fr-text--sm fr-mb-0">
            Modifiez les filtres pour afficher d&apos;autres contributions citoyennes.
          </p>
        </div>
      ) : (
        <div className="fr-table fr-table--no-caption fr-mt-3w">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Titre & catégorie</th>
                      <th scope="col">Date</th>
                      <th scope="col">Lieu</th>
                      <th scope="col" className="fr-text--right">
                        Statut
                      </th>
                      <th scope="col" className="fr-text--right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const label = (item.categoryLabel ?? "").trim();
                      const hasCategory = label.length > 0;
                      const badgeBackground = hasCategory
                        ? item.categoryColor ?? DEFAULT_CATEGORY_BADGE_COLOR
                        : "#f5f5f5";
                      const badgeTextColor = hasCategory
                        ? item.categoryTextColor ??
                          DEFAULT_CATEGORY_BADGE_TEXT_COLOR
                        : "#161616";

                      return (
                        <tr key={item.id}>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <Badge small severity={item.type === "ALERT" ? "error" : "info"}>
                              {item.type === "ALERT" ? "Alerte" : "Suggestion"}
                            </Badge>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--md fr-text--bold fr-mb-0">
                              {item.title || "Sans titre"}
                            </p>
                            <div className={styles.categoryBadgeWrapper}>
                              <Badge
                                small
                                className={styles.categoryBadge}
                                style={{
                                  backgroundColor: badgeBackground,
                                  color: badgeTextColor,
                                }}
                              >
                                {hasCategory ? label : "Non catégorisé"}
                              </Badge>
                            </div>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--sm fr-mb-0">
                              {dateFormatter.format(new Date(item.createdAt))}
                            </p>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--sm fr-mb-0">
                              {item.locationLabel ?? (
                                <span className="fr-text-mention--grey">Non précisé</span>
                              )}
                            </p>
                          </td>
                          <td className="fr-py-2w fr-text--right" style={{ verticalAlign: "top" }}>
                            <Badge
                              small
                              severity={item.status === "OPEN" ? "warning" : "success"}
                            >
                              {item.status === "OPEN" ? "À traiter" : "Clôturé"}
                            </Badge>
                          </td>
                          <td className="fr-py-2w fr-text--right" style={{ verticalAlign: "top" }}>
                            <Button
                              priority="secondary"
                              size="small"
                              iconId="fr-icon-arrow-right-line"
                              linkProps={{
                                href: `/admin/retours/${item.id}`,
                              }}
                            >
                              Voir le détail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fr-mt-3w">
        <Accordion label="Export vers d'autres applications">
          <div className="fr-mt-2w">
            <ExportContributionsButton />
          </div>
        </Accordion>
      </div>
    </div>
  );
}

