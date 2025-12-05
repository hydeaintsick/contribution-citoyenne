"use client";

import { useMemo, useState, useCallback } from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { FRENCH_REGIONS } from "@/lib/franceRegions";
import franceRegionsMap from "@svg-maps/france.regions";

type RegionStats = {
  regionCode: string;
  regionName: string;
  count: number;
};

type FranceRegionsMapProps = {
  regions: RegionStats[];
};

type SvgMapLocation = {
  name: string;
  id: string;
  path: string;
};

/**
 * Composant SVG interactif de la France par région
 * Utilise la librairie @svg-maps/france.regions pour les formes géographiques précises
 * Les régions sont coloriées selon le nombre de communes (plus foncé = plus de communes)
 * Échelle : 0 commune = gris clair, 100+ communes = bleu très foncé (#000091)
 */
export function FranceRegionsMap({ regions }: FranceRegionsMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(...regions.map((r) => r.count), 1);
  }, [regions]);

  const regionMap = useMemo(() => {
    const map = new Map<string, number>();
    regions.forEach((r) => {
      map.set(r.regionCode, r.count);
    });
    return map;
  }, [regions]);

  // Mapping des IDs SVG (de la librairie) aux codes région numériques
  const svgIdToRegionCode: Record<string, string> = {
    ara: "84", // Auvergne-Rhône-Alpes
    bfc: "27", // Bourgogne-Franche-Comté
    bre: "53", // Bretagne
    cvl: "24", // Centre-Val de Loire
    cor: "94", // Corse
    ges: "44", // Grand Est
    hdf: "32", // Hauts-de-France
    idf: "11", // Île-de-France
    nor: "28", // Normandie
    naq: "75", // Nouvelle-Aquitaine
    occ: "76", // Occitanie
    pdl: "52", // Pays de la Loire
    pac: "93", // Provence-Alpes-Côte d'Azur
  };

  // Centres approximatifs pour les tooltips (basés sur le viewBox de la librairie)
  const regionCenters: Record<string, [number, number]> = {
    "84": [330, 350], // Auvergne-Rhône-Alpes
    "27": [400, 250], // Bourgogne-Franche-Comté
    "53": [150, 250], // Bretagne
    "24": [280, 200], // Centre-Val de Loire
    "94": [500, 500], // Corse
    "44": [450, 150], // Grand Est
    "32": [350, 100], // Hauts-de-France
    "11": [350, 200], // Île-de-France
    "28": [250, 150], // Normandie
    "75": [200, 350], // Nouvelle-Aquitaine
    "76": [300, 450], // Occitanie
    "52": [200, 250], // Pays de la Loire
    "93": [400, 450], // Provence-Alpes-Côte d'Azur
  };

  const getRegionColor = useCallback(
    (regionCode: string) => {
      const count = regionMap.get(regionCode) ?? 0;
      if (count === 0) {
        return "#e5e5e5"; // Gris clair pour aucune commune
      }
      // Intensité de bleu selon le nombre (plus foncé = plus de communes)
      // Échelle de 0 à 100 communes = du bleu clair au bleu très foncé (#000091)
      const normalizedCount = Math.min(count, 100);
      const intensity = Math.pow(normalizedCount / 100, 0.7);

      // Calculer la couleur bleue : de #E3E9FF (très clair) à #000091 (très foncé)
      const r = Math.round(227 - intensity * 227);
      const g = Math.round(233 - intensity * 233);
      const b = Math.round(255 - intensity * 164);
      return `rgb(${r}, ${g}, ${b})`;
    },
    [regionMap]
  );

  const getRegionInfo = useCallback(
    (regionCode: string) => {
      const region = regions.find((r) => r.regionCode === regionCode);
      return region
        ? { name: region.regionName, count: region.count }
        : {
            name: FRENCH_REGIONS[regionCode] ?? `Région ${regionCode}`,
            count: 0,
          };
    },
    [regions]
  );

  const handleRegionHover = useCallback((regionCode: string | null) => {
    setHoveredRegion(regionCode);
  }, []);

  return (
    <div className="fr-card fr-card--no-arrow fr-card--shadow">
      <div className="fr-card__body fr-px-4w fr-py-4w">
        <h3 className="fr-h5 fr-mb-3w">Répartition par région</h3>
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <svg
            viewBox={franceRegionsMap.viewBox}
            style={{ width: "100%", height: "auto", cursor: "pointer" }}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <g id="features">
              {/* D'abord, rendre toutes les régions */}
              {franceRegionsMap.locations.map((location: SvgMapLocation) => {
                const regionCode = svgIdToRegionCode[location.id];
                if (!regionCode) return null;

                const color = getRegionColor(regionCode);
                const isHovered = hoveredRegion === regionCode;

                return (
                  <path
                    key={location.id}
                    d={location.path}
                    id={location.id}
                    fill={color}
                    stroke={isHovered ? "#000091" : "#ffffff"}
                    strokeWidth={isHovered ? 2 : 0.5}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={() => handleRegionHover(regionCode)}
                    onMouseLeave={() => handleRegionHover(null)}
                    data-region-code={regionCode}
                  />
                );
              })}
            </g>
            {/* Ensuite, rendre les tooltips au-dessus de toutes les régions */}
            {hoveredRegion &&
              (() => {
                const info = getRegionInfo(hoveredRegion);
                const center = regionCenters[hoveredRegion] || [300, 300];
                return (
                  <g
                    key={`tooltip-${hoveredRegion}`}
                    onMouseEnter={() => handleRegionHover(hoveredRegion)}
                    onMouseLeave={() => handleRegionHover(null)}
                  >
                    <rect
                      x={center[0] - 80}
                      y={center[1] - 35}
                      width="160"
                      height="50"
                      fill="#000091"
                      rx="4"
                      opacity="0.95"
                      style={{ pointerEvents: "all" }}
                    />
                    <text
                      x={center[0]}
                      y={center[1] - 10}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {info.name}
                    </text>
                    <text
                      x={center[0]}
                      y={center[1] + 10}
                      fill="#ffffff"
                      fontSize="11"
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {info.count} commune{info.count > 1 ? "s" : ""}
                    </text>
                  </g>
                );
              })()}
          </svg>

          {/* Légende avec barre de dégradé */}
          <div
            className="fr-mt-3w"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <span className="fr-text--xs">0</span>
              <svg
                width="100%"
                height="24"
                style={{ flex: 1 }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#e5e5e5" />
                    <stop offset="25%" stopColor="#E3E9FF" />
                    <stop offset="50%" stopColor="#6A6AF4" />
                    <stop offset="100%" stopColor="#000091" />
                  </linearGradient>
                </defs>
                <rect
                  width="100%"
                  height="24"
                  fill="url(#colorGradient)"
                  rx="4"
                  stroke="#ccc"
                  strokeWidth="1"
                />
              </svg>
              <span className="fr-text--xs">{maxCount}+</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: "400px",
                fontSize: "0.75rem",
                color: "#666",
              }}
            >
              <span>Peu</span>
              <span>Moyen</span>
              <span>Beaucoup</span>
            </div>
          </div>
        </div>

        {/* Liste des régions avec statistiques dans un accordéon */}
        <div className="fr-mt-4w">
          <Accordion label="+ de détails" defaultExpanded={false}>
            <div className="fr-table">
              <div className="fr-table__wrapper">
                <div className="fr-table__container">
                  <div className="fr-table__content">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Région</th>
                          <th scope="col">Nombre de communes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regions.length === 0 ? (
                          <tr>
                            <td colSpan={2}>
                              <p className="fr-text--sm fr-text-mention--grey">
                                Aucune donnée disponible
                              </p>
                            </td>
                          </tr>
                        ) : (
                          regions.map((region) => (
                            <tr
                              key={region.regionCode}
                              onMouseEnter={() =>
                                handleRegionHover(region.regionCode)
                              }
                              onMouseLeave={() => handleRegionHover(null)}
                              style={{
                                cursor: "pointer",
                                backgroundColor:
                                  hoveredRegion === region.regionCode
                                    ? "#f3f3f3"
                                    : "transparent",
                              }}
                            >
                              <td>
                                <div className="fr-grid-row fr-grid-row--middle">
                                  <div
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      backgroundColor: getRegionColor(
                                        region.regionCode
                                      ),
                                      borderRadius: "2px",
                                      marginRight: "0.5rem",
                                      border: "1px solid #ccc",
                                    }}
                                  />
                                  <span className="fr-text--sm">
                                    {region.regionName}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="fr-text--sm fr-text--bold">
                                  {region.count}
                                </span>
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

            <p className="fr-text--xs fr-text-mention--grey fr-mt-2w">
              Survolez une région sur la carte ou dans le tableau pour voir les
              détails. L'intensité du bleu indique le nombre de communes CRM par
              région (0 = gris, 100+ = bleu très foncé).
            </p>
            <p className="fr-text--xs fr-text-mention--grey fr-mt-1w">
              <strong>Note :</strong> Carte SVG générée avec la librairie{" "}
              <a
                href="https://www.npmjs.com/package/@svg-maps/france.regions"
                target="_blank"
                rel="noopener noreferrer"
              >
                @svg-maps/france.regions
              </a>
              .
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
