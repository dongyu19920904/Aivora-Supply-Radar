import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdir, readFile, readdir, rename, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  buildPriceAiChange,
  buildPriceAiTags,
  catalogSortOrderForSourceIndex,
  deduplicatePriceAiChanges,
  isAllowedPriceAiProduct,
  normalizePriceAiStatus,
  validatePriceAiSnapshotCoverage,
  validHttpsUrl,
  type PriceAiOfferForImport,
  type PriceAiSnapshotCoverage,
} from '../src/lib/priceai-import';

const PAGE_SIZE = 100;
const PAGE_OVERLAP = 20;
const FETCH_CONCURRENCY = 1;
const FETCH_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const WRITE_BATCH_SIZE = 250;
const CHECKPOINT_MAX_AGE_MS = 60 * 60 * 1_000;

interface PriceAiProduct {
  id: string;
  slug: string;
  displayName: string;
  platform: string;
  productType: string;
  spec: string;
  summary: string;
  aliases: string[];
  updatedAt: string;
}

interface PriceAiOffer extends PriceAiOfferForImport {
  sourceId: string;
  sourceName: string;
  sourceStoreName?: string | null;
  sourceTitle: string;
  sourceShopCreatedAt?: string | null;
  shopUrl?: string | null;
  url: string;
  price: number | null;
  status: string;
  effectiveStatus?: string | null;
  hidden?: boolean;
  stockCount?: number | null;
  capturedAt?: string | null;
  lastSeenAt?: string | null;
  verifiedAt?: string | null;
  sourceUpdatedAt?: string | null;
}

interface OfferPage {
  total: number;
  offers: PriceAiOffer[];
  degraded: boolean;
  generatedAt: string;
}

interface ExplorerPayload {
  configured: boolean;
  degraded: boolean;
  generatedAt: string;
  products: PriceAiProduct[];
}

