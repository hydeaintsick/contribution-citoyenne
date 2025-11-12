/* eslint-disable no-console */
import "dotenv/config";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../lib/prisma";
import {
  classifyContributionWithTitle,
  isMistralConfigured,
} from "../lib/mistral";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitFlagIndex = args.findIndex((arg) => arg === "--limit");
const limit =
  limitFlagIndex !== -1 && args[limitFlagIndex + 1]
    ? Number.parseInt(args[limitFlagIndex + 1]!, 10)
    : undefined;
const sleepMsFlagIndex = args.findIndex((arg) => arg === "--sleep");
const sleepMs =
  sleepMsFlagIndex !== -1 && args[sleepMsFlagIndex + 1]
    ? Number.parseInt(args[sleepMsFlagIndex + 1]!, 10)
    : 250;

function truncateTitle(value: string, maxLength = 80) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function fallbackTitle(details: string): string {
  const sentences = details.trim().split(/[.!?]\s+/);
  const firstSentence = sentences[0] ?? details.trim();
  return truncateTitle(firstSentence.length > 0 ? firstSentence : details, 80);
}

async function main() {
  if (!isMistralConfigured) {
    console.error(
      "MISTRAL_API_KEY manquant. Configurez l'environnement avant d'exécuter ce script.",
    );
    process.exit(1);
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    throw new Error(
      "Aucune catégorie active disponible. Configurez des catégories avant de lancer la conversion.",
    );
  }

  const contributions = await prisma.contribution.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      details: true,
      categoryId: true,
      categoryLabel: true,
    },
  });

  const total = typeof limit === "number" ? Math.min(limit, contributions.length) : contributions.length;
  console.log(
    `Démarrage de la requalification Mistral pour ${total} contribution(s)${
      isDryRun ? " [MODE DRY-RUN]" : ""
    }`,
  );

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let index = 0; index < total; index += 1) {
    const contribution = contributions[index]!;
    const details = contribution.details?.trim();

    if (!details) {
      skippedCount += 1;
      console.warn(
        `[${index + 1}/${total}] Contribution ${contribution.id} ignorée (pas de détails).`,
      );
      continue;
    }

    try {
      const classification = await classifyContributionWithTitle({
        categories: categories.map((category) => category.name),
        details,
        existingTitle: contribution.title,
        existingCategory: contribution.categoryLabel,
      });

      if (!classification) {
        skippedCount += 1;
        console.warn(
          `[${index + 1}/${total}] Échec de la classification pour ${contribution.id}.`,
        );
        continue;
      }

      const normalizedCategory = categories.find(
        (category) =>
          category.name.localeCompare(classification.category, "fr", {
            sensitivity: "accent",
            usage: "search",
          }) === 0,
      );

      const nextCategory = normalizedCategory ?? categories[0]!;
      const nextTitle = classification.title
        ? truncateTitle(classification.title)
        : fallbackTitle(details);

      const data: {
        categoryId?: string | null;
        categoryLabel?: string;
        title?: string;
      } = {};

      if (contribution.categoryId !== nextCategory.id) {
        data.categoryId = nextCategory.id;
        data.categoryLabel = nextCategory.name;
      } else if (
        contribution.categoryLabel.localeCompare(
          nextCategory.name,
          "fr",
          {
            sensitivity: "accent",
            usage: "search",
          },
        ) !== 0
      ) {
        data.categoryLabel = nextCategory.name;
      }

      if (!contribution.title || contribution.title.trim() !== nextTitle) {
        data.title = nextTitle;
      }

      if (Object.keys(data).length === 0) {
        console.log(
          `[${index + 1}/${total}] Contribution ${contribution.id} déjà à jour (${nextCategory.name}).`,
        );
        continue;
      }

      if (!isDryRun) {
        await prisma.contribution.update({
          where: { id: contribution.id },
          data,
        });
      }

      updatedCount += 1;
      console.log(
        `[${index + 1}/${total}] Contribution ${contribution.id} mise à jour -> catégorie "${nextCategory.name}", titre "${nextTitle}".`,
      );

      if (!isDryRun && sleepMs > 0) {
        await wait(sleepMs);
      }
    } catch (error) {
      errorCount += 1;
      console.error(
        `[${index + 1}/${total}] Erreur pour ${contribution.id}:`,
        error,
      );
    }
  }

  console.log(
    `Terminé: ${updatedCount} mise(s) à jour, ${skippedCount} contribution(s) ignorée(s), ${errorCount} erreur(s).`,
  );
  if (isDryRun) {
    console.log("Aucune écriture n'a été effectuée (dry-run).");
  }
}

main()
  .catch((error) => {
    console.error("La requalification a échoué:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

