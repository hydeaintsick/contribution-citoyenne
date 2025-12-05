import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { CrmCommuneDetail } from "@/components/CrmCommuneDetail";

export default async function CrmCommuneDetailPage({
  params,
}: {
  params: Promise<{ communeId: string }>;
}) {
  const { communeId } = await params;

  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session) {
    redirect("/admin/login?redirectTo=/admin");
  }

  const role = session.user.role;

  if (role !== "ADMIN" && role !== "ACCOUNT_MANAGER") {
    redirect("/admin/login");
  }

  const whereClause: any = {
    id: communeId,
  };

  // Les ACCOUNT_MANAGER ne peuvent voir que leurs communes CRM
  // Soit celles qui leur sont assignées (accountManagerId), soit celles qu'ils ont créées (createdById)
  if (role === "ACCOUNT_MANAGER") {
    whereClause.OR = [
      { accountManagerId: session.user.id },
      { createdById: session.user.id, isVisible: false },
    ];
  }
  // Les ADMIN peuvent voir toutes les communes

  const commune = await prisma.commune.findFirst({
    where: whereClause,
      select: {
        id: true,
        name: true,
        postalCode: true,
        slug: true,
        osmId: true,
        osmType: true,
        bbox: true,
        latitude: true,
        longitude: true,
        websiteUrl: true,
        isVisible: true,
        hasPremiumAccess: true,
        isPartner: true,
        createdAt: true,
        updatedAt: true,
      createdById: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      accountManagerId: true,
      accountManager: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      users: {
        where: { role: "TOWN_MANAGER" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
        take: 1,
      },
      comments: {
        select: {
          id: true,
          message: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!commune) {
    redirect("/admin");
  }

  let accountManagers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  }> = [];

  if (role === "ADMIN") {
    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: ["ACCOUNT_MANAGER", "ADMIN"],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    accountManagers = managers;
  }

  return (
    <CrmCommuneDetail
      commune={{
        ...commune,
        users: commune.users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
        })),
        createdAt: commune.createdAt.toISOString(),
        updatedAt: commune.updatedAt.toISOString(),
        comments: commune.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      }}
      isAdmin={role === "ADMIN"}
      isAccountManager={role === "ACCOUNT_MANAGER"}
      accountManagers={accountManagers}
    />
  );
}

