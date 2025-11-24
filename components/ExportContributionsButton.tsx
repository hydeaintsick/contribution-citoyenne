"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

export function ExportContributionsButton() {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/contributions/export");
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Récupérer le nom du fichier depuis les headers Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || "retours-citoyens.csv"
        : "retours-citoyens.csv";
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Une erreur est survenue lors de l'export. Veuillez réessayer.");
    }
  };

  return (
    <Button
      priority="secondary"
      iconId="fr-icon-download-line"
      onClick={handleExport}
    >
      Télécharger au format Excel
    </Button>
  );
}

