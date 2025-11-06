"use client";

import Link from "next/link";
import { DsfrProviderBase } from "@codegouvfr/react-dsfr/next-app-router/DsfrProvider";
import { type ReactNode } from "react";

export function DsfrProviderClient({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      <DsfrProviderBase Link={Link} defaultColorScheme="light" lang="fr">
        {children}
      </DsfrProviderBase>
    </div>
  );
}

