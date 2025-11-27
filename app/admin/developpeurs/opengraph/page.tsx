import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionCookieName,
  parseSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { GraphQLApiKeyDisplay } from "@/components/GraphQLApiKeyDisplay";
import Link from "next/link";

export default async function GraphQLPage() {
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
    redirect("/admin/login?redirectTo=/admin/developpeurs/opengraph");
  }

  if (!session.user.communeId) {
    redirect("/admin");
  }

  const commune = await prisma.commune.findUnique({
    where: { id: session.user.communeId },
    select: {
      id: true,
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

  const apiKey = commune.webhookSecret;

  return (
    <div className="fr-flow">
      <h1 className="fr-h2 fr-mb-4w">API GraphQL</h1>

      <Alert
        severity="info"
        title="API GraphQL"
        description={
          <>
            L'API GraphQL vous permet d'interroger vos données de manière flexible.
            Consultez la{" "}
            <Link href="/docs#graphql" className="fr-link">
              documentation complète
            </Link>{" "}
            pour plus d'informations.
          </>
        }
        className="fr-mb-4w"
      />

      <GraphQLApiKeyDisplay apiKey={apiKey} />
    </div>
  );
}

