/**
 * Script de migration pour générer des numéros de ticket
 * pour toutes les contributions existantes qui n'en ont pas encore
 *
 * Usage: tsx scripts/migrate-ticket-numbers.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateUniqueTicketNumber } from "../lib/ticket";

const prisma = new PrismaClient();

async function main() {
  console.log("Début de la migration des numéros de ticket...");

  // Récupérer toutes les contributions
  // Note: Avec MongoDB, on doit vérifier toutes les contributions
  // car le champ ticketNumber pourrait ne pas exister pour les anciennes
  const allContributions = await prisma.contribution.findMany({
    select: {
      id: true,
      ticketNumber: true,
    },
  });

  // Filtrer celles sans ticketNumber
  const contributionsWithoutTicket = allContributions.filter(
    (c) => !c.ticketNumber || c.ticketNumber.trim().length === 0
  );

  console.log(
    `Trouvé ${contributionsWithoutTicket.length} contribution(s) sans numéro de ticket`
  );

  if (contributionsWithoutTicket.length === 0) {
    console.log("Aucune migration nécessaire.");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const contribution of contributionsWithoutTicket) {
    try {
      // Générer un numéro de ticket unique
      const ticketNumber = await generateUniqueTicketNumber(async (tn) => {
        const existing = await prisma.contribution.findUnique({
          where: { ticketNumber: tn },
          select: { id: true },
        });
        return !!existing;
      });

      // Mettre à jour la contribution
      await prisma.contribution.update({
        where: { id: contribution.id },
        data: { ticketNumber },
      });

      successCount++;
      console.log(
        `✓ Contribution ${contribution.id} -> Ticket ${ticketNumber}`
      );
    } catch (error) {
      errorCount++;
      console.error(
        `✗ Erreur pour la contribution ${contribution.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("\nMigration terminée:");
  console.log(`  - Succès: ${successCount}`);
  console.log(`  - Erreurs: ${errorCount}`);
}

main()
  .catch((error) => {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

