import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { ProductFAQ } from '@/shared/types';

// Composant FAQ sur la fiche produit (roadmap V2, inspire du benchmark Vodafone - section 2).
export function ProductFaqList({ faqs }: { faqs: ProductFAQ[] }) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  if (!faqs.length) return null;

  return (
    <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:border-neutral-800 dark:divide-neutral-800">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
            >
              {faq.question}
              <ChevronDown className={clsx('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen && <p className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-300">{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
