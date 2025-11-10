"use client";

import { useState } from "react";

type ContributionDirectLinkProps = {
  contributionUrl: string;
};

export function ContributionDirectLink({
  contributionUrl,
}: ContributionDirectLinkProps) {
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contributionUrl);
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return (
    <div>
      <p className="fr-mt-1w">
        <a
          className="fr-link"
          href={contributionUrl}
          target="_blank"
          rel="noreferrer"
        >
          {contributionUrl}
        </a>
      </p>
      <div className="fr-mt-2w">
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={handleCopy}
          aria-live="polite"
        >
          {copyState === "success"
            ? "Lien copié !"
            : copyState === "error"
              ? "Impossible de copier"
              : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}

