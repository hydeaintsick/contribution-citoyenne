import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminAccountManagers } from "@/components/AdminAccountManagers";

export default async function AdminAccountManagersPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login?redirectTo=/admin/account-managers");
  }

  const accountManagers = await prisma.user.findMany({
    where: {
      role: "ACCOUNT_MANAGER",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="fr-flow">
      <AdminAccountManagers
        initialAccountManagers={accountManagers.map((manager) => ({
          ...manager,
          createdAt: manager.createdAt.toISOString(),
          updatedAt: manager.updatedAt.toISOString(),
          lastLoginAt: manager.lastLoginAt
            ? manager.lastLoginAt.toISOString()
            : null,
        }))}
      />
    </div>
  );
}


