import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCommuneStats } from "@/lib/communeStats";
import { ContribcitTeamDashboard } from "@/components/ContribcitTeamDashboard";

export default async function AdminHomePage() {
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
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    redirect("/admin/login");
  }

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

