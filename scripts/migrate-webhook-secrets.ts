/* eslint-disable no-console */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { generateWebhookSecret } from "../lib/webhook";

async function main() {
  console.log("Recherche des communes sans webhookSecret...");

  // D'abord, vérifier combien de communes existent au total
  const totalCommunes = await prisma.commune.count();
  console.log(`Total de communes dans la base: ${totalCommunes}`);

  if (totalCommunes === 0) {
    console.log("Aucune commune trouvée dans la base de données.");
    return;
  }

  // Récupérer toutes les communes pour vérifier lesquelles n'ont pas de secret
  // MongoDB peut avoir des documents sans le champ webhookSecret du tout
  const allCommunes = await prisma.commune.findMany({
    select: {
      id: true,
      name: true,
      webhookUrl: true,
      webhookSecret: true,
    },
  });

  console.log(`Communes récupérées: ${allCommunes.length}`);

  // Filtrer celles qui n'ont pas de secret (null ou undefined)
  const communes = allCommunes.filter(
    (c) => !c.webhookSecret || c.webhookSecret === null,
  );

  const communesWithSecret = allCommunes.length - communes.length;
  console.log(`Communes avec secret existant: ${communesWithSecret}`);
  console.log(`Communes sans secret: ${communes.length}`);

  if (communes.length === 0) {
    console.log("Aucune commune à migrer (toutes ont déjà un secret).");
    return;
  }

  console.log(`\nDébut de la migration pour ${communes.length} commune(s)...`);

  let updated = 0;
  let errors = 0;

  for (const commune of communes) {
    try {
      const secret = generateWebhookSecret();
      console.log(`Génération du secret pour ${commune.name} (${commune.id})...`);

      const result = await prisma.commune.update({
        where: { id: commune.id },
        data: {
          webhookSecret: secret,
        },
        select: {
          id: true,
          name: true,
          webhookSecret: true,
        },
      });

      if (result.webhookSecret) {
        const webhookInfo = commune.webhookUrl
          ? `(webhook: ${commune.webhookUrl})`
          : "(pas de webhook configuré)";
        console.log(`✓ ${commune.name} ${webhookInfo} - Secret généré: ${result.webhookSecret.substring(0, 10)}...`);
        updated++;
      } else {
        console.error(`✗ Erreur: Le secret n'a pas été sauvegardé pour ${commune.name}`);
        errors++;
      }
    } catch (error) {
      console.error(
        `✗ Erreur pour ${commune.name} (${commune.id}):`,
        error instanceof Error ? error.message : error,
      );
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
      errors++;
    }
  }

  console.log("\n=== Résumé ===");
  console.log(`Communes mises à jour: ${updated}`);
  if (errors > 0) {
    console.log(`Erreurs: ${errors}`);
  }
}

main()
  .catch((error) => {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

