export interface PriceAiProductForImport {
  id: string;
  slug: string;
  platform: string;
}

export interface PriceAiOfferForImport {
  id: string;
  currency?: string | null;
  collectorKind?: string | null;
  confidence?: number | null;
  filterTags?: string[] | null;
  minOrderQuantity?: number | null;
  sourceIncludedAt?: string | null;
  freshnessStatus?: string | null;
}

export type PriceAiOfferStatus = 'in_stock' | 'out_of_stock' | 'offline' | 'blacklisted';

export function isAllowedPriceAiProduct(product: PriceAiProductForImport): boolean {
  return product.id !== 'other-product'
    && product.slug !== 'other-product';
}

export function normalizePriceAiStatus(status: unknown, effectiveStatus: unknown, hidden: unknown): PriceAiOfferStatus {
  if (hidden === true) return 'blacklisted';
  if (status === 'in_stock' || effectiveStatus === 'available') return 'in_stock';
  if (status === 'out_of_stock' || effectiveStatus === 'unavailable') return 'out_of_stock';
  if (status === 'blacklisted') return 'blacklisted';
  return 'offline';
}

export function validHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildPriceAiTags(offer: PriceAiOfferForImport, groupCount: number): string[] {
  const includedDate = offer.sourceIncludedAt && /^\d{4}-\d{2}-\d{2}/.test(offer.sourceIncludedAt)
    ? offer.sourceIncludedAt.slice(0, 10)
    : null;
  const facets = (offer.filterTags || [])
    .slice(0, 12)
    .map((tag) => `facet:${tag.replace(/[:\s]+/g, '_').slice(0, 80)}`);

  return [
    'source:priceai',
    `priceaiOfferId:${offer.id}`,
    `groupCount:${Math.max(1, groupCount)}`,
    `currency:${offer.currency || 'CNY'}`,
    `collector:${offer.collectorKind || 'unknown'}`,
    `freshness:${offer.freshnessStatus || 'unknown'}`,
    offer.minOrderQuantity == null ? null : `minOrder:${offer.minOrderQuantity}`,
    includedDate ? `includedTime:${includedDate}` : null,
    `risk:${typeof offer.confidence === 'number' && offer.confidence >= 0.8 ? 'low' : 'medium'}`,
    ...facets,
  ].filter((value): value is string => Boolean(value));
}
