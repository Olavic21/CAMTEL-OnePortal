import { useState } from 'react';
import { productsApi } from '../api/productsApi';

// Declenche le telechargement du blob PDF retourne par l'API
// (section "Developper l'endpoint d'export PDF de fiche produit", roadmap V2).
export function useExportProductPdf() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf(productId: number, productSlug: string) {
    setIsExporting(true);
    setError(null);
    try {
      const blob = (await productsApi.exportPdf(productId)) as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fiche-produit-${productSlug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Le PDF n'a pas pu etre genere. Reessayez plus tard.");
    } finally {
      setIsExporting(false);
    }
  }

  return { exportPdf, isExporting, error };
}
