import { prisma } from "@/lib/prisma";
import { getRegionFromPostalCode, getRegionName } from "@/lib/franceRegions";

export type CommuneStatsByRegion = {
  regionCode: string;
  regionName: string;
  count: number;
};

export type AccountManagerStats = {
  accountManagerId: string;
  accountManagerEmail: string;
  accountManagerName: string;
  communeCount: number;
};

export type CommuneProgressionPoint = {
  date: string;
  registered: number;
  active: number;
  premium: number;
};

/**
 * Calcule les statistiques des communes CRM par région
 */
export async function getCommuneStatsByRegion(): Promise<
  CommuneStatsByRegion[]
> {
  // Compter toutes les communes (visibles et non visibles)
  const communes = await prisma.commune.findMany({
    select: {
      postalCode: true,
    },
  });

  const regionCounts = new Map<string, number>();

  // Compter les communes par région
  for (const commune of communes) {
    const geoData = await getRegionFromPostalCode(commune.postalCode);
    const regionCode = geoData?.codeRegion ?? "unknown";
    const currentCount = regionCounts.get(regionCode) ?? 0;
    regionCounts.set(regionCode, currentCount + 1);
  }

  // Convertir en tableau et trier par nombre décroissant
  const stats: CommuneStatsByRegion[] = Array.from(regionCounts.entries()).map(
    ([code, count]) => ({
      regionCode: code,
      regionName: getRegionName(code),
      count,
    }),
  );

  return stats.sort((a, b) => b.count - a.count);
}

/**
 * Calcule les statistiques par commercial (account manager)
 */
export async function getAccountManagerStats(): Promise<
  AccountManagerStats[]
> {
  // Compter toutes les communes assignées à des account managers
  const communes = await prisma.commune.findMany({
    where: {
      accountManagerId: {
        not: null,
      },
    },
    select: {
      accountManagerId: true,
      accountManager: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const managerCounts = new Map<
    string,
    {
      email: string;
      name: string;
      count: number;
    }
  >();

  for (const commune of communes) {
    if (!commune.accountManagerId || !commune.accountManager) {
      continue;
    }

    const managerId = commune.accountManagerId;
    const existing = managerCounts.get(managerId);

    if (existing) {
      existing.count += 1;
    } else {
      const fullName = [
        commune.accountManager.firstName,
        commune.accountManager.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      managerCounts.set(managerId, {
        email: commune.accountManager.email,
        name: fullName || commune.accountManager.email,
        count: 1,
      });
    }
  }

  return Array.from(managerCounts.entries()).map(([id, data]) => ({
    accountManagerId: id,
    accountManagerEmail: data.email,
    accountManagerName: data.name,
    communeCount: data.count,
  }));
}

/**
 * Calcule la progression des communes dans le temps
 */
export async function getCommuneProgression(
  startDate?: Date,
  endDate?: Date,
): Promise<CommuneProgressionPoint[]> {
  const now = new Date();
  const defaultStartDate = startDate ?? new Date(now.getFullYear(), 0, 1); // Début de l'année
  const defaultEndDate = endDate ?? now;

  const communes = await prisma.commune.findMany({
    where: {
      createdAt: {
        gte: defaultStartDate,
        lte: defaultEndDate,
      },
    },
    select: {
      createdAt: true,
      isVisible: true,
      hasPremiumAccess: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Grouper par mois
  const monthlyData = new Map<string, { registered: number; active: number; premium: number }>();

  for (const commune of communes) {
    const monthKey = commune.createdAt.toISOString().substring(0, 7); // YYYY-MM

    const existing = monthlyData.get(monthKey) ?? {
      registered: 0,
      active: 0,
      premium: 0,
    };

    existing.registered += 1;
    if (commune.isVisible) {
      existing.active += 1;
    }
    if (commune.hasPremiumAccess) {
      existing.premium += 1;
    }

    monthlyData.set(monthKey, existing);
  }

  // Convertir en tableau et calculer les cumuls
  const progression: CommuneProgressionPoint[] = [];
  let registeredCumul = 0;
  let activeCumul = 0;
  let premiumCumul = 0;

  const sortedMonths = Array.from(monthlyData.keys()).sort();

  for (const month of sortedMonths) {
    const data = monthlyData.get(month)!;
    registeredCumul += data.registered;
    activeCumul += data.active;
    premiumCumul += data.premium;

    progression.push({
      date: month,
      registered: registeredCumul,
      active: activeCumul,
      premium: premiumCumul,
    });
  }

  return progression;
}

