import { prisma } from "../lib/prisma";

async function main() {
  console.log("Migration de hasPremiumAccess pour les communes existantes...");

  try {
    // Mettre à jour toutes les communes qui n'ont pas le champ hasPremiumAccess défini
    // MongoDB peut avoir des documents sans ce champ même si le schéma Prisma a une valeur par défaut
    const result = await prisma.commune.updateMany({
      where: {
        // On met à jour toutes les communes pour s'assurer que le champ existe
        // Prisma va utiliser la valeur par défaut si le champ n'existe pas
      },
      data: {
        hasPremiumAccess: false,
      },
    });

    console.log(`✅ Migration terminée : ${result.count} communes mises à jour.`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration :", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

