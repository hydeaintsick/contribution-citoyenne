import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommuneSettingsForm } from "@/components/CommuneSettingsForm";

export default async function CommuneSettingsPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session) {
    redirect("/admin");
  }

  if (!["TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)) {
    redirect("/admin");
  }

  if (!session.user.communeId) {
    redirect("/admin/profile");
  }

  const commune = await prisma.commune.findUnique({
    where: { id: session.user.communeId },
  });

  if (!commune) {
    redirect("/admin");
  }

  // Pour MongoDB, si le champ n'existe pas encore dans le document,
  // il sera undefined/null. On utilise false par défaut.
  // TypeScript peut se plaindre mais à l'exécution ça fonctionnera.
  const safeModeEnabled = (commune as { safeModeEnabled?: boolean }).safeModeEnabled ?? false;

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <h1 className="fr-h3 fr-mb-1">Configuration</h1>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-1">
          Configurez les paramètres pour la commune de {commune.name}.
        </p>
      </header>

      <CommuneSettingsForm
        communeId={commune.id}
        initialSafeModeEnabled={safeModeEnabled}
      />
    </div>
  );
}

