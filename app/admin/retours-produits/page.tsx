import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminBugReportsDashboard } from "@/components/AdminBugReportsDashboard";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

export const metadata: Metadata = {
  title: "Retours produits - Contribcit",
};

export default async function AdminBugReportsPage() {
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

  const bugReports = await prisma.bugReport.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const initialReports = bugReports.map((report) => ({
    id: report.id,
    type: report.type,
    status: report.status,
    title: report.title,
    description: report.description,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    resolvedAt: report.resolvedAt ? report.resolvedAt.toISOString() : null,
    screenshotUrl: report.screenshotUrl,
    screenshotPublicId: report.screenshotPublicId,
    screenshotWidth: report.screenshotWidth,
    screenshotHeight: report.screenshotHeight,
    screenshotBytes: report.screenshotBytes,
    githubCommitUrl: report.githubCommitUrl,
  }));

  return (
    <div className="fr-container fr-mx-auto">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <header className="fr-mb-6w">
            <h1 className="fr-display--sm fr-mb-2w">Retours produits</h1>
            <p className="fr-text--md fr-text-mention--grey fr-mb-0">
              Priorisez et suivez les bugs et demandes de fonctionnalités issus du
              formulaire public.
            </p>
          </header>
          <AdminBugReportsDashboard initialReports={initialReports} />
        </div>
      </div>
    </div>
  );
}


