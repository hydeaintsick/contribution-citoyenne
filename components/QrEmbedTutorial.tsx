"use client";

import { useMemo, useState } from "react";

type QrEmbedTutorialProps = {
  embedBaseUrl: string;
};

type SizeKey = "large" | "medium" | "small";

const SIZE_OPTIONS: Record<
  SizeKey,
  { label: string; dimension: number; description: string }
> = {
  large: {
    label: "Grand carré",
    dimension: 360,
    description: "Idéal pour une intégration pleine largeur ou en bannière.",
  },
  medium: {
    label: "Moyen carré",
    dimension: 256,
    description: "Un bon compromis pour la plupart des pages.",
  },
  small: {
    label: "Petit carré",
    dimension: 192,
    description: "Parfait pour une colonne latérale ou un pied de page.",
  },
};

export function QrEmbedTutorial({ embedBaseUrl }: QrEmbedTutorialProps) {
  const [selectedSize, setSelectedSize] = useState<SizeKey>("medium");
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const snippet = useMemo(() => {
    const { dimension } = SIZE_OPTIONS[selectedSize];
    const width = dimension;
    const height = dimension;
    return `<iframe src="${embedBaseUrl}" width="${width}" height="${height}" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="QR Code Contribcit"></iframe>`;
  }, [embedBaseUrl, selectedSize]);

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
    <section className="fr-mt-7w fr-p-4w fr-background-alt--blue-france">
      <div className="fr-container--fluid">
        <h2 className="fr-h3 fr-mb-2w">Intégrer ce QR Code sur votre site</h2>
        <p className="fr-text--sm fr-mb-5w">
          Copiez-collez ce code dans votre site pour afficher automatiquement le
          QR Code de votre commune. Choisissez la taille adaptée et collez le
          code dans votre CMS ou directement dans votre HTML.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-4">
            <fieldset className="fr-fieldset">
              <legend className="fr-fieldset__legend fr-text--regular">
                Choisissez la taille du QR Code
              </legend>
              <div className="fr-fieldset__content">
                {(
                  Object.entries(SIZE_OPTIONS) as Array<[SizeKey, (typeof SIZE_OPTIONS)["large"]]>
                ).map(([key, option]) => (
                  <div className="fr-radio-group" key={key}>
                    <input
                      id={`qr-size-${key}`}
                      type="radio"
                      name="qr-size"
                      value={key}
                      checked={selectedSize === key}
                      onChange={() => setSelectedSize(key)}
                    />
                    <label className="fr-label" htmlFor={`qr-size-${key}`}>
                      {option.label} ({option.dimension}px)
                    </label>
                    <p className="fr-hint-text fr-text--xs">{option.description}</p>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="fr-col-12 fr-col-lg-8">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="qr-embed-snippet">
                Code d’intégration
              </label>
              <textarea
                id="qr-embed-snippet"
                className="fr-input"
                value={snippet}
                spellCheck={false}
                readOnly
                rows={4}
              />
              <p className="fr-hint-text fr-text--xs fr-mt-1w">
                Collez ce bloc où vous souhaitez afficher le QR Code. Le contenu
                s’adaptera automatiquement aux contributions de votre commune.
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
    </section>
  );
}