interface ProductOfferSnapshot {
  offers: PriceAiOffer[];
  coverage: PriceAiSnapshotCoverage;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

function apiBase(): string {
  const url = new URL(process.env.PRICEAI_API_URL || 'https://priceai.cc');
  if (url.protocol !== 'https:') throw new Error('priceai_api_must_use_https');
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchJson<T>(url: string): Promise<T> {
  const requestUrl = new URL(url);
  const safePath = `${requestUrl.pathname}${requestUrl.search}`;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; AivoraSupplyRadar/2.0; +https://supply.aivora.cn/)',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
      if (!(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
        throw new Error('unexpected_content_type');
      }
      const body = await response.arrayBuffer();
      if (body.byteLength > MAX_RESPONSE_BYTES) throw new Error('response_too_large');
      return JSON.parse(new TextDecoder().decode(body)) as T;
    } catch (error) {
      if (attempt === FETCH_ATTEMPTS) {
        const causeCode = error && typeof error === 'object' && 'cause' in error
          && error.cause && typeof error.cause === 'object' && 'code' in error.cause
          ? String(error.cause.code)
          : '';
        const reason = `${error instanceof Error ? error.message : 'unknown'}${causeCode ? `_${causeCode}` : ''}`;
        throw new Error(`priceai_fetch_failed:${safePath}:${reason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw new Error(`priceai_fetch_failed:${safePath}:unknown`);
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

async function fetchProductOffers(base: string, product: PriceAiProduct): Promise<ProductOfferSnapshot> {
  const rows: PriceAiOffer[] = [];
  const observedTotals: number[] = [];
  let offset = 0;
  let latestTotal: number | null = null;
  while (latestTotal === null || offset < latestTotal) {
    const page = await fetchJson<OfferPage>(
      `${base}/api/products/${encodeURIComponent(product.id)}/offers?limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (page.degraded || !Array.isArray(page.offers) || !Number.isInteger(page.total) || page.total < 0) {
      throw new Error(`priceai_degraded_or_invalid:${product.id}`);
    }
    observedTotals.push(page.total);
    latestTotal = page.total;
    rows.push(...page.offers);
    if (!page.offers.length && offset < latestTotal) throw new Error(`priceai_incomplete_page:${product.id}`);
    if (offset + page.offers.length >= latestTotal) break;
    offset += PAGE_SIZE - PAGE_OVERLAP;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const unique = new Map(rows.map((offer) => [offer.id, offer]));
  let coverage: PriceAiSnapshotCoverage;
  try {
    coverage = validatePriceAiSnapshotCoverage(observedTotals, unique.size);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'invalid_coverage';
    throw new Error(`priceai_offer_count_mismatch:${product.id}:${reason}`);
  }
  return { offers: [...unique.values()], coverage };
}

async function loadOrFetchProductOffers(base: string, product: PriceAiProduct, checkpointDir: string): Promise<ProductOfferSnapshot> {
  const safeName = product.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const checkpointPath = path.join(checkpointDir, `${safeName}.json`);
  try {
    const checkpointStat = await stat(checkpointPath);
    if (Date.now() - checkpointStat.mtimeMs <= CHECKPOINT_MAX_AGE_MS) {
      const cached: unknown = JSON.parse(await readFile(checkpointPath, 'utf8'));
      if (cached && typeof cached === 'object'
        && (cached as { productId?: unknown }).productId === product.id
        && Array.isArray((cached as { offers?: unknown }).offers)) {
        const offers = (cached as { offers: PriceAiOffer[] }).offers;
        const cachedCoverage = (cached as { coverage?: PriceAiSnapshotCoverage }).coverage;
        return {
          offers,
          coverage: cachedCoverage || validatePriceAiSnapshotCoverage([offers.length], offers.length),
        };
      }
    }
  } catch {
    // Missing, stale, or malformed checkpoints are fetched again.
  }

  const snapshot = await fetchProductOffers(base, product);
  const temporaryPath = `${checkpointPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify({
    productId: product.id,
    fetchedAt: new Date().toISOString(),
    offers: snapshot.offers,
    coverage: snapshot.coverage,
  }), 'utf8');
  await rename(temporaryPath, checkpointPath);
  return snapshot;
}

async function cleanCheckpointDirectory(checkpointDir: string) {
  const entries = await readdir(checkpointDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.json.tmp'))) {
      await unlink(path.join(checkpointDir, entry.name));
    }
  }
  try {
    await rmdir(checkpointDir);
  } catch {
    // Preserve an unexpectedly non-empty directory instead of deleting unknown files.
  }
}

function preferredOffer(current: PriceAiOffer, candidate: PriceAiOffer): PriceAiOffer {
  const currentAvailable = normalizePriceAiStatus(current.status, current.effectiveStatus, current.hidden) === 'in_stock';
  const candidateAvailable = normalizePriceAiStatus(candidate.status, candidate.effectiveStatus, candidate.hidden) === 'in_stock';
  if (candidateAvailable !== currentAvailable) return candidateAvailable ? candidate : current;
  const currentPrice = typeof current.price === 'number' && current.price >= 0 ? current.price : Number.POSITIVE_INFINITY;
  const candidatePrice = typeof candidate.price === 'number' && candidate.price >= 0 ? candidate.price : Number.POSITIVE_INFINITY;
  if (candidatePrice !== currentPrice) return candidatePrice < currentPrice ? candidate : current;
  return String(candidate.lastSeenAt || candidate.capturedAt || '') > String(current.lastSeenAt || current.capturedAt || '')
    ? candidate
    : current;
}

async function upsertBatches(client: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict: string) {
  for (let index = 0; index < rows.length; index += WRITE_BATCH_SIZE) {
    const { error } = await client.from(table).upsert(rows.slice(index, index + WRITE_BATCH_SIZE), { onConflict });
    if (error) throw error;
  }
}

async function main() {
  const base = apiBase();
  const checkpointDir = requiredEnv('PRICEAI_SNAPSHOT_CACHE_DIR');
  const dryRun = process.argv.includes('--dry-run');
  await mkdir(checkpointDir, { recursive: true });
  const explorer = await fetchJson<ExplorerPayload>(`${base}/api/explorer`);
  if (!explorer.configured || explorer.degraded || !Array.isArray(explorer.products)) {
    throw new Error('priceai_explorer_unavailable');
  }
  const products = explorer.products.filter(isAllowedPriceAiProduct);
  if (products.length < 40) throw new Error(`priceai_catalog_too_small:${products.length}`);

  let completedProducts = 0;
  const productOffers = await mapConcurrent(products, async (product) => {
    const snapshot = await loadOrFetchProductOffers(base, product, checkpointDir);
    completedProducts += 1;
    if (completedProducts % 5 === 0 || completedProducts === products.length) {
      console.log(JSON.stringify({ stage: 'source_fetch', completedProducts, totalProducts: products.length }));
    }
    return { product, ...snapshot };
  });
  const rawOffers = productOffers.flatMap(({ product, offers }) => offers.map((offer) => ({ product, offer })));

  const invalidReasons: Record<string, number> = {};
  const validRows = rawOffers.filter(({ offer }) => {
    let reason = '';
    if (!offer.id || !offer.sourceId || !offer.sourceTitle?.trim()) reason = 'missing_identity';
    else if (!validHttpsUrl(offer.url)) reason = 'invalid_or_insecure_url';
    else if (!(offer.price === null || (typeof offer.price === 'number' && Number.isFinite(offer.price) && offer.price >= 0))) {
      reason = 'invalid_price';
    }
    if (reason) invalidReasons[reason] = (invalidReasons[reason] || 0) + 1;
    return !reason;
  });
  const invalidCount = rawOffers.length - validRows.length;
  if (invalidCount > Math.max(25, Math.floor(rawOffers.length * 0.02))) {
    throw new Error(`priceai_invalid_offer_ratio:${invalidCount}_of_${rawOffers.length}`);
  }

  const grouped = new Map<string, { product: PriceAiProduct; offer: PriceAiOffer; count: number }>();
  for (const row of validRows) {
    const key = `${row.offer.sourceId}\u0000${row.offer.sourceTitle.trim()}`;
    const existing = grouped.get(key);
    grouped.set(key, existing
      ? { product: row.product, offer: preferredOffer(existing.offer, row.offer), count: existing.count + 1 }
      : { product: row.product, offer: row.offer, count: 1 });
  }

  const normalizedStatusCounts = new Map<string, number>();
  for (const { offer } of grouped.values()) {
    const status = normalizePriceAiStatus(offer.status, offer.effectiveStatus, offer.hidden);
    normalizedStatusCounts.set(status, (normalizedStatusCounts.get(status) || 0) + 1);
  }
  const totalDriftProducts = productOffers.filter(({ coverage }) => coverage.totalDrift > 0).length;
  const maxTotalDrift = Math.max(0, ...productOffers.map(({ coverage }) => coverage.totalDrift));

  if (dryRun) {
    await cleanCheckpointDirectory(checkpointDir);
    console.log(JSON.stringify({
      source: base,
      mode: 'dry-run',
      products: products.length,
      rawOffers: rawOffers.length,
      groupedOffers: grouped.size,
      excludedMixedProduct: explorer.products.length - products.length,
      invalidOffersSkipped: invalidCount,
      invalidOfferReasons: invalidReasons,
      normalizedStatusCounts: Object.fromEntries([...normalizedStatusCounts.entries()].sort()),
      totalDriftProducts,
      maxTotalDrift,
      databaseWrites: 0,
      validation: 'passed',
    }));
    return;
  }

  const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const platformNames = [...new Set(products.map((product) => product.platform.trim()).filter(Boolean))];
  const { data: platforms, error: platformError } = await supabase
    .from('product_platforms')
    .upsert(platformNames.map((name, index) => ({ name, is_active: true, sort_order: index + 20 })), { onConflict: 'name' })
    .select('id,name');
  if (platformError) throw platformError;
  const platformIds = new Map((platforms || []).map((row) => [row.name, row.id]));

  const catalogRows = products.map((product, index) => {
    const platformId = platformIds.get(product.platform);
    if (!platformId) throw new Error(`priceai_missing_platform:${product.platform}`);
    return {
      slug: product.slug,
      name: product.displayName,
      short_desc: product.summary || product.spec || '',
      search_keywords: [...new Set([product.platform, product.displayName, product.productType, product.spec, ...(product.aliases || [])].filter(Boolean))],
      is_active: true,
      platform_id: platformId,
      sort_order: catalogSortOrderForSourceIndex(index),
      is_catch_all: false,
      updated_at: product.updatedAt || explorer.generatedAt,
    };
  });
  const { data: catalog, error: catalogError } = await supabase
    .from('product_catalog')
    .upsert(catalogRows, { onConflict: 'slug' })
    .select('id,slug');
  if (catalogError) throw catalogError;
  const catalogIds = new Map((catalog || []).map((row) => [row.slug, row.id]));

  const sourceOffers = new Map<string, PriceAiOffer>();
  for (const { offer } of grouped.values()) {
    const existing = sourceOffers.get(offer.sourceId);
    if (!existing || (!existing.shopUrl && offer.shopUrl)) sourceOffers.set(offer.sourceId, offer);
  }
  const targetRows = [...sourceOffers.values()].map((offer) => {
    const sourceUrl = validHttpsUrl(offer.shopUrl) || validHttpsUrl(offer.url);
    if (!sourceUrl) throw new Error(`priceai_missing_source_url:${offer.sourceId}`);
    return {
      name: (offer.sourceStoreName || offer.sourceName || offer.sourceId).slice(0, 240),
      site_url: sourceUrl,
      scrape_url: `${base}/api/offers?source=${encodeURIComponent(offer.sourceId)}`,
      scraper_type: offer.collectorKind || 'priceai-public-api',
      is_active: true,
      is_verified: Boolean(offer.verifiedAt),
      operational_status: offer.freshnessStatus === 'fresh' ? 'healthy' : (offer.freshnessStatus || 'unknown'),
      last_valid_at: offer.verifiedAt || offer.lastSeenAt || offer.capturedAt,
      last_attempt_at: offer.lastSeenAt || offer.capturedAt,
      error_streak: 0,
      latest_error_msg: null,
      remarks: `Authorized PriceAI source ${offer.sourceId}`,
    };
  });
  const { data: targets, error: targetError } = await supabase
    .from('crawler_targets')
    .upsert(targetRows, { onConflict: 'scrape_url' })
    .select('id,scrape_url');
  if (targetError) throw targetError;
  const targetIds = new Map((targets || []).map((row) => [row.scrape_url, row.id]));

  const offerRowsWithContext = [...grouped.values()].map(({ product, offer, count }) => {
    const targetId = targetIds.get(`${base}/api/offers?source=${encodeURIComponent(offer.sourceId)}`);
    const catalogId = catalogIds.get(product.slug);
    if (!targetId) throw new Error(`priceai_missing_target:${offer.sourceId}`);
    if (!catalogId) throw new Error(`priceai_missing_catalog:${product.slug}`);
    const observedAt = offer.lastSeenAt || offer.capturedAt || explorer.generatedAt;
    const status = normalizePriceAiStatus(offer.status, offer.effectiveStatus, offer.hidden);
    return {
      target_id: targetId,
      canonical_product_id: catalogId,
      product_title: offer.sourceTitle.trim().slice(0, 1_000),
      price: offer.price,
      status,
      url: validHttpsUrl(offer.url) as string,
      tags: buildPriceAiTags(offer, count),
      inventory_level: offer.stockCount ?? null,
      scraped_at: observedAt,
      last_crawled_at: observedAt,
      updated_at: offer.sourceUpdatedAt || observedAt,
      is_manual_override: false,
      changeContext: {
        productSlug: product.slug,
        productName: product.displayName,
        merchantName: (offer.sourceStoreName || offer.sourceName || offer.sourceId).slice(0, 240),
        sourceUrl: validHttpsUrl(offer.url) as string,
      },
    };
  });
  const offerRows = offerRowsWithContext.map(({ changeContext, ...row }) => {
    if (!changeContext.sourceUrl) throw new Error('priceai_missing_change_source_url');
    return row;
  });

  const existingRows: {
    id: string;
    target_id: string;
    product_title: string;
    price: number | string | null;
    status: 'in_stock' | 'out_of_stock' | 'offline' | 'blacklisted';
    last_crawled_at: string;
  }[] = [];
  for (let offset = 0; ; offset += 1_000) {
    const { data, error } = await supabase
      .from('market_offers')
      .select('id,target_id,product_title,price,status,last_crawled_at')
      .contains('tags', ['source:priceai'])
      .range(offset, offset + 999);
    if (error) throw error;
    existingRows.push(...(data || []));
    if (!data || data.length < 1_000) break;
  }
  const existingByKey = new Map(existingRows.map((row) => [`${row.target_id}\u0000${row.product_title}`, row]));
  const rawChangeRows = offerRowsWithContext
    .map((row) => buildPriceAiChange(
      existingByKey.has(`${row.target_id}\u0000${row.product_title}`)
        ? {
            price: existingByKey.get(`${row.target_id}\u0000${row.product_title}`)!.price,
            status: existingByKey.get(`${row.target_id}\u0000${row.product_title}`)!.status,
            observedAt: existingByKey.get(`${row.target_id}\u0000${row.product_title}`)!.last_crawled_at,
          }
        : null,
      { price: row.price, status: row.status, observedAt: row.last_crawled_at },
      row.changeContext,
    ))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  const deduplicatedChanges = deduplicatePriceAiChanges(rawChangeRows);
  const changeRows = deduplicatedChanges.rows;

  await upsertBatches(supabase, 'market_offers', offerRows, 'target_id,product_title');
  await upsertBatches(
    supabase,
    'market_price_changes',
    changeRows.map((row) => ({ ...row })),
    'product_slug,merchant_name,source_url,observed_at',
  );

  const activeKeys = new Set(offerRows.map((row) => `${row.target_id}\u0000${row.product_title}`));
  const staleIds = existingRows
    .filter((row) => !activeKeys.has(`${row.target_id}\u0000${row.product_title}`))
    .map((row) => row.id);
  for (let index = 0; index < staleIds.length; index += WRITE_BATCH_SIZE) {
    const { error } = await supabase.from('market_offers').delete().in('id', staleIds.slice(index, index + WRITE_BATCH_SIZE));
    if (error) throw error;
  }

  const { count, error: countError } = await supabase
    .from('market_offers')
    .select('id', { count: 'exact', head: true })
    .contains('tags', ['source:priceai']);
  if (countError) throw countError;
  if (count !== offerRows.length) throw new Error(`priceai_validation_failed:expected_${offerRows.length}:received_${count || 0}`);

  await cleanCheckpointDirectory(checkpointDir);
  console.log(JSON.stringify({
    source: base,
    products: products.length,
    rawOffers: rawOffers.length,
    groupedOffers: offerRows.length,
    sources: targetRows.length,
    excludedMixedProduct: explorer.products.length - products.length,
    invalidOffersSkipped: invalidCount,
    invalidOfferReasons: invalidReasons,
    normalizedStatusCounts: Object.fromEntries([...normalizedStatusCounts.entries()].sort()),
    totalDriftProducts,
    maxTotalDrift,
    staleOffersRemoved: staleIds.length,
    priceChangesRecorded: changeRows.length,
    duplicatePriceChangesCollapsed: deduplicatedChanges.dropped,
    validation: 'passed',
  }));
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else if (error && typeof error === 'object') {
    const structured = error as { code?: unknown; message?: unknown };
    const code = typeof structured.code === 'string' ? structured.code.slice(0, 80) : 'unknown';
    const message = typeof structured.message === 'string' ? structured.message.slice(0, 1_000) : 'unknown';
    console.error(`priceai_import_failed:${code}:${message}`);
  } else {
    console.error('priceai_import_failed:unknown');
  }
  process.exitCode = 1;
});
