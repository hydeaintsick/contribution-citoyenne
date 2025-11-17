import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminActivityDashboard } from "@/components/AdminActivityDashboard";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

export const metadata: Metadata = {
  title: "Activité - Contribcit",
};

export default async function AdminActivityPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    redirect("/admin");
  }

  return (
    <div className="fr-container fr-mx-auto">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <header className="fr-mb-6w">
            <h1 className="fr-display--sm fr-mb-2w">Activité</h1>
            <p className="fr-text--md fr-text-mention--grey fr-mb-0">
              Historique chronologique des activités sur la plateforme : connexions, réponses aux retours citoyens, modifications de communes, etc.
            </p>
          </header>
          <AdminActivityDashboard />
        </div>
      </div>
    </div>
  );
}

