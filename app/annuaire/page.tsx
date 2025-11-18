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
      isPartner: true,
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
    <main className="fr-container--fluid fr-background-alt--grey fr-py-8w">
      <div className="fr-container fr-flow">
        <header className="fr-grid-row fr-mb-6w">
          <div className="fr-col-12 fr-col-md-10 fr-col-lg-8 fr-flow">
            <h1 className="fr-h2">Annuaire des villes</h1>
            <p className="fr-text--lead fr-mb-0">
                Retrouvez les communes participantes et accédez à leur portail citoyen
                pour contribuer en quelques clics.
              </p>
          </div>
        </header>

        <CityDirectory communes={communesWithSlugs} />
      </div>
    </main>
  );
}
