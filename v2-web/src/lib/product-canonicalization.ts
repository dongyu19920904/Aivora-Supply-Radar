import type { ProductType } from '../data';

/**
 * Verified cross-source aliases. Only products with the same normalized name
 * and commercial specification belong here; fuzzy matching is intentionally
 * forbidden because trial, recharge, Team and Pro offers are different goods.
 */
export const PRODUCT_SLUG_ALIASES = {
  'other-email': 'email-account',
  'generic-verification': 'phone-verification',
  'identity-service': 'identity-verification',
  'apple-id': 'apple-id-account',
  'chatgpt-account': 'chatgpt-free-account',
  'chatgpt-plus-trial': 'chatgpt-plus',
  'chatgpt-plus-renewal': 'chatgpt-plus-recharge',
  'chatgpt-team': 'chatgpt-team-business',
  'claude-pro': 'claude-pro-month',
  'chatgpt-services': 'chatgpt-codex-service',
  'gemini-pro-account': 'gemini-pro-year',
  'gemini-pro-renewal': 'gemini-pro-recharge',
  'gmail-email': 'gmail-account',
  'google-verification': 'google-phone-verification',
  'kiro-free': 'kiro-account',
  'kiro-pro': 'kiro-pro-account',
  'openai-verification': 'openai-phone-verification',
  'outlook-email': 'outlook-account',
  'paypal-verification': 'paypal-phone-verification',
  'grok-heavy': 'super-grok-heavy',
  'x-account': 'x-twitter-account',
  'x-premium': 'x-twitter-premium',
} as const satisfies Readonly<Record<string, string>>;

export type ProductAliasSlug = keyof typeof PRODUCT_SLUG_ALIASES;

const aliasesByCanonical = new Map<string, string[]>();
for (const [alias, canonical] of Object.entries(PRODUCT_SLUG_ALIASES)) {
  const aliases = aliasesByCanonical.get(canonical) || [];
  aliases.push(alias);
  aliasesByCanonical.set(canonical, aliases);
}

export function resolveCanonicalProductSlug(slug: string): string {
  let current = slug;
  const visited = new Set<string>();
  while (current in PRODUCT_SLUG_ALIASES && !visited.has(current)) {
    visited.add(current);
    current = PRODUCT_SLUG_ALIASES[current as ProductAliasSlug];
  }
  return current;
}

export function productSlugsForCanonical(slug: string): string[] {
  const canonical = resolveCanonicalProductSlug(slug);
  return [canonical, ...(aliasesByCanonical.get(canonical) || [])];
}

export function isKnownProductAlias(slug: string): slug is ProductAliasSlug {
  return slug in PRODUCT_SLUG_ALIASES;
}

function smallestPositive(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  return valid.length ? Math.min(...valid) : null;
}

function newestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)));
  return valid.sort((left, right) => Date.parse(right) - Date.parse(left))[0] || null;
}

/**
 * Makes the public catalog correct before and after the database migration.
 * The canonical row owns public metadata while numeric supply signals are
 * aggregated from every verified alias row.
 */
export function mergeCanonicalCatalogProducts(products: readonly ProductType[]): ProductType[] {
  const groups = new Map<string, ProductType[]>();
  for (const product of products) {
    const canonical = resolveCanonicalProductSlug(product.slug);
    const group = groups.get(canonical) || [];
    group.push(product);
    groups.set(canonical, group);
  }

  return [...groups.entries()].map(([canonical, group]) => {
    const canonicalRow = group.find((product) => product.slug === canonical) || group[0];
    const searchKeywords = new Set<string>();
    for (const product of group) {
      searchKeywords.add(product.name);
      searchKeywords.add(product.slug);
      for (const keyword of product.searchKeywords || []) searchKeywords.add(keyword);
    }

    return {
      ...canonicalRow,
      slug: canonical,
      lowestPrice: smallestPositive(group.map((product) => product.lowestPrice)),
      warrantyPrice: smallestPositive(group.map((product) => product.warrantyPrice)),
      channelCount: group.reduce((sum, product) => sum + Math.max(0, product.channelCount || 0), 0),
      updatedAt: newestTimestamp(group.map((product) => product.updatedAt)),
      searchKeywords: [...searchKeywords],
    };
  });
}
