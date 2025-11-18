"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

export type MediaKitBannerTheme = "blue" | "white";

type MediaKitBannerProps = {
  communeName: string;
  contributionUrl: string;
  theme: MediaKitBannerTheme;
  className?: string;
};

const THEME_STYLES: Record<
  MediaKitBannerTheme,
  {
    backgroundColor: string;
    textColor: string;
    buttonPriority: "primary" | "secondary";
    buttonClassName?: string;
    logoTextColor: string;
  }
> = {
  blue: {
    backgroundColor: "#000091",
    textColor: "#ffffff",
    buttonPriority: "primary",
    buttonClassName: "fr-btn--secondary",
    logoTextColor: "#ffffff",
  },
  white: {
    backgroundColor: "#ffffff",
    textColor: "#161616",
    buttonPriority: "primary",
    logoTextColor: "#000091",
  },
};

export function MediaKitBanner({
  communeName,
  contributionUrl,
  theme,
  className = "",
}: MediaKitBannerProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      className={`fr-p-3w fr-radius--md ${className}`}
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.textColor,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2rem",
        minHeight: "120px",
        width: "100%",
        flexWrap: "wrap",
      }}
    >
      {/* Logo République Française à gauche */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <p
          className="fr-logo"
          style={{
            color: styles.logoTextColor,
            fontSize: "0.875rem",
            margin: 0,
            padding: 0,
            lineHeight: 1.2,
          }}
        >
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </p>
      </div>

      {/* Contenu central */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flex: "1 1 auto",
          minWidth: "200px",
        }}
      >
        <h2
          className="fr-h4 fr-mb-0"
          style={{
            color: styles.textColor,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1.2,
            fontSize: theme === "white" ? "1.5rem" : "1.5rem",
          }}
        >
          Contribcit
        </h2>
        <p
          className="fr-text--md fr-mb-0"
          style={{
            color: styles.textColor,
            fontWeight: 500,
            lineHeight: 1.4,
            fontSize: theme === "white" ? "1rem" : "1rem",
          }}
        >
          Une alerte ou une suggestion ? La parole est à vous !
        </p>
      </div>

      {/* Boutons CTA à droite */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "0.75rem",
          alignItems: "center",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Button
          priority={styles.buttonPriority}
          className={styles.buttonClassName}
          iconId="fr-icon-mail-line"
          linkProps={{
            href: contributionUrl,
            target: "_blank",
            rel: "noopener noreferrer",
          }}
          size="small"
          style={
            theme === "blue"
              ? ({
                  backgroundColor: "#ffffff",
                  color: "#000091",
                  "--hover": "#f5f5fe",
                } as React.CSSProperties)
              : undefined
          }
        >
          Nous contacter
        </Button>
        <Button
          priority="tertiary no outline"
          iconId="fr-icon-information-line"
          linkProps={{
            href: "/qui-sommes-nous",
            target: "_blank",
            rel: "noopener noreferrer",
          }}
          size="small"
          style={{
            color: styles.textColor,
            borderColor: theme === "blue" ? "#ffffff" : styles.textColor,
            backgroundColor: theme === "blue" ? "transparent" : undefined,
            borderWidth: theme === "blue" ? "1px" : undefined,
            borderStyle: theme === "blue" ? "solid" : undefined,
            "--hover": theme === "white" ? "#f5f5fe" : "rgba(255, 255, 255, 0.15)",
          } as React.CSSProperties}
        >
          Plus d&apos;infos
        </Button>
      </div>
    </div>
  );
}

