import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '@/shared/types';

const baseProduct: Product = {
  id: 1,
  name: 'Fibre Optique Entreprise',
  slug: 'fibre-optique-entreprise',
  category_id: 3,
  short_description: 'Connexion tres haut debit pour les entreprises.',
  description: 'Description complete.',
  price: 25000,
  price_unit: '/mois',
  is_featured: true,
  status: 'published',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );
}

describe('ProductCard', () => {
  it('displays the product name and short description', () => {
    renderCard(baseProduct);
    expect(screen.getByText('Fibre Optique Entreprise')).toBeInTheDocument();
    expect(screen.getByText(/Connexion tres haut debit/)).toBeInTheDocument();
  });

  it('shows the "Nouveau" badge only when the product is featured', () => {
    renderCard(baseProduct);
    expect(screen.getByText('Nouveau')).toBeInTheDocument();

    renderCard({ ...baseProduct, id: 2, is_featured: false });
    expect(screen.queryAllByText('Nouveau')).toHaveLength(1); // toujours 1 seul (le premier rendu)
  });

  it('links to the product detail page using its slug', () => {
    renderCard(baseProduct);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/produits/fibre-optique-entreprise');
  });

  it('falls back to "Prix sur demande" when price is null', () => {
    renderCard({ ...baseProduct, id: 3, price: null });
    expect(screen.getByText('Prix sur demande')).toBeInTheDocument();
  });
});
