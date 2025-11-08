import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownEmployeesManager } from "@/components/TownEmployeesManager";

export default async function TownEmployeesPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (!session || session.user.role !== "TOWN_MANAGER") {
    redirect("/admin");
  }

  if (!session.user.communeId) {
    redirect("/admin/profile");
  }

  const employees = await prisma.user.findMany({
    where: {
      communeId: session.user.communeId,
      role: "TOWN_EMPLOYEE",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <TownEmployeesManager
      initialEmployees={employees.map((employee) => ({
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        createdAt: employee.createdAt.toISOString(),
        lastLoginAt: employee.lastLoginAt ? employee.lastLoginAt.toISOString() : null,
      }))}
    />
  );
}

