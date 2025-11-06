/* eslint-disable no-console */
import "dotenv/config";
import readline from "node:readline";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { Role } from "@prisma/client";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string) =>
  new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
  const email = await question("Email de l'admin: ");
  const password = await question("Mot de passe: ");
  const firstName = await question("Prénom (optionnel): ");
  const lastName = await question("Nom (optionnel): ");

  if (!email || !password) {
    throw new Error("Email et mot de passe sont requis.");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: Role.ADMIN,
    },
    create: {
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: Role.ADMIN,
    },
  });

  console.log(`Compte admin ${email} créé/mis à jour.`);
}

main()
  .catch((error) => {
    console.error("Erreur lors de la création de l'admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
