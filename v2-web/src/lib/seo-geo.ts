import type { ProductType } from '../data';
import { STORE_URL } from './site';
import {
  classifyCatalogProduct,
  type CatalogCategoryId,
} from './catalog-taxonomy';

export const STORE_ORGANIZATION_ID = 'https://www.aivora.cn/#organization';

export const VERIFIED_RETAIL_PRODUCT_URLS = {
  'chatgpt-go': 'https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka',
  'chatgpt-plus': 'https://www.aivora.cn/products/cheng-pin-hao-yue-ka',
  'chatgpt-plus-recharge': 'https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-1',
  'chatgpt-pro-5x': 'https://www.aivora.cn/products/xu-fei-chong-zhi-yue-ka-dao',
  'chatgpt-pro-20x': 'https://www.aivora.cn/products/chatgpt-pro-20x-renewal-monthly',
  'openai-phone-verification': 'https://www.aivora.cn/products/mei-guo-shi-ti-ka-jie-ma-yan-zheng-zhang-xiao',
  'cursor-account': 'https://www.aivora.cn/products/du-xiang-hao-yue-ka',
  'ai-api-relay': 'https://www.aivora.cn/products/claude-gemini-codex-relay-credit-packages',
  'minimax-coding-plan': 'https://www.aivora.cn/products/minimax-m3-coding-plan-packages',
  'gemini-pro-year': 'https://www.aivora.cn/products/nian-ka-zhi-bao-yi-yue',
  'gemini-pro-recharge': 'https://www.aivora.cn/products/gemini-pro-year-renewal',
  'claude-account': 'https://www.aivora.cn/products/pu-tong-zhang-hao-kai-hui-yuan-zhuan-yong',
  'claude-pro-month': 'https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-2',
  'claude-max-20x': 'https://www.aivora.cn/products/claude-max-20x-renewal-monthly',
  'grok-super': 'https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-3',
} as const satisfies Readonly<Record<string, string>>;

export interface SellerPlatformTopic {
  slug: string;
  categoryId: CatalogCategoryId;
  name: string;
  title: string;
  description: string;
  answer: string;
  checkpoints: readonly {
    title: string;
    description: string;
  }[];
  retailProductSlug: keyof typeof VERIFIED_RETAIL_PRODUCT_URLS;
}

