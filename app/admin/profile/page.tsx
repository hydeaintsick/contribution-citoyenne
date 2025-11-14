import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProfileForm } from "@/components/AdminProfileForm";

export default async function AdminProfilePage() {
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
    !["ADMIN", "ACCOUNT_MANAGER", "TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)
  ) {
    redirect("/admin/login?redirectTo=/admin/profile");
  }

  if (
    (session.user.role === "TOWN_MANAGER" || session.user.role === "TOWN_EMPLOYEE") &&
    !session.user.communeId
  ) {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      title: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/admin/login");
  }

  let communeName: string | null = null;

  if (session.user.communeId) {
    const commune = await prisma.commune.findUnique({
      where: { id: session.user.communeId },
      select: { name: true },
    });
    communeName = commune?.name ?? null;
  }

  return (
    <div className="fr-flow">
      <AdminProfileForm
        initialData={{
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          title: user.title,
          phone: user.phone,
        }}
        role={session.user.role}
        communeName={communeName}
      />
    </div>
  );
}

