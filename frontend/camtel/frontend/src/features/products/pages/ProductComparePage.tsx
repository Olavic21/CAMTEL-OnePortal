import { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { Select } from '@/shared/components/Input';
import { formatPrice } from '@/shared/utils/format';
import { EmptyState } from '@/shared/components/EmptyState';

// Comparateur d'offres cote a cote (roadmap V3, inspire du benchmark Vodafone - section 2).
export default function ProductComparePage() {
  const { data } = useProducts({ status: 'published' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const products = data?.results ?? [];
  const selected = products.filter((p) => selectedIds.includes(p.id));

  function addProduct(id: number) {
    if (id && !selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">Comparateur d&apos;offres</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">Selectionnez jusqu&apos;a 3 produits a comparer cote a cote.</p>

      <div className="mt-6 max-w-xs">
        <Select
          value=""
          onChange={(e) => addProduct(Number(e.target.value))}
          aria-label="Ajouter un produit a comparer"
        >
          <option value="">Ajouter un produit...</option>
          {products
            .filter((p) => !selectedIds.includes(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </div>

      {selected.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Scale} title="Aucun produit selectionne pour la comparaison" />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-40" />
                {selected.map((p) => (
                  <th key={p.id} className="border-b border-neutral-200 px-4 py-3 text-left dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <button
                        onClick={() => setSelectedIds(selectedIds.filter((id) => id !== p.id))}
                        aria-label={`Retirer ${p.name}`}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-neutral-100 px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 dark:border-neutral-800">Categorie</td>
                {selected.map((p) => (
                  <td key={p.id} className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                    {p.category?.name ?? '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-b border-neutral-100 px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 dark:border-neutral-800">Prix</td>
                {selected.map((p) => (
                  <td key={p.id} className="border-b border-neutral-100 px-4 py-3 font-semibold text-primary dark:border-neutral-800">
                    {formatPrice(p.price, p.price_unit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">Description</td>
                {selected.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {p.short_description}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
