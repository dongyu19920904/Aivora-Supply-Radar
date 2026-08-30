import type { ProductType } from '../data';

export const catalogSortOptions = [
  { value: 'recommended', label: '推荐排序' },
  { value: 'channels', label: '渠道最多' },
  { value: 'price', label: '价格最低' },
  { value: 'updated', label: '最近更新' },
] as const;

export const catalogAvailabilityOptions = [
  { value: 'all', label: '全部' },
  { value: 'available', label: '有在售' },
  { value: 'unavailable', label: '暂无在售' },
] as const;

export type CatalogSortMode = (typeof catalogSortOptions)[number]['value'];
export type CatalogAvailability = (typeof catalogAvailabilityOptions)[number]['value'];

const CORE_AI_PRODUCT = /(?:chatgpt|claude|gemini|google ai|grok|cursor|perplexity|suno|kiro|windsurf|minimax|dreamina|即梦)/i;
const AUXILIARY_PRODUCT = /(?:接码|邮箱|验证|周边|自助服务|apple id|telegram|推特|\bx\s*\/|虚拟卡|礼品卡)/i;

export function isCatalogSortMode(value: string): value is CatalogSortMode {
  return catalogSortOptions.some((option) => option.value === value);
}

export function isCatalogAvailability(value: string): value is CatalogAvailability {
  return catalogAvailabilityOptions.some((option) => option.value === value);
}

export function hasActiveCatalogOffer(product: ProductType): boolean {
  return product.channelCount > 0;
}

export function isCoreAiProduct(product: ProductType): boolean {
  const identity = `${product.platform} ${product.name}`;
  return CORE_AI_PRODUCT.test(identity) && !AUXILIARY_PRODUCT.test(identity);
}

function timestamp(product: ProductType): number {
  if (!product.updatedAt) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(product.updatedAt);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function compareBooleanDesc(a: boolean, b: boolean): number {
  return Number(b) - Number(a);
}

function stableCatalogFallback(a: ProductType, b: ProductType): number {
  const platformOrder = (a.platform_sort_order ?? 9_999) - (b.platform_sort_order ?? 9_999);
  if (platformOrder !== 0) return platformOrder;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  const platformName = a.platform.localeCompare(b.platform, 'zh-CN');
  if (platformName !== 0) return platformName;
  const productName = a.name.localeCompare(b.name, 'zh-CN');
  if (productName !== 0) return productName;
  return a.slug.localeCompare(b.slug);
}

function compareRecommended(a: ProductType, b: ProductType): number {
  const availability = compareBooleanDesc(hasActiveCatalogOffer(a), hasActiveCatalogOffer(b));
  if (availability !== 0) return availability;

  const coreProduct = compareBooleanDesc(isCoreAiProduct(a), isCoreAiProduct(b));
  if (coreProduct !== 0) return coreProduct;

  if (a.channelCount !== b.channelCount) return b.channelCount - a.channelCount;

  const freshness = timestamp(b) - timestamp(a);
  if (freshness !== 0) return freshness;

  const priced = compareBooleanDesc(a.lowestPrice !== null, b.lowestPrice !== null);
  if (priced !== 0) return priced;
  if (a.lowestPrice !== null && b.lowestPrice !== null && a.lowestPrice !== b.lowestPrice) {
    return a.lowestPrice - b.lowestPrice;
  }
  return stableCatalogFallback(a, b);
}

function compareChannels(a: ProductType, b: ProductType): number {
  const availability = compareBooleanDesc(hasActiveCatalogOffer(a), hasActiveCatalogOffer(b));
  if (availability !== 0) return availability;
  if (a.channelCount !== b.channelCount) return b.channelCount - a.channelCount;
  const freshness = timestamp(b) - timestamp(a);
  return freshness || stableCatalogFallback(a, b);
}

function comparePrice(a: ProductType, b: ProductType): number {
  const priced = compareBooleanDesc(a.lowestPrice !== null, b.lowestPrice !== null);
  if (priced !== 0) return priced;
  if (a.lowestPrice !== null && b.lowestPrice !== null && a.lowestPrice !== b.lowestPrice) {
    return a.lowestPrice - b.lowestPrice;
  }
  if (a.channelCount !== b.channelCount) return b.channelCount - a.channelCount;
  return stableCatalogFallback(a, b);
}

function compareUpdated(a: ProductType, b: ProductType): number {
  const freshness = timestamp(b) - timestamp(a);
  if (freshness !== 0) return freshness;
  if (a.channelCount !== b.channelCount) return b.channelCount - a.channelCount;
  return stableCatalogFallback(a, b);
}

export function sortCatalogProducts(
  products: readonly ProductType[],
  mode: CatalogSortMode,
): ProductType[] {
  const comparator = mode === 'channels'
    ? compareChannels
    : mode === 'price'
      ? comparePrice
      : mode === 'updated'
        ? compareUpdated
        : compareRecommended;
  return [...products].sort(comparator);
}

export function filterCatalogAvailability(
  products: readonly ProductType[],
  availability: CatalogAvailability,
): ProductType[] {
  if (availability === 'available') return products.filter(hasActiveCatalogOffer);
  if (availability === 'unavailable') return products.filter((product) => !hasActiveCatalogOffer(product));
  return [...products];
}
