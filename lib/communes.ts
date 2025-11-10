import { prisma } from "@/lib/prisma";
import { generateCommuneSlug } from "@/lib/slug";

type CommuneWithSlugFields = {
  id: string;
  name: string;
  postalCode: string;
  slug: string | null;
};

export async function ensureCommuneSlug(commune: CommuneWithSlugFields): Promise<string> {
  if (commune.slug) {
    return commune.slug;
  }

  const slug = generateCommuneSlug(commune.name, commune.postalCode);

  await prisma.commune.update({
    where: { id: commune.id },
    data: { slug },
  });

  return slug;
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function fetchCommuneBySlugOrId(identifier: string) {
  const orConditions: Array<{ slug: string } | { id: string }> = [
    { slug: identifier },
  ];

  if (OBJECT_ID_REGEX.test(identifier)) {
    orConditions.push({ id: identifier });
  }

  const commune = await prisma.commune.findFirst({
    where: {
      OR: orConditions,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      postalCode: true,
      websiteUrl: true,
      isVisible: true,
    },
  });

  if (!commune) {
    return null;
  }

  const slug = await ensureCommuneSlug(commune);

  return {
    ...commune,
    slug,
  };
}

