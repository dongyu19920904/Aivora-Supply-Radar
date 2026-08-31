import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductType } from '../data';
import {
  PRODUCT_SLUG_ALIASES,
  isKnownProductAlias,
  mergeCanonicalCatalogProducts,
  productSlugsForCanonical,
  resolveCanonicalProductSlug,
} from './product-canonicalization';

function product(overrides: Partial<ProductType> & Pick<ProductType, 'id' | 'slug' | 'name'>): ProductType {
  return {
    platform: 'ChatGPT',
    lowestPrice: null,
    warrantyPrice: null,
    channelCount: 0,
    updatedAt: null,
    sort_order: 1,
    ...overrides,
  };
}

test('contains the 22 audited exact cross-source aliases', () => {
  assert.equal(Object.keys(PRODUCT_SLUG_ALIASES).length, 22);
  assert.equal(resolveCanonicalProductSlug('chatgpt-plus-trial'), 'chatgpt-plus');
  assert.equal(resolveCanonicalProductSlug('chatgpt-plus-renewal'), 'chatgpt-plus-recharge');
  assert.equal(resolveCanonicalProductSlug('claude-pro'), 'claude-pro-month');
  assert.equal(resolveCanonicalProductSlug('unknown-product'), 'unknown-product');
  assert.equal(isKnownProductAlias('chatgpt-plus-trial'), true);
  assert.equal(isKnownProductAlias('chatgpt-plus'), false);
});

test('returns canonical and legacy slugs for old URL and pre-migration reads', () => {
  assert.deepEqual(productSlugsForCanonical('chatgpt-plus-trial'), ['chatgpt-plus', 'chatgpt-plus-trial']);
  assert.deepEqual(productSlugsForCanonical('chatgpt-plus'), ['chatgpt-plus', 'chatgpt-plus-trial']);
  assert.deepEqual(productSlugsForCanonical('unmapped'), ['unmapped']);
});

test('merges supply signals without replacing canonical metadata', () => {
  const merged = mergeCanonicalCatalogProducts([
    product({
      id: 'legacy-id',
      slug: 'chatgpt-plus-trial',
      name: 'ChatGPT Plus 试用订阅',
      shortDesc: 'legacy description',
      lowestPrice: 149,
      warrantyPrice: 149,
      channelCount: 1,
      updatedAt: '2026-08-30T00:00:00Z',
      searchKeywords: ['legacy'],
    }),
    product({
      id: 'canonical-id',
      slug: 'chatgpt-plus',
      name: 'ChatGPT Plus 试用订阅',
      shortDesc: 'canonical description',
      lowestPrice: 10.82,
      warrantyPrice: 87.55,
      channelCount: 225,
      updatedAt: '2026-08-31T00:00:00Z',
      searchKeywords: ['priceai'],
    }),
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'canonical-id');
  assert.equal(merged[0].slug, 'chatgpt-plus');
  assert.equal(merged[0].shortDesc, 'canonical description');
  assert.equal(merged[0].lowestPrice, 10.82);
  assert.equal(merged[0].warrantyPrice, 87.55);
  assert.equal(merged[0].channelCount, 226);
  assert.equal(merged[0].updatedAt, '2026-08-31T00:00:00Z');
  assert.deepEqual(new Set(merged[0].searchKeywords), new Set([
    'ChatGPT Plus 试用订阅',
    'chatgpt-plus-trial',
    'legacy',
    'chatgpt-plus',
    'priceai',
  ]));
});

test('does not merge distinct commercial variants', () => {
  const merged = mergeCanonicalCatalogProducts([
    product({ id: 'trial', slug: 'chatgpt-plus', name: 'ChatGPT Plus 试用订阅' }),
    product({ id: 'recharge', slug: 'chatgpt-plus-recharge', name: 'ChatGPT Plus 正价代充' }),
  ]);
  assert.deepEqual(merged.map((item) => item.slug), ['chatgpt-plus', 'chatgpt-plus-recharge']);
});
