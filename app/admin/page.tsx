import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCommuneStats } from "@/lib/communeStats";
import { ContribcitTeamDashboard } from "@/components/ContribcitTeamDashboard";
import { TownDashboard } from "@/components/TownDashboard";
import { buildTownDashboardData } from "@/lib/contributionStats";

export default async function AdminHomePage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user.role;

  if (role === "ADMIN" || role === "ACCOUNT_MANAGER") {
    const communes = await prisma.commune.findMany({
      select: {
        id: true,
        name: true,
        postalCode: true,
        bbox: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const stats = await buildCommuneStats(
      communes.map((commune) => ({
        id: commune.id,
        name: commune.name,
        postalCode: commune.postalCode,
        bbox: commune.bbox,
        createdAt: commune.createdAt,
      })),
    );

    return <ContribcitTeamDashboard stats={stats} />;
  }

  if (role === "TOWN_MANAGER" || role === "TOWN_EMPLOYEE") {
    if (!session.user.communeId) {
      redirect("/admin/profile");
    }

    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        bbox: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!commune) {
      redirect("/admin");
    }

    const contributions = await prisma.contribution.findMany({
      where: {
        communeId: commune.id,
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        latitude: true,
        longitude: true,
        locationLabel: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dashboardData = buildTownDashboardData(
      contributions.map((contribution) => ({
        id: contribution.id,
        type: contribution.type,
        status: contribution.status,
        createdAt: contribution.createdAt,
        latitude: contribution.latitude,
        longitude: contribution.longitude,
        locationLabel: contribution.locationLabel,
      })),
      {
        bbox: commune.bbox,
        latitude: commune.latitude,
        longitude: commune.longitude,
      },
    );

    return (
      <TownDashboard
        commune={{
          id: commune.id,
          name: commune.name,
          websiteUrl: commune.websiteUrl,
        }}
        data={dashboardData}
      />
    );
  }

  redirect("/admin/login");
}

