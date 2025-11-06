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

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login?redirectTo=/admin/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="fr-flow">
      <AdminProfileForm
        initialData={{
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }}
      />
    </div>
  );
}

