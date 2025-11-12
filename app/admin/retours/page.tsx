import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownContributionsTable } from "@/components/TownContributionsTable";

const DEFAULT_CATEGORY_BADGE_COLOR = "#000091";
const DEFAULT_CATEGORY_BADGE_TEXT_COLOR = "#FFFFFF";

export default async function TownReturnsPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (
    !session ||
    !["TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)
  ) {
    redirect("/admin");
  }

  if (!session.user.communeId) {
    redirect("/admin/profile");
  }

  const contributions = await prisma.contribution.findMany({
    where: {
      communeId: session.user.communeId,
    },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      categoryLabel: true,
      category: {
        select: {
          badgeColor: true,
          badgeTextColor: true,
        },
      },
      createdAt: true,
      locationLabel: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <h1 className="fr-h3 fr-mb-1">Retours citoyens</h1>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-1">
          Filtrez les signalements des citoyens pour suivre leur traitement.
        </p>
      </header>

      <TownContributionsTable
        items={contributions.map((contribution) => ({
          id: contribution.id,
          type: contribution.type,
          status: contribution.status,
          title: contribution.title,
          categoryLabel: contribution.categoryLabel,
          categoryColor: contribution.category?.badgeColor ?? null,
          categoryTextColor: contribution.category?.badgeTextColor ?? null,
          createdAt: contribution.createdAt.toISOString(),
          locationLabel: contribution.locationLabel,
        }))}
      />
    </div>
  );
}
