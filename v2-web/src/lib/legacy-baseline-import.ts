export interface LegacyProductForImport {
  slug: string;
  platform: string;
  name: string;
  subtitle?: string | null;
  product_type?: string | null;
}

export interface LegacyOfferForImport {
  id: number;
  currency?: string | null;
  delivery_type?: string | null;
  warranty?: string | null;
  high_price?: number | null;
  observed_at?: string | null;
}

export type ImportedOfferStatus = 'in_stock' | 'out_of_stock' | 'offline' | 'blacklisted';

export function normalizeLegacyStockStatus(value: unknown): ImportedOfferStatus {
  if (value === 'in_stock' || value === 'out_of_stock' || value === 'offline' || value === 'blacklisted') {
    return value;
  }
  return 'offline';
}

export function buildLegacySearchKeywords(product: LegacyProductForImport): string[] {
  return [...new Set([
    product.platform,
    product.name,
    product.subtitle || '',
    product.product_type || '',
  ].map((value) => value.trim()).filter(Boolean))];
}

export function buildLegacyOfferTags(offer: LegacyOfferForImport): string[] {
  const observedDate = offer.observed_at && /^\d{4}-\d{2}-\d{2}/.test(offer.observed_at)
    ? offer.observed_at.slice(0, 10)
    : null;

  return [
    'source:legacy-v1',
    `legacyOfferId:${offer.id}`,
    `currency:${offer.currency || 'CNY'}`,
    `deliveryType:${offer.delivery_type || 'unknown'}`,
    `warranty:${offer.warranty || 'unknown'}`,
    offer.high_price == null ? null : `highPrice:${offer.high_price}`,
    observedDate ? `includedTime:${observedDate}` : null,
    'risk:low',
  ].filter((value): value is string => Boolean(value));
}
