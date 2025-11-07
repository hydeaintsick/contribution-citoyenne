import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CitizenReportTunnel } from "@/components/CitizenReportTunnel";

type ContribPageProps = {
  params: Promise<{
    communeId: string;
  }>;
};

async function getCommuneName(communeId: string) {
  try {
    const commune = await prisma.commune.findUnique({
      where: {
        id: communeId,
      },
      select: {
        name: true,
      },
    });

    if (!commune) {
      return null;
    }

    return commune.name;
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

  const communeName = (await getCommuneName(communeId)) ?? "votre commune";

  return (
    <main className="fr-py-6w">
      <CitizenReportTunnel communeId={communeId} communeName={communeName} />
    </main>
  );
}
