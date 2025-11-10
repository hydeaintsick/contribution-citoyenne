import { prisma } from "@/lib/prisma";
import { CityDirectory } from "@/components/CityDirectory";
import { ensureCommuneSlug } from "@/lib/communes";

export const revalidate = 3600;

export default async function AnnuairePage() {
  const communes = await prisma.commune.findMany({
    where: {
      NOT: {
        isVisible: false,
      },
    },
    select: {
      id: true,
      name: true,
      postalCode: true,
      websiteUrl: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const communesWithSlugs = await Promise.all(
    communes.map(async (commune) => ({
      ...commune,
      slug: await ensureCommuneSlug(commune),
    }))
  );

  return (
    <main className="fr-container fr-container--fluid fr-py-6w fr-flow">
      <header className="fr-flow">
        <h1 className="fr-h2">Annuaire des villes</h1>
        <p className="fr-text--lead">
          Retrouvez les communes participantes et accédez à leur portail citoyen
          pour contribuer en quelques clics.
        </p>
      </header>

      <CityDirectory communes={communesWithSlugs} />
    </main>
  );
}
