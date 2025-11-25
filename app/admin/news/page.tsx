import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNewsManager } from "@/components/AdminNewsManager";

export default async function AdminNewsPage() {
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

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "ACCOUNT_MANAGER"
  ) {
    redirect("/admin");
  }

  const news = await prisma.news.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          reads: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const newsWithReadCount = news.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    readCount: item._count.reads,
    createdBy: item.createdBy,
  }));

  return <AdminNewsManager initialNews={newsWithReadCount} />;
}