export const sellerPlatformTopics = [
  {
    slug: 'chatgpt',
    categoryId: 'chatgpt',
    name: 'ChatGPT',
    title: 'ChatGPT 账号货源与订阅核价',
    description: '为 AI 账号卖家整理 ChatGPT Plus、Pro、Team、Go、普通账号和相关服务的当前可采购货源、报价数量、库存与更新时间。',
    answer: 'ChatGPT 货源要先按 Plus 试用、充值续费、Pro、Team、Go 和普通账号分开核价。相同品牌下的交付形态、有效期和售后差别很大，卖家应当先选标准商品，再打开原始报价确认库存和交付。',
    checkpoints: [
      { title: '先分清商品规格', description: '试用号、充值续费、Pro 和 Team 不能共用一个最低价。' },
      { title: '再看可采购报价', description: '缺货、下架和久未更新的报价不应进入接单成本。' },
      { title: '最后核对售后', description: '确认账号归属、质保期限、失效处理和退款边界。' },
    ],
    retailProductSlug: 'chatgpt-plus-recharge',
  },
  {
    slug: 'claude',
    categoryId: 'claude',
    name: 'Claude',
    title: 'Claude 账号货源与订阅核价',
    description: '为 AI 账号卖家整理 Claude Pro、Max、Team 和基础账号的当前可采购货源、公开报价、库存与更新时间。',
    answer: 'Claude 货源需要按基础账号、Pro、Max 和 Team 分开比较。不同规格对应的额度、成员方式和账号归属不同，卖家接单前应当核对原始商品标题、交付方式、当前库存和售后期限。',
    checkpoints: [
      { title: '确认账号归属', description: '普通账号、客户自有账号充值和渠道提供账号的风险不同。' },
      { title: '确认套餐层级', description: 'Pro、Max 5x、Max 20x 和 Team 的成本不能混算。' },
      { title: '确认售后范围', description: '登录异常、掉订阅和账号找回要有明确处理规则。' },
    ],
    retailProductSlug: 'claude-pro-month',
  },
  {
    slug: 'gemini',
    categoryId: 'gemini',
    name: 'Gemini',
    title: 'Gemini 账号货源与年卡核价',
    description: '为 AI 账号卖家整理 Gemini、Google AI Pro 和 Ultra 的年卡、充值及账号货源，显示当前报价、库存与更新时间。',
    answer: 'Gemini 货源常见年卡账号、教育资格、充值续费和 Ultra 等规格。卖家需要核对资格来源、账号归属、使用期限和售后承诺，不能只按标题中的年卡或低价判断是否适合接单。',
    checkpoints: [
      { title: '核对资格来源', description: '教育资格、普通年卡和官方充值的交付条件不同。' },
      { title: '核对有效期限', description: '标称年卡还要确认开通时间、质保时间和失效处理。' },
      { title: '核对账号控制权', description: '确认邮箱、密码、辅助验证和找回权由谁掌握。' },
    ],
    retailProductSlug: 'gemini-pro-recharge',
  },
  {
    slug: 'grok',
    categoryId: 'grok',
    name: 'Grok',
    title: 'Grok 与 SuperGrok 账号货源核价',
    description: '为 AI 账号卖家整理 Grok、SuperGrok 和 Heavy 相关账号及充值货源，显示可采购报价、库存和更新时间。',
    answer: 'Grok 货源需要区分基础账号、SuperGrok、Heavy 和充值周期。卖家应当把套餐层级、账号归属、开通方式和质保写进报价，库存或原始页面失效时暂停接单。',
    checkpoints: [
      { title: '区分套餐层级', description: '基础账号、SuperGrok 和 Heavy 不能使用同一成本口径。' },
      { title: '确认开通周期', description: '月卡和多月充值需要分别计算资金占用与售后。' },
      { title: '检查原页状态', description: '原始页面下架、库存失效或更新时间过旧时停止报价。' },
    ],
    retailProductSlug: 'grok-super',
  },
  {
    slug: 'ai-coding',
    categoryId: 'ai-coding',
    name: 'AI 编程',
    title: 'AI 编程工具账号货源与订阅核价',
    description: '为 AI 账号卖家整理 Cursor、Kiro、Windsurf 和 MiniMax Coding Plan 等编程工具账号、订阅与服务货源。',
    answer: 'AI 编程工具货源包含独享账号、订阅开通、激活服务和编程套餐。卖家需要先确认交付的是账号、资格还是服务，再比较可采购报价、使用期限、设备限制和售后。',
    checkpoints: [
      { title: '确认交付形态', description: '独享号、激活器、换号器和订阅开通属于不同商品。' },
      { title: '确认设备限制', description: '核对登录设备、地区、客户端版本和换绑条件。' },
      { title: '确认持续可用', description: '价格之外还要检查期限、额度、更新频率和补发规则。' },
    ],
    retailProductSlug: 'cursor-account',
  },
] as const satisfies readonly SellerPlatformTopic[];

export function getSellerPlatformTopic(slug: string): SellerPlatformTopic | undefined {
  return sellerPlatformTopics.find((topic) => topic.slug === slug);
}

export function selectSellerPlatformProducts(
  products: readonly ProductType[],
  topic: Pick<SellerPlatformTopic, 'categoryId'>,
): ProductType[] {
  return products.filter((product) => classifyCatalogProduct(product) === topic.categoryId);
}

interface RetailStoreUrlOptions {
  content: string;
  productSlug?: string;
}

export function getRetailStoreUrl({
  content,
  productSlug,
}: RetailStoreUrlOptions): string {
  const verifiedProductUrl = productSlug
    ? VERIFIED_RETAIL_PRODUCT_URLS[productSlug as keyof typeof VERIFIED_RETAIL_PRODUCT_URLS]
    : undefined;
  const url = new URL(verifiedProductUrl || STORE_URL);
  const safeContent = content.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
  url.searchParams.set('utm_source', 'supply.aivora.cn');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'retail_handoff');
  url.searchParams.set('utm_content', safeContent);
  return url.toString();
}
