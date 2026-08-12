import { describe, it, expect } from 'vitest';
import { formatPrice, truncate } from './format';

describe('formatPrice', () => {
  it('returns "Sur devis" when price is null', () => {
    expect(formatPrice(null)).toBe('Sur devis');
  });

  it('returns "Sur devis" when price is undefined', () => {
    expect(formatPrice(undefined)).toBe('Sur devis');
  });

  it('formats a numeric price with the XAF currency', () => {
    const result = formatPrice(15000);
    expect(result).toContain('15');
    expect(result).toMatch(/FCFA|XAF/);
  });

  it('appends the price unit when provided', () => {
    const result = formatPrice(5000, '/mois');
    expect(result.endsWith('/mois')).toBe(true);
  });
});

describe('truncate', () => {
  it('leaves short text unchanged', () => {
    expect(truncate('CAMTEL', 20)).toBe('CAMTEL');
  });

  it('truncates long text and appends an ellipsis', () => {
    const result = truncate('Une description de produit tres longue', 10);
    expect(result.length).toBeLessThanOrEqual(13);
    expect(result.endsWith('...')).toBe(true);
  });
});
