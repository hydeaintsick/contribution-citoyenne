import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiWebhookManager } from "@/components/ApiWebhookManager";

export default async function ApiPage() {
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
    (session.user.role !== "TOWN_MANAGER" &&
      session.user.role !== "TOWN_EMPLOYEE")
  ) {
    redirect("/admin/login?redirectTo=/admin/developpeurs/api");
  }

  if (!session.user.communeId) {
    redirect("/admin");
  }

  const commune = await prisma.commune.findUnique({
    where: { id: session.user.communeId },
    select: {
      id: true,
      webhookUrl: true,
      webhookSecret: true,
      hasPremiumAccess: true,
    },
  });

  if (!commune) {
    redirect("/admin");
  }

  // Vérifier l'accès premium
  const hasPremiumAccess = (commune as { hasPremiumAccess?: boolean }).hasPremiumAccess ?? false;
  if (!hasPremiumAccess) {
    redirect("/admin");
  }

  const logs = await prisma.webhookLog.findMany({
    where: {
      communeId: commune.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      url: true,
      statusCode: true,
      success: true,
      errorMessage: true,
      responseTime: true,
      contributionId: true,
      isTest: true,
      createdAt: true,
    },
  });

  // Convertir les dates en string pour le composant client
  const logsWithStringDates = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="fr-flow">
      <h1 className="fr-h2 fr-mb-4w">API & Webhooks</h1>
      <ApiWebhookManager
        initialWebhookUrl={commune.webhookUrl ?? null}
        initialWebhookSecret={commune.webhookSecret ?? null}
        initialLogs={logsWithStringDates}
      />
    </div>
  );
}

