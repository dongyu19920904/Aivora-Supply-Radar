import type { ProductType } from '../data';
import {
  catalogCategories,
  classifyCatalogProduct,
  getCatalogCategory,
  groupCatalogProducts,
  type CatalogCategoryId,
} from './catalog-taxonomy';
import type { AccountOpportunity, PriceChange } from './legacy-radar';
import { absoluteUrl } from './site';

export type SupplySignalKind = 'restock' | 'stockout' | 'price_drop' | 'price_rise' | 'supply_gap' | 'crowded';
export type SupplySignalTone = 'opportunity' | 'warning' | 'watch';

export interface SupplyOpportunitySignal {
  id: string;
  kind: SupplySignalKind;
  tone: SupplySignalTone;
  label: string;
  title: string;
  summary: string;
  evidence: string;
  buyerAction: string;
  sellerAction: string;
  stopCondition: string;
  product: ProductType;
  observedAt: string | null;
  sourceUrl: string | null;
  priority: number;
}

export interface SupplyCategorySnapshot {
  id: CatalogCategoryId;
  name: string;
  description: string;
  productCount: number;
  availableProductCount: number;
  availableOfferCount: number;
  lowestPrice: number | null;
}

export interface SupplyOpportunityDashboard {
  generatedAt: string;
  latestObservedAt: string | null;
  stats: {
    productCount: number;
    availableProductCount: number;
    availableOfferCount: number;
    recentChangeCount: number;
    lowSupplyProductCount: number;
  };
  signals: SupplyOpportunitySignal[];
  categories: SupplyCategorySnapshot[];
}

export interface PublicSupplyOpportunitySnapshot {
  schemaVersion: 1;
  source: string;
  generatedAt: string;
  latestObservedAt: string | null;
  stats: SupplyOpportunityDashboard['stats'] & {
    recentChangeCountCapped: boolean;
  };
  signals: Array<{
    id: string;
    kind: SupplySignalKind;
    tone: SupplySignalTone;
    label: string;
    title: string;
    evidence: string;
    buyerAction: string;
    sellerAction: string;
    stopCondition: string;
    observedAt: string | null;
    sourceUrl: string | null;
    product: {
      slug: string;
      name: string;
      platform: string;
      lowestPrice: number | null;
      warrantyPrice: number | null;
      availableOfferCount: number;
      updatedAt: string | null;
      sortOrder: number;
      platformSortOrder: number;
      productUrl: string;
      profitCalculatorUrl: string;
    };
  }>;
  categories: SupplyCategorySnapshot[];
}

const CATEGORY_RANK = new Map(catalogCategories.map((category, index) => [category.id, index]));
const MAX_SIGNALS = 6;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1_000;
const SIGNIFICANT_PRICE_CHANGE = 0.08;

function price(value: number | null): string {
  return value === null ? '暂无可购买报价' : `¥${value.toFixed(2)}`;
}

function validTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stockState(value: string | null): 'available' | 'unavailable' | 'unknown' {
  const normalized = (value || '').trim().toLowerCase();
  if (/^(?:in_stock|low_stock|available)$/.test(normalized) || /(?:有货|可购买)/.test(normalized)) return 'available';
  if (/^(?:out_of_stock|offline|unavailable)$/.test(normalized) || /(?:缺货|下架|不可购买)/.test(normalized)) return 'unavailable';
  return 'unknown';
}

function priceChangeRatio(change: PriceChange): number | null {
  if (change.previous_price === null || change.current_price === null || change.previous_price <= 0) return null;
  return (change.current_price - change.previous_price) / change.previous_price;
}

function detectChangeKind(change: PriceChange): SupplySignalKind | null {
  const before = stockState(change.previous_stock);
  const after = stockState(change.current_stock);
  if (before === 'unavailable' && after === 'available') return 'restock';
  if (before === 'available' && after === 'unavailable') return 'stockout';
  const ratio = priceChangeRatio(change);
  if (ratio !== null && ratio <= -SIGNIFICANT_PRICE_CHANGE) return 'price_drop';
  if (ratio !== null && ratio >= SIGNIFICANT_PRICE_CHANGE) return 'price_rise';
  return null;
}

function calculatorHref(product: ProductType): string {
  const params = new URLSearchParams({ product: product.name });
  if (product.lowestPrice !== null) params.set('cost', product.lowestPrice.toFixed(2));
  return `/profit-calculator?${params.toString()}`;
}

export function getProfitCalculatorHref(product: ProductType): string {
  return calculatorHref(product);
}

