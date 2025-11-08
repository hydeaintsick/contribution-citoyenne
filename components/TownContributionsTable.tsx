"use client";

import { useMemo, useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";

type ContributionListItem = {
  id: string;
  type: "ALERT" | "SUGGESTION";
  status: "OPEN" | "CLOSED";
  categoryLabel: string;
  subcategory: string;
  createdAt: string;
  locationLabel?: string | null;
};

type Filter = "all" | "open" | "alert" | "suggestion";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TownContributionsTable({
  items,
}: {
  items: ContributionListItem[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "open":
        return items.filter((item) => item.status === "OPEN");
      case "alert":
        return items.filter((item) => item.type === "ALERT");
      case "suggestion":
        return items.filter((item) => item.type === "SUGGESTION");
      case "all":
      default:
        return items;
    }
  }, [filter, items]);

  return (
    <div className="fr-flow">
      <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
        <Button
          priority={filter === "all" ? "primary" : "secondary"}
          onClick={() => setFilter("all")}
          iconId={filter === "all" ? "fr-icon-check-line" : undefined}
        >
          Tous
        </Button>
        <Button
          priority={filter === "open" ? "primary" : "secondary"}
          onClick={() => setFilter("open")}
          iconId={filter === "open" ? "fr-icon-check-line" : undefined}
        >
          Non traité
        </Button>
        <Button
          priority={filter === "alert" ? "primary" : "secondary"}
          onClick={() => setFilter("alert")}
          iconId={filter === "alert" ? "fr-icon-check-line" : undefined}
        >
          Alertes
        </Button>
        <Button
          priority={filter === "suggestion" ? "primary" : "secondary"}
          onClick={() => setFilter("suggestion")}
          iconId={filter === "suggestion" ? "fr-icon-check-line" : undefined}
        >
          Suggestions
        </Button>
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
                      <th scope="col">Catégorie</th>
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
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                          <Badge small severity={item.type === "ALERT" ? "error" : "info"}>
                            {item.type === "ALERT" ? "Alerte" : "Suggestion"}
                          </Badge>
                        </td>
                        <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                          <p className="fr-text--md fr-text--bold fr-mb-0">{item.categoryLabel}</p>
                          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                            {item.subcategory}
                          </p>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

