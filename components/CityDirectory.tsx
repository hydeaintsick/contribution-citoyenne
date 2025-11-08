"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@codegouvfr/react-dsfr/Input";

type CityDirectoryCommune = {
  id: string;
  name: string;
  postalCode: string;
  websiteUrl: string | null;
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
      return name.includes(normalizedQuery) || postalCode.includes(normalizedQuery);
    });
  }, [communes, query]);

  const groupedCommunes = useMemo(
    () => groupCommunes(filteredCommunes),
    [filteredCommunes],
  );

  return (
    <section className="fr-flow">
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

      {filteredCommunes.length === 0 ? (
        <div className="fr-callout fr-callout--grey fr-mt-4w">
          <h2 className="fr-callout__title fr-h5">Aucun résultat</h2>
          <p className="fr-callout__text">
            Vérifiez l’orthographe ou essayez un autre code postal.
          </p>
        </div>
      ) : (
        groupedCommunes.map(({ letter, cities }) => (
          <section key={letter} aria-labelledby={`city-directory-letter-${letter}`} className="fr-flow fr-mt-6w">
            <h2 id={`city-directory-letter-${letter}`} className="fr-h4 fr-mb-3w">
              {letter}
            </h2>
            <ul className="fr-list fr-list--spaced">
              {cities.map((city) => (
                <li key={city.id} className="fr-py-2w">
                  <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
                    <div className="fr-col">
                      <p className="fr-text--md fr-text--bold fr-mb-0">{city.name}</p>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                        Code postal : {city.postalCode}
                      </p>
                      {city.websiteUrl ? (
                        <a
                          href={city.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="fr-link fr-link--md"
                        >
                          Site internet
                        </a>
                      ) : (
                        <span className="fr-text--xs fr-text-mention--grey">
                          Aucun site renseigné
                        </span>
                      )}
                    </div>
                    <div className="fr-col-auto fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
                      <Link
                        href={`/contrib/${city.id}`}
                        className="fr-btn fr-btn--primary fr-btn--sm"
                      >
                        Contribuer
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}