export function buildPublicSupplyOpportunitySnapshot(
  dashboard: SupplyOpportunityDashboard,
): PublicSupplyOpportunitySnapshot {
  return {
    schemaVersion: 1,
    source: absoluteUrl('/opportunities'),
    generatedAt: dashboard.generatedAt,
    latestObservedAt: dashboard.latestObservedAt,
    stats: {
      ...dashboard.stats,
      // listPriceChanges is deliberately bounded to the newest 100 records.
      recentChangeCountCapped: dashboard.stats.recentChangeCount >= 100,
    },
    signals: dashboard.signals.slice(0, MAX_SIGNALS).map((signal) => ({
      id: signal.id,
      kind: signal.kind,
      tone: signal.tone,
      label: signal.label,
      title: signal.title,
      evidence: signal.evidence,
      buyerAction: signal.buyerAction,
      sellerAction: signal.sellerAction,
      stopCondition: signal.stopCondition,
      observedAt: signal.observedAt,
      sourceUrl: signal.sourceUrl,
      product: {
        slug: signal.product.slug,
        name: signal.product.name,
        platform: signal.product.platform,
        lowestPrice: signal.product.lowestPrice,
        warrantyPrice: signal.product.warrantyPrice,
        availableOfferCount: signal.product.channelCount,
        updatedAt: signal.product.updatedAt,
        sortOrder: signal.product.sort_order,
        platformSortOrder: signal.product.platform_sort_order || 0,
        productUrl: absoluteUrl(`/card-products/${signal.product.slug}`),
        profitCalculatorUrl: absoluteUrl(calculatorHref(signal.product)),
      },
    })),
    categories: dashboard.categories,
  };
}

function changeSignal(change: PriceChange, product: ProductType, kind: SupplySignalKind): SupplyOpportunitySignal {
  const ratio = priceChangeRatio(change);
  const percentage = ratio === null ? null : Math.abs(ratio * 100).toFixed(1);
  const shared = {
    id: `${kind}:${product.slug}:${change.merchant_name}:${change.observed_at}`,
    product,
    observedAt: change.observed_at,
    sourceUrl: change.source_url,
  };

  if (kind === 'restock') {
    return {
      ...shared,
      kind,
      tone: 'opportunity',
      label: '补货恢复',
      title: `${product.name} 出现可购买货源`,
      summary: `${change.merchant_name} 的连续快照从不可购买变为可购买，可以重新核验交付和售后。`,
      evidence: `库存状态：${change.previous_stock || '未知'} → ${change.current_stock || '未知'}；当前目录最低价 ${price(product.lowestPrice)}，可购买报价 ${product.channelCount} 条。`,
      buyerAction: '先打开商品详情比较同类报价，再进入原始页面确认库存没有再次变化。',
      sellerAction: `核验该渠道的交付与质保，将 ${price(product.lowestPrice)} 作为进货参考带入利润计算器。`,
      stopCondition: '原始页仍显示缺货、交付信息不完整，或计入退款和售后后没有利润时停止。',
      priority: 120,
    };
  }
  if (kind === 'stockout') {
    return {
      ...shared,
      kind,
      tone: 'warning',
      label: '断货风险',
      title: `${product.name} 有渠道转为缺货`,
      summary: `${change.merchant_name} 的连续快照从可购买变为不可购买，不能继续按旧库存接单。`,
      evidence: `库存状态：${change.previous_stock || '未知'} → ${change.current_stock || '未知'}；目录仍有 ${product.channelCount} 条可购买报价。`,
      buyerAction: '避开已经缺货的原始链接，改看商品详情中仍显示可购买且更新时间更近的渠道。',
      sellerAction: '立即核对自己的同源库存和待交付订单；有替代渠道时重新计算成本，没有时暂停销售。',
      stopCondition: '找不到可验证的替代货源，或替代成本超过当前售价时立即下架。',
      priority: 115,
    };
  }
  if (kind === 'price_drop') {
    return {
      ...shared,
      kind,
      tone: 'opportunity',
      label: '价格下降',
      title: `${product.name} 出现 ${percentage}% 降价`,
      summary: `${change.merchant_name} 的有效快照价格下降，可能形成新的采购窗口，但不代表质量相同。`,
      evidence: `${price(change.previous_price)} → ${price(change.current_price)}；当前目录最低价 ${price(product.lowestPrice)}，可购买报价 ${product.channelCount} 条。`,
      buyerAction: '比较降价渠道与同类质保价，确认商品规格、交付方式和售后没有一起缩水。',
      sellerAction: `先用 ${price(change.current_price)} 测算真实成本，再决定是否调整售价或小量测试。`,
      stopCondition: '规格不同、来源过旧、质保缺失，或降价后仍无法覆盖退款和售后成本时停止。',
      priority: 110,
    };
  }
  return {
    ...shared,
    kind: 'price_rise',
    tone: 'watch',
    label: '价格上涨',
    title: `${product.name} 出现 ${percentage}% 涨价`,
    summary: `${change.merchant_name} 的有效快照价格上涨，可能是成本或库存收紧信号，不能继续使用旧成本报价。`,
    evidence: `${price(change.previous_price)} → ${price(change.current_price)}；当前目录最低价 ${price(product.lowestPrice)}，可购买报价 ${product.channelCount} 条。`,
    buyerAction: '先比较其他可购买渠道，避免把单一渠道涨价误判为全市场涨价。',
    sellerAction: '更新进货成本和保本价；如果利润被压缩，优先调整售价或减少承诺，而不是继续低价接单。',
    stopCondition: '只有单一异常报价上涨、其他渠道没有同步变化时，不据此囤货或涨价。',
    priority: 100,
  };
}

