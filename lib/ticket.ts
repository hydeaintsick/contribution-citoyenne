/**
 * Génère un numéro de ticket unique de 10 caractères
 * Format: A-Z 0-9 (majuscules uniquement)
 */
export function generateTicketNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Vérifie si un numéro de ticket existe déjà dans la base de données
 * Retourne un nouveau numéro de ticket garanti unique
 */
export async function generateUniqueTicketNumber(
  checkExists: (ticketNumber: string) => Promise<boolean>
): Promise<string> {
  let ticketNumber: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  // Générer jusqu'à trouver un numéro unique
  while (exists && attempts < maxAttempts) {
    ticketNumber = generateTicketNumber();
    exists = await checkExists(ticketNumber);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(
      "Impossible de générer un numéro de ticket unique après plusieurs tentatives."
    );
  }

  return ticketNumber!;
}

