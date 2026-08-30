import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PAGE_SIZE = 1_000;

interface OfferRow {
  id: string;
  target_id: string | null;
  canonical_product_id: string | null;
  product_title: string;
  price: number | null;
  status: string;
  url: string;
  tags: string[] | null;
  inventory_level: number | null;
  updated_at: string;
  last_crawled_at: string | null;
}

interface CatalogRow {
  id: string;
  slug: string;
  name: string;
}

interface TargetRow {
  id: string;
  name: string;
}

interface SummaryRow {
  id: string;
  slug: string;
  channel_count: number | string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_environment:${name}`);
  return value;
}

async function fetchAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(columns).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function exactCount(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function main() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const admin = createClient(supabaseUrl, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(supabaseUrl, requiredEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [platformCount, catalog, targets, offers, publicSummary] = await Promise.all([
    exactCount(admin, 'product_platforms'),
    fetchAll<CatalogRow>(admin, 'product_catalog', 'id,slug,name'),
    fetchAll<TargetRow>(admin, 'crawler_targets', 'id,name'),
    fetchAll<OfferRow>(admin, 'market_offers', 'id,target_id,canonical_product_id,product_title,price,status,url,tags,inventory_level,updated_at,last_crawled_at'),
    publicClient.rpc('get_product_catalog_summary'),
  ]);
  if (publicSummary.error) throw publicSummary.error;

  const catalogById = new Map(catalog.map((row) => [row.id, row]));
  const targetById = new Map(targets.map((row) => [row.id, row]));
  const offerCountsByProduct = new Map<string, number>();
  const offerCountsByTarget = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const sourceCounts = { priceai: 0, legacyV1: 0, other: 0 };
  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  let invalidHttpsUrls = 0;
  let missingCatalog = 0;
  let missingTarget = 0;
  let inStockWithZeroInventory = 0;
  let outOfStockWithPositiveInventory = 0;
  let inStockWithNonPositivePrice = 0;
  let newestCrawledAt = '';
  let oldestCrawledAt = '';
  const productsWithAvailableOffers = new Set<string>();

  for (const offer of offers) {
    const source = offer.tags?.includes('source:priceai')
      ? 'priceai'
      : offer.tags?.includes('source:legacy-v1') ? 'legacyV1' : 'other';
    sourceCounts[source] += 1;
    if (!offer.url.startsWith('https://')) invalidHttpsUrls += 1;
    if (!offer.canonical_product_id || !catalogById.has(offer.canonical_product_id)) missingCatalog += 1;
    if (!offer.target_id || !targetById.has(offer.target_id)) missingTarget += 1;
    if (offer.status === 'in_stock') {
      if (offer.inventory_level === 0) inStockWithZeroInventory += 1;
      if (!(Number(offer.price) > 0)) inStockWithNonPositivePrice += 1;
      if (offer.canonical_product_id) productsWithAvailableOffers.add(offer.canonical_product_id);
    }
    if (offer.status === 'out_of_stock' && Number(offer.inventory_level) > 0) {
      outOfStockWithPositiveInventory += 1;
    }
    const crawledAt = offer.last_crawled_at || offer.updated_at;
    if (crawledAt && (!newestCrawledAt || crawledAt > newestCrawledAt)) newestCrawledAt = crawledAt;
    if (crawledAt && (!oldestCrawledAt || crawledAt < oldestCrawledAt)) oldestCrawledAt = crawledAt;
    if (offer.canonical_product_id) {
      offerCountsByProduct.set(offer.canonical_product_id, (offerCountsByProduct.get(offer.canonical_product_id) || 0) + 1);
    }
    if (offer.target_id) offerCountsByTarget.set(offer.target_id, (offerCountsByTarget.get(offer.target_id) || 0) + 1);
    statusCounts.set(offer.status, (statusCounts.get(offer.status) || 0) + 1);
    const duplicateKey = `${offer.target_id || ''}\u0000${offer.product_title}`;
    if (seenKeys.has(duplicateKey)) duplicateKeys.add(duplicateKey);
    seenKeys.add(duplicateKey);
  }

  const largestProduct = [...offerCountsByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, slug: catalogById.get(id)?.slug || 'unknown', count }))[0] || null;
  const largestTarget = [...offerCountsByTarget.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, name: targetById.get(id)?.name || 'unknown', count }))[0] || null;
  const summaryRows = (publicSummary.data || []) as SummaryRow[];
  const chatGptPlus = catalog.find((row) => row.slug === 'chatgpt-plus');
  const chatGptPlusOffers = chatGptPlus
    ? offers.filter((offer) => offer.canonical_product_id === chatGptPlus.id && offer.status !== 'blacklisted')
    : [];

  const audit = {
    platformCount,
    catalogCount: catalog.length,
    targetCount: targets.length,
    offerCount: offers.length,
    productsWithOffers: offerCountsByProduct.size,
    sourceCounts,
    statusCounts: Object.fromEntries([...statusCounts.entries()].sort()),
    largestProduct,
    largestTarget,
    publicSummaryRows: summaryRows.length,
    publicSummaryMaxChannelCount: Math.max(0, ...summaryRows.map((row) => Number(row.channel_count || 0))),
    productsWithAvailableOffers: productsWithAvailableOffers.size,
    productsWithoutAvailableOffers: catalog.length - productsWithAvailableOffers.size,
    inStockWithZeroInventory,
    outOfStockWithPositiveInventory,
    inStockWithNonPositivePrice,
    newestCrawledAt,
    oldestCrawledAt,
    chatGptPlus: {
      total: chatGptPlusOffers.length,
      inStock: chatGptPlusOffers.filter((offer) => offer.status === 'in_stock').length,
      outOfStock: chatGptPlusOffers.filter((offer) => offer.status === 'out_of_stock').length,
      offline: chatGptPlusOffers.filter((offer) => offer.status === 'offline').length,
      inStockWithZeroInventory: chatGptPlusOffers.filter(
        (offer) => offer.status === 'in_stock' && offer.inventory_level === 0,
      ).length,
    },
    invalidHttpsUrls,
    missingCatalog,
    missingTarget,
    duplicateTargetTitles: duplicateKeys.size,
    validation: 'passed',
  };

  if (sourceCounts.priceai < 5_000) throw new Error(`audit_priceai_count_too_small:${sourceCounts.priceai}`);
  if (invalidHttpsUrls || missingCatalog || missingTarget || duplicateKeys.size) {
    throw new Error(`audit_integrity_failed:${JSON.stringify(audit)}`);
  }
  if (summaryRows.length !== catalog.length) throw new Error('audit_public_summary_catalog_mismatch');
  console.log(JSON.stringify(audit));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'snapshot_audit_failed');
  process.exitCode = 1;
});
