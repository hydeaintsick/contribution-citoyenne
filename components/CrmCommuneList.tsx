"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

type CrmCommune = {
  id: string;
  name: string;
  postalCode: string;
  slug: string | null;
  latitude: number;
  longitude: number;
  isVisible: boolean;
  hasPremiumAccess: boolean;
  isPartner: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  accountManager: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  _count: {
    comments: number;
  };
};

type CrmCommuneListProps = {
  communes: CrmCommune[];
  userRole: "ADMIN" | "ACCOUNT_MANAGER";
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export function CrmCommuneList({ communes: initialCommunes, userRole }: CrmCommuneListProps) {
  const router = useRouter();
  const [communes, setCommunes] = useState(initialCommunes);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "premium" | "non-premium">("all");
  const [partnerFilter, setPartnerFilter] = useState<"all" | "partner" | "non-partner">("all");
  const isAdmin = userRole === "ADMIN";

  const filteredCommunes = useMemo(() => {
    let filtered = communes;

    // Filtre par visibilité
    if (visibilityFilter === "visible") {
      filtered = filtered.filter((commune) => commune.isVisible === true);
    } else if (visibilityFilter === "hidden") {
      filtered = filtered.filter((commune) => commune.isVisible === false);
    }

    // Filtre par premium
    if (premiumFilter === "premium") {
      filtered = filtered.filter((commune) => commune.hasPremiumAccess === true);
    } else if (premiumFilter === "non-premium") {
      filtered = filtered.filter((commune) => commune.hasPremiumAccess === false);
    }

    // Filtre par partenaire
    if (partnerFilter === "partner") {
      filtered = filtered.filter((commune) => commune.isPartner === true);
    } else if (partnerFilter === "non-partner") {
      filtered = filtered.filter((commune) => commune.isPartner === false);
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((commune) => {
        const name = commune.name.toLowerCase();
        const postalCode = commune.postalCode.toLowerCase();
        const creatorName = commune.createdBy
          ? [
              commune.createdBy.firstName,
              commune.createdBy.lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
          : "";
        const managerName = commune.accountManager
          ? [
              commune.accountManager.firstName,
              commune.accountManager.lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
          : "";

        return (
          name.includes(normalizedSearch) ||
          postalCode.includes(normalizedSearch) ||
          creatorName.includes(normalizedSearch) ||
          managerName.includes(normalizedSearch)
        );
      });
    }

    return filtered;
  }, [communes, searchTerm, visibilityFilter, premiumFilter, partnerFilter]);

  const handleCommuneClick = useCallback(
    (communeId: string) => {
      router.push(`/admin/communes/${communeId}`);
    },
    [router],
  );

  if (communes.length === 0) {
    return (
      <div className="fr-callout">
        <h3 className="fr-callout__title">Aucune commune</h3>
        <p className="fr-callout__text">
          Créez votre première commune pour commencer.
        </p>
      </div>
    );
  }

  const colSpan = isAdmin ? 7 : 7;

  return (
    <div className="fr-flow">
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Rechercher"
            hintText="Rechercher par nom, code postal, créateur ou chargé de compte"
            nativeInputProps={{
              type: "search",
              value: searchTerm,
              onChange: (event) => setSearchTerm(event.target.value),
              placeholder: "Ex. Paris, 75001...",
            }}
          />
        </div>
        {isAdmin && (
          <>
            <div className="fr-col-12 fr-col-md-2">
              <Select
                label="Visibilité"
                nativeSelectProps={{
                  value: visibilityFilter,
                  onChange: (event) =>
                    setVisibilityFilter(
                      event.target.value as "all" | "visible" | "hidden",
                    ),
                }}
              >
                <option value="all">Toutes</option>
                <option value="visible">Visibles</option>
                <option value="hidden">Masquées</option>
              </Select>
            </div>
            <div className="fr-col-12 fr-col-md-2">
              <Select
                label="Premium"
                nativeSelectProps={{
                  value: premiumFilter,
                  onChange: (event) =>
                    setPremiumFilter(
                      event.target.value as "all" | "premium" | "non-premium",
                    ),
                }}
              >
                <option value="all">Toutes</option>
                <option value="premium">Premium</option>
                <option value="non-premium">Non premium</option>
              </Select>
            </div>
            <div className="fr-col-12 fr-col-md-2">
              <Select
                label="Partenaire"
                nativeSelectProps={{
                  value: partnerFilter,
                  onChange: (event) =>
                    setPartnerFilter(
                      event.target.value as "all" | "partner" | "non-partner",
                    ),
                }}
              >
                <option value="all">Toutes</option>
                <option value="partner">Partenaires</option>
                <option value="non-partner">Non partenaires</option>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="fr-table">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Commune</th>
                    <th scope="col">Code postal</th>
                    {isAdmin && <th scope="col">Statut</th>}
                    <th scope="col">Créée par</th>
                    <th scope="col">Chargé de compte</th>
                    <th scope="col">Commentaires</th>
                    <th scope="col">Créée le</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommunes.length === 0 ? (
                    <tr>
                      <td colSpan={colSpan}>
                        <div className="fr-callout fr-mb-0">
                          <p className="fr-callout__text">
                            Aucune commune ne correspond à votre recherche.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCommunes.map((commune) => (
                      <tr key={commune.id}>
                        <td>
                          <div className="fr-text--md fr-text--bold">
                            {commune.name}
                          </div>
                        </td>
                        <td>
                          <span className="fr-text--sm">{commune.postalCode}</span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="fr-btns-group fr-btns-group--inline-sm" style={{ gap: "0.5rem" }}>
                              {commune.isVisible ? (
                                <Badge
                                  as="span"
                                  severity="success"
                                  small
                                  noIcon
                                >
                                  V
                                </Badge>
                              ) : (
                                <Badge
                                  as="span"
                                  small
                                  noIcon
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#6a6a6a",
                                    color: "#ffffff",
                                  }}
                                >
                                  H
                                </Badge>
                              )}
                              {commune.hasPremiumAccess && (
                                <Badge
                                  as="span"
                                  small
                                  noIcon
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#FFD700",
                                    color: "#000000",
                                    fontWeight: "bold",
                                  }}
                                >
                                  $
                                </Badge>
                              )}
                              {commune.isPartner && (
                                <Badge
                                  as="span"
                                  severity="info"
                                  small
                                  noIcon
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "var(--background-action-low-blue-france)",
                                    color: "var(--text-title-blue-france)",
                                  }}
                                >
                                  P
                                </Badge>
                              )}
                            </div>
                          </td>
                        )}
                        <td>
                          <span className="fr-text--sm">
                            {commune.createdBy
                              ? [
                                  commune.createdBy.firstName,
                                  commune.createdBy.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ") || commune.createdBy.email
                              : "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="fr-text--sm">
                            {commune.accountManager
                              ? [
                                  commune.accountManager.firstName,
                                  commune.accountManager.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ") || commune.accountManager.email
                              : "Non assigné"}
                          </span>
                        </td>
                        <td>
                          <span className="fr-text--sm">
                            {commune._count.comments}
                          </span>
                        </td>
                        <td>
                          <span className="fr-text--sm">
                            {dateFormatter.format(new Date(commune.createdAt))}
                          </span>
                        </td>
                        <td>
                          <Button
                            priority="tertiary"
                            size="small"
                            iconId="fr-icon-arrow-right-line"
                            onClick={() => handleCommuneClick(commune.id)}
                          >
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

