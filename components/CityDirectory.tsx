"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@codegouvfr/react-dsfr/Input";

type CityDirectoryCommune = {
  id: string;
  name: string;
  postalCode: string;
  websiteUrl: string | null;
  slug: string;
};

type CityDirectoryProps = {
  communes: CityDirectoryCommune[];
};

function groupCommunes(communes: CityDirectoryCommune[]) {
  const groups = new Map<string, CityDirectoryCommune[]>();

  communes.forEach((commune) => {
    const trimmed = commune.name.trim();
    const initial = trimmed.charAt(0).toLocaleUpperCase("fr") || "#";
    if (!groups.has(initial)) {
      groups.set(initial, []);
    }
    groups.get(initial)!.push(commune);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([letter, cities]) => ({
      letter,
      cities: cities.sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }));
}

export function CityDirectory({ communes }: CityDirectoryProps) {
  const [query, setQuery] = useState("");

  const filteredCommunes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    if (!normalizedQuery) {
      return communes;
    }

    return communes.filter((commune) => {
      const name = commune.name.toLocaleLowerCase("fr");
      const postalCode = commune.postalCode.toLocaleLowerCase("fr");
      return (
        name.includes(normalizedQuery) || postalCode.includes(normalizedQuery)
      );
    });
  }, [communes, query]);

  const groupedCommunes = useMemo(
    () => groupCommunes(filteredCommunes),
    [filteredCommunes]
  );

  return (
    <section className="fr-flow">
      <div className="fr-card fr-card--no-arrow fr-card--shadow fr-p-4w fr-mb-6w">
        <Input
          label="Rechercher une commune"
          hintText="Filtrez par nom de commune ou code postal."
          nativeInputProps={{
            type: "search",
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: "Ex. Paris ou 75001",
          }}
        />
        {query.trim().length > 0 && (
          <button
            type="button"
            className="fr-link fr-link--sm fr-mt-2w"
            onClick={() => setQuery("")}
          >
            Effacer le filtre
          </button>
        )}
      </div>

      {filteredCommunes.length === 0 ? (
        <div className="fr-callout fr-callout--grey fr-mt-4w">
          <h2 className="fr-callout__title fr-h5">Aucun résultat</h2>
          <p className="fr-callout__text">
            Vérifiez l’orthographe ou essayez un autre code postal.
          </p>
        </div>
      ) : (
        groupedCommunes.map(({ letter, cities }) => (
          <section
            key={letter}
            aria-labelledby={`city-directory-letter-${letter}`}
            className="fr-flow fr-mt-6w"
          >
            <div className="fr-grid-row fr-grid-row--center fr-grid-row--middle">
              <div className="fr-col-auto">
                <span className="fr-badge" aria-hidden="true">
                  {letter}
                </span>
              </div>
              <div className="fr-col">
                <h2
                  id={`city-directory-letter-${letter}`}
                  className="fr-sr-only"
                >
                  Communes commençant par {letter}
                </h2>
              </div>
            </div>
            <div className="fr-divider fr-mt-2w fr-mb-4w" />
            <ul
              className="fr-grid-row fr-grid-row--gutters"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {cities.map((city) => (
                <li
                  key={city.id}
                  className="fr-col-12 fr-col-sm-6 fr-col-lg-4 fr-col-xl-3"
                >
                  <article
                    className="fr-card fr-card--sm fr-card--no-arrow fr-card--shadow"
                    style={{
                      border: "1px solid var(--border-default-grey)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div
                      className="fr-card__body fr-pt-4w fr-px-4w fr-pb-0"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--spacer-2w)",
                      }}
                    >
                      <h3 className="fr-card__title fr-h4 fr-mt-0 fr-mb-0">
                        {city.name}
                      </h3>
                      {city.websiteUrl ? (
                        <a
                          href={city.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="fr-link fr-link--sm fr-icon-external-link-line"
                        >
                          Site internet
                        </a>
                      ) : (
                        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                          Aucun site renseigné
                        </p>
                      )}
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                        Code postal : {city.postalCode}
                      </p>
                    </div>
                    <div
                      className="fr-card__footer fr-mt-auto fr-px-4w fr-pb-4w"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginLeft: "0px",
                      }}
                    >
                      <Link
                        href={`/contrib/${city.slug}`}
                        className="fr-btn fr-btn--primary fr-btn--sm fr-btn--icon-right fr-icon-arrow-right-line"
                      >
                        Contribuer
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
