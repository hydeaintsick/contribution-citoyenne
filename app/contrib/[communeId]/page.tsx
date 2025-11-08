import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CitizenReportTunnel } from "@/components/CitizenReportTunnel";

type ContribPageProps = {
  params: Promise<{
    communeId: string;
  }>;
};

type CommuneDetails = {
  name: string;
  websiteUrl: string | null;
  isVisible: boolean;
};

async function getCommuneDetails(
  communeId: string
): Promise<CommuneDetails | null> {
  try {
    const commune = await prisma.commune.findUnique({
      where: {
        id: communeId,
      },
      select: {
        name: true,
        websiteUrl: true,
        isVisible: true,
      },
    });

    if (!commune) {
      return null;
    }

    return commune;
  } catch (error) {
    console.error("Failed to load commune", error);
    return null;
  }
}

export default async function ContribPage({ params }: ContribPageProps) {
  const { communeId } = await params;

  if (!communeId) {
    notFound();
  }

  const commune = await getCommuneDetails(communeId);

  if (!commune || !commune.isVisible) {
    notFound();
  }

  return (
    <main className="fr-py-6w">
      <CitizenReportTunnel
        communeId={communeId}
        communeName={commune.name}
        communeWebsite={commune.websiteUrl ?? undefined}
      />
    </main>
  );
}
