import { createClient } from '@supabase/supabase-js';

import {
  buildLegacyOfferTags,
  buildLegacySearchKeywords,
  normalizeLegacyStockStatus,
  type LegacyOfferForImport,
  type LegacyProductForImport,
} from '../src/lib/legacy-baseline-import';

const DEFAULT_LEGACY_API_URL = 'https://supply.aivora.cn';
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const FETCH_CONCURRENCY = 4;
const FETCH_ATTEMPTS = 3;

interface LegacyProduct extends LegacyProductForImport {
  subtitle: string | null;
  description: string;
  product_type: string;
  offer_count: number;
}

interface LegacyMerchant {
  slug: string;
  name: string;
  site_url: string;
  status: string;
  source_score: number;
  last_success_at: string | null;
  last_checked_at: string | null;
}

interface LegacyOffer extends LegacyOfferForImport {
  merchant_slug: string;
  merchant_name: string;
  original_name: string;
  source_url: string;
  price: number | null;
  stock_status: string;
  stock_count: number | null;
  item_fingerprint: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function apiBase(): string {
  const url = new URL(process.env.LEGACY_RADAR_API_URL || DEFAULT_LEGACY_API_URL);
  if (url.protocol !== 'https:') throw new Error('legacy_api_must_use_https');
  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchData<T>(url: string): Promise<T[]> {
  const path = new URL(url).pathname;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
      if (!(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
        throw new Error('unexpected_content_type');
      }
      const body = await response.arrayBuffer();
      if (body.byteLength > MAX_RESPONSE_BYTES) throw new Error('response_too_large');
      const payload: unknown = JSON.parse(new TextDecoder().decode(body));
      if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { data?: unknown }).data)) {
        throw new Error('invalid_payload');
      }
      return (payload as { data: T[] }).data;
    } catch (error) {
      if (attempt === FETCH_ATTEMPTS) {
        const reason = error instanceof Error ? error.message : 'unknown';
        throw new Error(`legacy_fetch_failed:${path}:${reason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`legacy_fetch_failed:${path}:unknown`);
}

async function mapConcurrent<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const sourceBase = apiBase();
  const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [products, merchants] = await Promise.all([
    fetchData<LegacyProduct>(`${sourceBase}/api/v1/products`),
    fetchData<LegacyMerchant>(`${sourceBase}/api/v1/merchants`),
  ]);
  if (!products.length || !merchants.length) throw new Error('legacy_baseline_empty');

  const productsWithOffers = products.filter((product) => product.offer_count > 0);
  const offersByProduct = await mapConcurrent(productsWithOffers, async (product) => ({
    product,
    offers: await fetchData<LegacyOffer>(`${sourceBase}/api/v1/products/${encodeURIComponent(product.slug)}/offers`),
  }));
  for (const { product, offers } of offersByProduct) {
    if (offers.length !== product.offer_count) {
      throw new Error(`legacy_offer_count_mismatch:${product.slug}:expected_${product.offer_count}:received_${offers.length}`);
    }
  }
  const offers = offersByProduct.flatMap(({ product, offers: productOffers }) => (
    productOffers.map((offer) => ({ product, offer }))
  ));

  const platformNames = [...new Set(products.map((product) => product.platform.trim()).filter(Boolean))];
  const { data: platforms, error: platformError } = await supabase
    .from('product_platforms')
    .upsert(platformNames.map((name, index) => ({ name, is_active: true, sort_order: index + 1 })), { onConflict: 'name' })
    .select('id,name');
  if (platformError) throw platformError;
  const platformIds = new Map((platforms || []).map((row) => [row.name, row.id]));

  const targetRows = merchants.map((merchant) => ({
    name: merchant.name,
    site_url: merchant.site_url,
    scrape_url: `${sourceBase}/api/v1/merchants?slug=${encodeURIComponent(merchant.slug)}`,
    scraper_type: 'legacy-v1-api',
    is_active: true,
    is_verified: merchant.source_score >= 80,
    operational_status: merchant.status || 'unknown',
    last_valid_at: merchant.last_success_at,
    last_attempt_at: merchant.last_checked_at,
    error_streak: 0,
    latest_error_msg: null,
    remarks: `Imported from verified V1 merchant ${merchant.slug}`,
  }));
  const { data: targets, error: targetError } = await supabase
    .from('crawler_targets')
    .upsert(targetRows, { onConflict: 'scrape_url' })
    .select('id,name,scrape_url');
  if (targetError) throw targetError;
  const targetIdsBySlug = new Map(merchants.map((merchant) => {
    const scrapeUrl = `${sourceBase}/api/v1/merchants?slug=${encodeURIComponent(merchant.slug)}`;
    const target = (targets || []).find((row) => row.scrape_url === scrapeUrl);
    return [merchant.slug, target?.id || ''];
  }));

  const catalogRows = products.map((product, index) => {
    const platformId = platformIds.get(product.platform);
    if (!platformId) throw new Error(`missing_platform:${product.platform}`);
    return {
      slug: product.slug,
      name: product.name,
      short_desc: product.description || product.subtitle || '',
      search_keywords: buildLegacySearchKeywords(product),
      is_active: true,
      platform_id: platformId,
      sort_order: products.length - index,
      is_catch_all: product.slug === 'other-products',
    };
  });
  const { data: catalog, error: catalogError } = await supabase
    .from('product_catalog')
    .upsert(catalogRows, { onConflict: 'slug' })
    .select('id,slug');
  if (catalogError) throw catalogError;
  const catalogIds = new Map((catalog || []).map((row) => [row.slug, row.id]));

  const offerRows = offers.map(({ product, offer }) => {
    const targetId = targetIdsBySlug.get(offer.merchant_slug);
    const catalogId = catalogIds.get(product.slug);
    if (!targetId) throw new Error(`missing_target:${offer.merchant_slug}`);
    if (!catalogId) throw new Error(`missing_catalog:${product.slug}`);
    return {
      target_id: targetId,
      canonical_product_id: catalogId,
      product_title: offer.original_name,
      price: offer.price,
      status: normalizeLegacyStockStatus(offer.stock_status),
      url: offer.source_url,
      tags: buildLegacyOfferTags(offer),
      inventory_level: offer.stock_count,
      scraped_at: offer.observed_at,
      last_crawled_at: offer.observed_at,
      updated_at: offer.observed_at,
      is_manual_override: false,
    };
  });
  if (offerRows.length) {
    const { error: offerError } = await supabase
      .from('market_offers')
      .upsert(offerRows, { onConflict: 'target_id,product_title' });
    if (offerError) throw offerError;
  }

  const [catalogCount, targetCount, offerCount] = await Promise.all([
    supabase.from('product_catalog').select('id', { count: 'exact', head: true }),
    supabase.from('crawler_targets').select('id', { count: 'exact', head: true }),
    supabase.from('market_offers').select('id', { count: 'exact', head: true }).contains('tags', ['source:legacy-v1']),
  ]);
  if (catalogCount.error) throw catalogCount.error;
  if (targetCount.error) throw targetCount.error;
  if (offerCount.error) throw offerCount.error;
  if ((catalogCount.count || 0) < products.length) throw new Error('catalog_validation_failed');
  if ((targetCount.count || 0) < merchants.length) throw new Error('target_validation_failed');
  if (offerCount.count !== offers.length) {
    throw new Error(`offer_validation_failed:expected_${offers.length}:received_${offerCount.count || 0}`);
  }

  console.log(JSON.stringify({
    source: sourceBase,
    products: products.length,
    productsWithOffers: productsWithOffers.length,
    merchants: merchants.length,
    offers: offers.length,
    validation: 'passed',
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'legacy_import_failed');
  process.exitCode = 1;
});
