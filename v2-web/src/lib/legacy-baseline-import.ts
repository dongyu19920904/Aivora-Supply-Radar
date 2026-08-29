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

export interface LegacyOpportunityForImport {
  report_date: unknown;
  title: unknown;
  description: unknown;
  body_markdown: unknown;
  source_url: unknown;
  source_sha: unknown;
  published_at: unknown;
  synced_at: unknown;
}

export interface LegacyPriceChangeForImport {
  product_slug: unknown;
  product_name: unknown;
  merchant_name: unknown;
  source_url: unknown;
  previous_price: unknown;
  current_price: unknown;
  previous_stock: unknown;
  current_stock: unknown;
  observed_at: unknown;
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

function boundedText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function nullableBoundedText(value: unknown, maxLength: number): string | null {
  const normalized = boundedText(value, maxLength);
  return normalized || null;
}

function httpsUrl(value: unknown): string | null {
  const normalized = boundedText(value, 2_048);
  try {
    return new URL(normalized).protocol === 'https:' ? normalized : null;
  } catch {
    return null;
  }
}

function timestamp(value: unknown, assumeShanghai = false): string | null {
  const normalized = boundedText(value, 40);
  if (!normalized) return null;
  const candidate = assumeShanghai && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)
    ? `${normalized.replace(' ', 'T')}+08:00`
    : normalized;
  return Number.isNaN(Date.parse(candidate)) ? null : candidate;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function normalizeLegacyOpportunity(value: LegacyOpportunityForImport) {
  const reportDate = boundedText(value.report_date, 10);
  const title = boundedText(value.title, 200);
  const bodyMarkdown = boundedText(value.body_markdown, 120_000);
  const sourceUrl = httpsUrl(value.source_url);
  const publishedAt = timestamp(value.published_at);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !title || !bodyMarkdown || !sourceUrl || !publishedAt) {
    return null;
  }
  return {
    report_date: reportDate,
    title,
    description: boundedText(value.description, 600),
    body_markdown: bodyMarkdown,
    source_url: sourceUrl,
    source_sha: nullableBoundedText(value.source_sha, 80),
    published_at: publishedAt,
    source_synced_at: timestamp(value.synced_at, true),
    imported_at: new Date().toISOString(),
  };
}

export function normalizeLegacyPriceChange(value: LegacyPriceChangeForImport) {
  const productSlug = boundedText(value.product_slug, 160);
  const productName = boundedText(value.product_name, 240);
  const merchantName = boundedText(value.merchant_name, 240);
  const sourceUrl = httpsUrl(value.source_url);
  const observedAt = timestamp(value.observed_at);
  if (!productSlug || !productName || !merchantName || !sourceUrl || !observedAt) return null;
  return {
    product_slug: productSlug,
    product_name: productName,
    merchant_name: merchantName,
    source_url: sourceUrl,
    previous_price: nullableNumber(value.previous_price),
    current_price: nullableNumber(value.current_price),
    previous_stock: nullableBoundedText(value.previous_stock, 80),
    current_stock: nullableBoundedText(value.current_stock, 80),
    observed_at: observedAt,
    imported_at: new Date().toISOString(),
  };
}
