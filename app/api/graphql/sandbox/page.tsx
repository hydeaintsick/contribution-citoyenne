import { redirect } from "next/navigation";

export default function GraphQLSandboxPage() {
  // Rediriger vers la page de configuration GraphQL
  // L'accès à la sandbox sans clé API n'est pas autorisé
  redirect("/admin/developpeurs/opengraph");
}