function isSellerFocusProduct(product: ProductType): boolean {
  const rank = CATEGORY_RANK.get(classifyCatalogProduct(product)) ?? 99;
  return rank <= 5 && product.channelCount <= 5;
}

function supplyGapSignal(product: ProductType): SupplyOpportunitySignal {
  const hasOffers = product.channelCount > 0;
  return {
    id: `supply_gap:${product.slug}`,
    kind: 'supply_gap',
    tone: 'watch',
    label: hasOffers ? '低供给观察' : '等待补货',
    title: `${product.name} 当前可购买渠道较少`,
    summary: hasOffers
      ? `当前只有 ${product.channelCount} 条可购买报价，竞争表面较少，但还没有真实销量证据。`
      : '当前没有可购买报价；这可能是供给空档，也可能是需求不足，必须先验证。',
    evidence: `当前目录最低价 ${price(product.lowestPrice)}；可购买报价 ${product.channelCount} 条；最近更新 ${product.updatedAt || '待首次采集'}。`,
    buyerAction: '不要因为选择少就直接下单；逐条核验现有渠道，必要时等待补货。',
    sellerAction: `${hasOffers ? '先小量测试买家询问与交付稳定性' : '先验证是否有真实买家询问'}，再决定是否寻找新货源。`,
    stopCondition: '没有真实询问、没有稳定交付，或只能依赖不可验证来源时停止。',
    product,
    observedAt: product.updatedAt,
    sourceUrl: null,
    priority: 80 - product.channelCount,
  };
}

function crowdedSignal(product: ProductType): SupplyOpportunitySignal {
  return {
    id: `crowded:${product.slug}`,
    kind: 'crowded',
    tone: 'warning',
    label: '竞争拥挤',
    title: `${product.name} 可购买报价已经很密集`,
    summary: `当前有 ${product.channelCount} 条可购买报价，说明容易比价，也意味着卖家不能只靠低价进入。`,
    evidence: `当前目录最低价 ${price(product.lowestPrice)}；可购买报价 ${product.channelCount} 条；最近更新 ${product.updatedAt || '待首次采集'}。`,
    buyerAction: '利用充足报价比较质保、交付和更新时间，不只选择最低价。',
    sellerAction: '优先做明确交付、售后和场景说明；计算差异化成本后再决定是否进入。',
    stopCondition: '只能通过低于保本价竞争，或无法提供比现有渠道更清楚的交付与售后时停止。',
    product,
    observedAt: product.updatedAt,
    sourceUrl: null,
    priority: 60 + Math.min(product.channelCount / 100, 10),
  };
}

function newestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values
    .map((value) => ({ value, time: validTime(value) }))
    .filter((item): item is { value: string; time: number } => item.value !== null && item.value !== undefined && item.time !== null)
    .sort((a, b) => b.time - a.time);
  return valid[0]?.value || null;
}

