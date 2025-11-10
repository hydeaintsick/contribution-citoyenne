import { notFound, redirect } from "next/navigation";
import { CitizenReportTunnel } from "@/components/CitizenReportTunnel";
import { fetchCommuneBySlugOrId } from "@/lib/communes";

type ContribPageProps =
  | { params: { communeSlug: string } }
  | { params: Promise<{ communeSlug: string }> };

type CommuneDetails = {
  id: string;
  slug: string;
  name: string;
  postalCode: string;
  websiteUrl: string | null;
  isVisible: boolean;
};

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return Boolean(value) && typeof (value as Promise<T>).then === "function";
}

async function loadCommune(identifier: string): Promise<CommuneDetails | null> {
  return fetchCommuneBySlugOrId(identifier);
}

export default async function ContribPage(props: ContribPageProps) {
  const resolvedParams = isPromise(props.params) ? await props.params : props.params;
  const communeIdentifier = Array.isArray(resolvedParams.communeSlug)
    ? resolvedParams.communeSlug[0]
    : resolvedParams.communeSlug;

  if (!communeIdentifier) {
    notFound();
  }

  const commune = await loadCommune(communeIdentifier);

  if (!commune || !commune.isVisible) {
    notFound();
  }

  if (commune.slug !== communeIdentifier) {
    redirect(`/contrib/${commune.slug}`);
  }

  return (
    <main className="fr-py-6w">
      <CitizenReportTunnel
        communeId={commune.id}
        communeName={commune.name}
        communeWebsite={commune.websiteUrl ?? undefined}
      />
    </main>
  );
}

