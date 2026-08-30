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

export interface PriceAiSnapshotCoverage {
  minTotal: number;
  maxTotal: number;
  totalDrift: number;
  totalDriftLimit: number;
  missingLimit: number;
}

export interface PriceAiOfferSnapshot {
  price: number | string | null;
  status: PriceAiOfferStatus;
  observedAt: string;
}

export function catalogSortOrderForSourceIndex(index: number): number {
  if (!Number.isInteger(index) || index < 0) throw new Error('invalid_catalog_source_index');
  return 1_000 + index;
}

export interface PriceAiChangeContext {
  productSlug: string;
  productName: string;
  merchantName: string;
  sourceUrl: string;
}

export interface PriceAiChangeRow {
  product_slug: string;
  product_name: string;
  merchant_name: string;
  source_url: string;
  previous_price: number | null;
  current_price: number | null;
  previous_stock: PriceAiOfferStatus;
  current_stock: PriceAiOfferStatus;
  observed_at: string;
}

function finitePrice(value: number | string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function buildPriceAiChange(
  previous: PriceAiOfferSnapshot | null,
  current: PriceAiOfferSnapshot,
  context: PriceAiChangeContext,
): PriceAiChangeRow | null {
  if (!previous) return null;

  const previousAt = Date.parse(previous.observedAt);
  const currentAt = Date.parse(current.observedAt);
  if (!Number.isFinite(previousAt) || !Number.isFinite(currentAt) || currentAt <= previousAt) return null;

  const previousPrice = finitePrice(previous.price);
  const currentPrice = finitePrice(current.price);
  if (previousPrice === currentPrice && previous.status === current.status) return null;

  return {
    product_slug: context.productSlug,
    product_name: context.productName,
    merchant_name: context.merchantName,
    source_url: context.sourceUrl,
    previous_price: previousPrice,
    current_price: currentPrice,
    previous_stock: previous.status,
    current_stock: current.status,
    observed_at: current.observedAt,
  };
}

export function isAllowedPriceAiProduct(product: PriceAiProductForImport): boolean {
  return product.id !== 'other-product'
    && product.slug !== 'other-product';
}

export function normalizePriceAiStatus(status: unknown, effectiveStatus: unknown, hidden: unknown): PriceAiOfferStatus {
  if (hidden === true) return 'blacklisted';
  // `status` describes the product's stock. `effectiveStatus` describes whether
  // the source record is currently usable and must never promote a sold-out
  // product to an in-stock offer.
  if (status === 'in_stock' || status === 'low_stock') return 'in_stock';
  if (status === 'out_of_stock') return 'out_of_stock';
  if (status === 'blacklisted') return 'blacklisted';
  if (status === 'offline') return 'offline';
  void effectiveStatus;
  return 'offline';
}

export function validatePriceAiSnapshotCoverage(
  observedTotals: readonly number[],
  uniqueOfferCount: number,
): PriceAiSnapshotCoverage {
  if (!observedTotals.length || observedTotals.some((total) => !Number.isInteger(total) || total < 0)) {
    throw new Error('priceai_invalid_observed_totals');
  }
  if (!Number.isInteger(uniqueOfferCount) || uniqueOfferCount < 0) {
    throw new Error('priceai_invalid_unique_offer_count');
  }

  const minTotal = Math.min(...observedTotals);
  const maxTotal = Math.max(...observedTotals);
  const totalDrift = maxTotal - minTotal;
  const totalDriftLimit = Math.max(25, Math.ceil(maxTotal * 0.02));
  if (totalDrift > totalDriftLimit) {
    throw new Error(`priceai_total_drift_too_large:${minTotal}_${maxTotal}`);
  }

  const missingLimit = maxTotal < 100 ? 0 : Math.max(10, Math.ceil(maxTotal * 0.01));
  if (uniqueOfferCount < Math.max(0, minTotal - missingLimit)) {
    throw new Error(`priceai_offer_count_too_small:min_${minTotal}:received_${uniqueOfferCount}`);
  }
  if (uniqueOfferCount > maxTotal + totalDriftLimit) {
    throw new Error(`priceai_offer_count_too_large:max_${maxTotal}:received_${uniqueOfferCount}`);
  }

  return { minTotal, maxTotal, totalDrift, totalDriftLimit, missingLimit };
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
