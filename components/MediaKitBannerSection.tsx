"use client";

import { useMemo, useState } from "react";
import { MediaKitBanner, type MediaKitBannerTheme } from "./MediaKitBanner";
import { Button } from "@codegouvfr/react-dsfr/Button";

type MediaKitBannerSectionProps = {
  communeName: string;
  contributionUrl: string;
  embedBaseUrl: string;
};

type SizeKey = "large" | "medium" | "small";

const SIZE_OPTIONS: Record<
  SizeKey,
  { label: string; width: number; height: number; description: string }
> = {
  large: {
    label: "Grande bannière",
    width: 1200,
    height: 150,
    description: "Idéal pour une intégration pleine largeur ou en bannière.",
  },
  medium: {
    label: "Bannière moyenne",
    width: 800,
    height: 140,
    description: "Un bon compromis pour la plupart des pages.",
  },
  small: {
    label: "Petite bannière",
    width: 600,
    height: 130,
    description: "Parfait pour une colonne latérale ou un pied de page.",
  },
};

export function MediaKitBannerSection({
  communeName,
  contributionUrl,
  embedBaseUrl,
}: MediaKitBannerSectionProps) {
  const [selectedTheme, setSelectedTheme] =
    useState<MediaKitBannerTheme>("white");
  const [selectedSize, setSelectedSize] = useState<SizeKey>("medium");
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const snippet = useMemo(() => {
    const { width, height } = SIZE_OPTIONS[selectedSize];
    const url = `${embedBaseUrl}?theme=${selectedTheme}`;
    return `<iframe src="${url}" width="${width}" height="${height}" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bannière Contribcit"></iframe>`;
  }, [embedBaseUrl, selectedSize, selectedTheme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return (
    <div className="fr-flow">
      {/* Section Preview en pleine largeur */}
      <div className="fr-mb-4w">
        <h3 className="fr-h4 fr-mb-2w">Aperçu de la bannière</h3>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
          Choisissez un thème de couleur pour prévisualiser la bannière.
        </p>

        {/* Preview en pleine largeur */}
        <div
          className="fr-p-3w fr-mb-4w"
          style={{
            border: "1px solid var(--border-default-grey)",
            borderRadius: "0.5rem",
            backgroundColor: "var(--background-alt-grey)",
            width: "100%",
          }}
        >
          <MediaKitBanner
            communeName={communeName}
            contributionUrl={contributionUrl}
            theme={selectedTheme}
            className="fr-m-0"
          />
        </div>

        {/* Contrôles en dessous */}
        <fieldset className="fr-fieldset">
          <legend className="fr-fieldset__legend fr-text--regular">
            Thème de couleur
          </legend>
          <div className="fr-fieldset__content">
            <div className="fr-radio-group">
              <input
                id="banner-theme-white"
                type="radio"
                name="banner-theme"
                value="white"
                checked={selectedTheme === "white"}
                onChange={() => setSelectedTheme("white")}
              />
              <label className="fr-label" htmlFor="banner-theme-white">
                Blanc
              </label>
            </div>
            <div className="fr-radio-group">
              <input
                id="banner-theme-blue"
                type="radio"
                name="banner-theme"
                value="blue"
                checked={selectedTheme === "blue"}
                onChange={() => setSelectedTheme("blue")}
              />
              <label className="fr-label" htmlFor="banner-theme-blue">
                Bleu
              </label>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Section Code d'intégration */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
        <div className="fr-col-12 fr-col-lg-6">
          <h3 className="fr-h4 fr-mb-2w">Code d&apos;intégration</h3>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
            Copiez-collez ce code dans votre site pour afficher automatiquement
            la bannière de votre commune. Choisissez la taille adaptée et collez
            le code dans votre CMS ou directement dans votre HTML.
          </p>

          <fieldset className="fr-fieldset fr-mb-3w">
            <legend className="fr-fieldset__legend fr-text--regular">
              Taille de la bannière
            </legend>
            <div className="fr-fieldset__content">
              {(
                Object.entries(SIZE_OPTIONS) as Array<
                  [SizeKey, (typeof SIZE_OPTIONS)[SizeKey]]
                >
              ).map(([key, option]) => (
                <div className="fr-radio-group" key={key}>
                  <input
                    id={`banner-size-${key}`}
                    type="radio"
                    name="banner-size"
                    value={key}
                    checked={selectedSize === key}
                    onChange={() => setSelectedSize(key)}
                  />
                  <label className="fr-label" htmlFor={`banner-size-${key}`}>
                    {option.label} ({option.width}x{option.height}px)
                  </label>
                  <p className="fr-hint-text fr-text--xs">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="fr-input-group">
            <label className="fr-label" htmlFor="banner-embed-snippet">
              Code d&apos;intégration
            </label>
            <textarea
              id="banner-embed-snippet"
              className="fr-input"
              value={snippet}
              spellCheck={false}
              readOnly
              rows={4}
            />
            <p className="fr-hint-text fr-text--xs fr-mt-1w">
              Collez ce bloc où vous souhaitez afficher la bannière. Le contenu
              s&apos;adaptera automatiquement aux contributions de votre
              commune.
            </p>
          </div>

          <div className="fr-mt-2w">
            <button
              type="button"
              className="fr-btn"
              onClick={handleCopy}
              aria-live="polite"
            >
              {copyState === "success"
                ? "Copié !"
                : copyState === "error"
                ? "Impossible de copier"
                : "Copier le code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
