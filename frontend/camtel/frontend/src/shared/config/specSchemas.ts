import type { ProductSpecificationSchema } from '@/shared/types';

/**
 * Schemas de specifications PRODUIT — PILOTES PAR SCHEMA (cahier des charges 10).
 * Les composants (page produit, comparateur) generent dynamiquement les lignes
 * et colonnes a partir de ces definitions. AUCUNE colonne n'est codee en dur :
 * on ne creera jamais `VPSColumn1`, `VPSColumn2`, etc.
 *
 * Convention :
 * - `key`     : cle lue dans `Product.specifications` (ex: "ram", "data_volume").
 * - `label`   : libelle affiche (FR par defaut, i18n pourra l'ajouter).
 * - `type`    : rendu (texte, nombre, booleen).
 * - `unit?`   : suffixe unitaire (Go, Mbit/s, FCFA...).
 */

/** Serveurs dedies / VPS (DATA_CENTER). */
export const VPS_SCHEMA: ProductSpecificationSchema = [
  { key: 'ram', label: 'RAM', type: 'text', unit: 'Go' },
  { key: 'cpu', label: 'CPU', type: 'text' },
  { key: 'vcpu', label: 'vCPU', type: 'number' },
  { key: 'storage', label: 'Stockage', type: 'text', unit: 'Go' },
  { key: 'ip_public', label: 'IP publique', type: 'number' },
  { key: 'bandwidth', label: 'Bande passante', type: 'text', unit: 'Mbit/s' },
  { key: 'vpn', label: 'VPN', type: 'boolean' },
  { key: 'backup', label: 'Backup', type: 'boolean' },
  { key: 'firewall', label: 'Firewall', type: 'boolean' },
  { key: 'antiddos', label: 'Anti-DDoS', type: 'boolean' },
];

/** Offres mobiles / Blue (MOBILES). */
export const BLUE_SCHEMA: ProductSpecificationSchema = [
  { key: 'data_volume', label: 'Data', type: 'text', unit: 'Go' },
  { key: 'daily_limit', label: 'Limite quotidienne', type: 'boolean' },
  { key: 'sms', label: 'SMS', type: 'text' },
  { key: 'voice', label: 'Voix', type: 'text' },
  { key: 'validity', label: 'Validité', type: 'text' },
];

/** Internet fixe / Fibre (FIXES). */
export const FIBER_SCHEMA: ProductSpecificationSchema = [
  { key: 'speed', label: 'Débit', type: 'text', unit: 'Mbit/s' },
  { key: 'technology', label: 'Technologie', type: 'text' },
  { key: 'coverage', label: 'Couverture', type: 'text' },
  { key: 'install_fee', label: 'Frais de raccordement', type: 'text' },
  { key: 'contract_duration', label: 'Engagement', type: 'text' },
];

/** Transport / Connectivite (TRANSPORT). */
export const TRANSPORT_SCHEMA: ProductSpecificationSchema = [
  { key: 'capacity', label: 'Capacité', type: 'text' },
  { key: 'sla', label: 'SLA', type: 'text' },
  { key: 'technology', label: 'Technologie', type: 'text' },
  { key: 'redundancy', label: 'Redondance', type: 'boolean' },
];

/** Hebergement / e-mail / cloud (DATA_CENTER). */
export const HOSTING_SCHEMA: ProductSpecificationSchema = [
  { key: 'storage', label: 'Stockage', type: 'text', unit: 'Go' },
  { key: 'mailboxes', label: 'Boîtes mail', type: 'number' },
  { key: 'domain', label: 'Nom de domaine', type: 'boolean' },
  { key: 'ssl', label: 'SSL', type: 'boolean' },
];

/**
 * Choix du schema pour une offre en fonction de son `offer_type` (contrat API)
 * ou de balances sur le nom. Fallback : schema vide → le composant retourne
 * un etat vide explicite (rien n'est invente).
 */
export function schemaForOffer(offerType: string | undefined, name: string): ProductSpecificationSchema {
  const ot = offerType?.toUpperCase() ?? '';
  const n = name.toLowerCase();

  if (ot.includes('VPS') || ot.includes('BARE_METAL') || ot.includes('CLOUD') || n.includes('vps')) return VPS_SCHEMA;
  if (ot.includes('BLUE') || ot.includes('MOBILE') || n.includes('blue') || ot.includes('USD') || ot.includes('BUNDLE')) {
    return BLUE_SCHEMA;
  }
  if (ot.includes('FIBER') || ot.includes('INTERNET') || n.includes('fibre')) return FIBER_SCHEMA;
  if (ot.includes('TRANSPORT') || ot.includes('CARRIER') || ot.includes('WL')) return TRANSPORT_SCHEMA;
  if (ot.includes('HOSTING') || ot.includes('EMAIL') || ot.includes('DOMAIN') || n.includes('héberg')) return HOSTING_SCHEMA;

  return [];
}

/**
 * Extrait la valeur d'une spec en gérant les clés légèrement différentes
 * (ex: `install_fee` vs `installation_fee`) et les types booléens.
 */
export function specValue(
  specs: Record<string, string | number | boolean> | undefined,
  item: { key: string },
): string {
  if (!specs) return '';
  const value = specs[item.key];
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}