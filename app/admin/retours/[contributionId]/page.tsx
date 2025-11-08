import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownContributionDetail } from "@/components/TownContributionDetail";

type RouteParams = {
  params: Promise<{
    contributionId: string;
  }>;
};

export default async function TownReturnDetailPage({ params }: RouteParams) {
  const { contributionId } = await params;

  if (!contributionId) {
    redirect("/admin/retours");
  }

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

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: {
      id: true,
      communeId: true,
      type: true,
      status: true,
      categoryLabel: true,
      subcategory: true,
      details: true,
      locationLabel: true,
      latitude: true,
      longitude: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      closureNote: true,
      closedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!contribution || contribution.communeId !== session.user.communeId) {
    redirect("/admin/retours");
  }

  return (
    <div className="fr-flow">
      <TownContributionDetail
        contribution={{
          id: contribution.id,
          type: contribution.type,
          status: contribution.status,
          categoryLabel: contribution.categoryLabel,
          subcategory: contribution.subcategory,
          details: contribution.details,
          locationLabel: contribution.locationLabel,
          latitude: contribution.latitude,
          longitude: contribution.longitude,
          photoUrl: contribution.photoUrl,
          createdAt: contribution.createdAt.toISOString(),
          updatedAt: contribution.updatedAt.toISOString(),
          closedAt: contribution.closedAt ? contribution.closedAt.toISOString() : null,
          closureNote: contribution.closureNote ?? null,
          closedBy: contribution.closedBy
            ? {
                firstName: contribution.closedBy.firstName,
                lastName: contribution.closedBy.lastName,
                email: contribution.closedBy.email,
              }
            : null,
        }}
      />
    </div>
  );
}