export function buildSupplyOpportunityDashboard(
  products: readonly ProductType[],
  changes: readonly PriceChange[],
  now = new Date(),
): SupplyOpportunityDashboard {
  const cutoff = now.getTime() - RECENT_WINDOW_MS;
  const recentChanges = [...changes]
    .filter((change) => {
      const time = validTime(change.observed_at);
      return time !== null && time >= cutoff && time <= now.getTime() + 5 * 60_000;
    })
    .sort((a, b) => (validTime(b.observed_at) || 0) - (validTime(a.observed_at) || 0));
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const dedupedChanges = new Map<string, PriceChange>();
  for (const change of recentChanges) {
    const key = `${change.product_slug}\u0000${change.merchant_name}\u0000${change.source_url}`;
    if (!dedupedChanges.has(key)) dedupedChanges.set(key, change);
  }

  const candidates: SupplyOpportunitySignal[] = [];
  for (const change of dedupedChanges.values()) {
    const product = productsBySlug.get(change.product_slug);
    const kind = detectChangeKind(change);
    if (product && kind) candidates.push(changeSignal(change, product, kind));
  }
  for (const product of products.filter(isSellerFocusProduct)) candidates.push(supplyGapSignal(product));
  for (const product of products.filter((item) => item.channelCount >= 100)) candidates.push(crowdedSignal(product));

  const seenNames = new Set<string>();
  const signals = candidates
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      const categoryRank = (CATEGORY_RANK.get(classifyCatalogProduct(a.product)) || 0)
        - (CATEGORY_RANK.get(classifyCatalogProduct(b.product)) || 0);
      if (categoryRank !== 0) return categoryRank;
      return b.product.channelCount - a.product.channelCount;
    })
    .filter((signal) => {
      const key = signal.product.name.trim().toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    })
    .slice(0, MAX_SIGNALS);

  const categories = groupCatalogProducts(products).map((group): SupplyCategorySnapshot => {
    const prices = group.products
      .map((product) => product.lowestPrice)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    return {
      id: group.category.id,
      name: group.category.name,
      description: group.category.description,
      productCount: group.products.length,
      availableProductCount: group.products.filter((product) => product.channelCount > 0).length,
      availableOfferCount: group.products.reduce((total, product) => total + product.channelCount, 0),
      lowestPrice: prices.length ? Math.min(...prices) : null,
    };
  });

  return {
    generatedAt: now.toISOString(),
    latestObservedAt: newestTimestamp([
      ...products.map((product) => product.updatedAt),
      ...recentChanges.map((change) => change.observed_at),
    ]),
    stats: {
      productCount: products.length,
      availableProductCount: products.filter((product) => product.channelCount > 0).length,
      availableOfferCount: products.reduce((total, product) => total + product.channelCount, 0),
      recentChangeCount: recentChanges.length,
      lowSupplyProductCount: products.filter(isSellerFocusProduct).length,
    },
    signals,
    categories,
  };
}

const CATEGORY_TERMS: Record<CatalogCategoryId, string[]> = {
  chatgpt: ['chatgpt', 'openai', 'codex'],
  claude: ['claude', 'anthropic'],
  gemini: ['gemini', 'google ai'],
  grok: ['grok', 'xai'],
  'ai-coding': ['cursor', 'kiro', 'windsurf', 'coding plan'],
  'ai-creative': ['perplexity', 'suno', 'dreamina', '即梦', 'seedance'],
  email: ['gmail', 'outlook', 'hotmail', 'icloud', '邮箱'],
  verification: ['接码', 'kyc', '真人验证'],
  social: ['telegram', 'twitter', '推特', 'apple id', '苹果账号'],
  'api-payment': ['api', '虚拟卡', '礼品卡'],
  other: [],
};

function termOccurrences(text: string, term: string): number {
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(term, offset)) !== -1) {
    count += 1;
    offset += term.length;
  }
  return count;
}

export function findRelatedCatalogProducts(
  opportunity: Pick<AccountOpportunity, 'title' | 'description' | 'body_markdown'>,
  products: readonly ProductType[],
  limit = 6,
): ProductType[] {
  const text = `${opportunity.title} ${opportunity.description} ${opportunity.body_markdown}`.toLowerCase();
  const categoryScores = catalogCategories
    .map((category) => ({
      id: category.id,
      score: CATEGORY_TERMS[category.id].reduce((total, term) => total + termOccurrences(text, term), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const maxScore = categoryScores[0]?.score || 0;
  if (!maxScore) return [];
  const relatedCategoryIds = new Set(
    categoryScores
      .filter((item, index) => index < 2 && item.score >= Math.max(2, Math.ceil(maxScore * 0.6)))
      .map((item) => item.id),
  );
  if (!relatedCategoryIds.size) relatedCategoryIds.add(categoryScores[0].id);

  return products
    .filter((product) => relatedCategoryIds.has(classifyCatalogProduct(product)))
    .sort((a, b) => {
      if ((a.channelCount > 0) !== (b.channelCount > 0)) return Number(b.channelCount > 0) - Number(a.channelCount > 0);
      if (a.channelCount !== b.channelCount) return b.channelCount - a.channelCount;
      return a.name.localeCompare(b.name, 'zh-CN');
    })
    .slice(0, Math.max(0, limit));
}

export function supplySignalCategory(signal: SupplyOpportunitySignal): string {
  return getCatalogCategory(classifyCatalogProduct(signal.product)).name;
}
