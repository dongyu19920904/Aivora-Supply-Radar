import type { ProductType } from '../data';

export const catalogCategories = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'ChatGPT、OpenAI 账号、订阅与相关自助服务',
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Claude Pro、Max、Team 与基础账号',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Gemini、Google AI Pro 与 Ultra',
  },
  {
    id: 'grok',
    name: 'Grok',
    description: 'Grok、SuperGrok 与 Heavy 订阅',
  },
  {
    id: 'ai-coding',
    name: 'AI 编程',
    description: 'Cursor、Kiro、Windsurf 与编程套餐',
  },
  {
    id: 'ai-creative',
    name: 'AI 创作与效率',
    description: 'AI 搜索、音频、图像与视频创作工具',
  },
  {
    id: 'email',
    name: '邮箱',
    description: 'Gmail、Outlook、iCloud 与教育邮箱',
  },
  {
    id: 'verification',
    name: '接码与验证',
    description: '短信接码、KYC 与真人验证服务',
  },
  {
    id: 'social',
    name: '社媒与账号',
    description: 'X、Telegram、Apple ID 等海外账号',
  },
  {
    id: 'api-payment',
    name: 'API 与支付',
    description: 'API 额度、中转、虚拟卡与礼品卡',
  },
  {
    id: 'other',
    name: '其他',
    description: '暂未归入以上分类的完整目录商品',
  },
] as const;

export type CatalogCategory = (typeof catalogCategories)[number];
export type CatalogCategoryId = CatalogCategory['id'];

const categoryById = new Map<CatalogCategoryId, CatalogCategory>(
  catalogCategories.map((category) => [category.id, category]),
);

function identity(product: Pick<ProductType, 'name' | 'platform' | 'shortDesc' | 'searchKeywords'>): string {
  return [product.name, product.platform, product.shortDesc || '', ...(product.searchKeywords || [])]
    .join(' ')
    .toLowerCase();
}

export function classifyCatalogProduct(
  product: Pick<ProductType, 'name' | 'platform' | 'shortDesc' | 'searchKeywords'>,
): CatalogCategoryId {
  const value = identity(product);
  const platform = product.platform.trim().toLowerCase();

  if (/(?:邮箱|gmail|outlook|hotmail|icloud|email|edu\b)/i.test(value) || platform === '邮箱') {
    return 'email';
  }
  if (/(?:接码|kyc|真人验证|短信验证|手机号验证)/i.test(value) || platform === '验证' || platform === '接码') {
    return 'verification';
  }
  if (/(?:telegram|推特|twitter|apple id|苹果账号|\bx\s*\/|\/\s*x\b)/i.test(value) || platform === '社媒与账号') {
    return 'social';
  }
  if (/(?:cursor|kiro|windsurf|minimax\s+coding|coding\s+plan)/i.test(value) || platform === '编程工具') {
    return 'ai-coding';
  }
  if (/(?:\bapi\b|api\s*中转|api\s*额度|虚拟卡|礼品卡)/i.test(value) || platform === 'api') {
    return 'api-payment';
  }
  if (/(?:chatgpt|openai|codex)/i.test(value) || platform === 'chatgpt') return 'chatgpt';
  if (/(?:claude|anthropic)/i.test(value) || platform === 'claude') return 'claude';
  if (/(?:gemini|google\s+ai)/i.test(value) || platform === 'gemini') return 'gemini';
  if (/(?:supergrok|\bgrok\b|xai)/i.test(value) || platform === 'grok') return 'grok';
  if (/(?:perplexity|suno|dreamina|即梦|seedance)/i.test(value)) return 'ai-creative';

  return 'other';
}

export function getCatalogCategory(id: CatalogCategoryId): CatalogCategory {
  return categoryById.get(id) || categoryById.get('other') as CatalogCategory;
}

export interface CatalogProductGroup {
  category: CatalogCategory;
  products: ProductType[];
}

export function groupCatalogProducts(products: readonly ProductType[]): CatalogProductGroup[] {
  const grouped = new Map<CatalogCategoryId, ProductType[]>();
  for (const category of catalogCategories) grouped.set(category.id, []);
  for (const product of products) {
    grouped.get(classifyCatalogProduct(product))?.push(product);
  }
  return catalogCategories
    .map((category) => ({ category, products: grouped.get(category.id) || [] }))
    .filter((group) => group.products.length > 0);
}

export function getCatalogCategoryOptions(products: readonly ProductType[]) {
  return groupCatalogProducts(products).map((group) => ({
    value: group.category.id,
    label: group.category.name,
    count: group.products.length,
  }));
}

export function isCatalogCategoryId(value: string): value is CatalogCategoryId {
  return categoryById.has(value as CatalogCategoryId);
}
