import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductType } from '../data';
import {
  filterCatalogAvailability,
  hasActiveCatalogOffer,
  isCoreAiProduct,
  sortCatalogProducts,
} from './product-ranking';

function product(overrides: Partial<ProductType> & Pick<ProductType, 'slug' | 'name'>): ProductType {
  return {
    id: overrides.slug,
    slug: overrides.slug,
    name: overrides.name,
    platform: overrides.platform || '其他',
    lowestPrice: overrides.lowestPrice ?? null,
    warrantyPrice: overrides.warrantyPrice ?? null,
    channelCount: overrides.channelCount ?? 0,
    updatedAt: overrides.updatedAt ?? null,
    sort_order: overrides.sort_order ?? 100,
    platform_sort_order: overrides.platform_sort_order ?? 100,
    ...overrides,
  };
}

const products = [
  product({
    slug: 'openai-verification',
    name: 'OpenAI / ChatGPT 接码',
    platform: '接码',
    lowestPrice: 0.1,
    channelCount: 600,
    updatedAt: '2026-08-30T10:00:00Z',
  }),
  product({
    slug: 'chatgpt-plus',
    name: 'ChatGPT Plus 试用订阅',
    platform: 'ChatGPT',
    lowestPrice: 10,
    channelCount: 971,
    updatedAt: '2026-08-30T09:00:00Z',
  }),
  product({
    slug: 'claude-pro',
    name: 'Claude Pro',
    platform: 'Claude',
    lowestPrice: 128,
    channelCount: 119,
    updatedAt: '2026-08-30T11:00:00Z',
  }),
  product({
    slug: 'chatgpt-plus-legacy',
    name: 'ChatGPT Plus 试用订阅',
    platform: 'ChatGPT',
    lowestPrice: 149,
    channelCount: 1,
    updatedAt: '2026-08-30T08:00:00Z',
  }),
  product({
    slug: 'grok-empty',
    name: 'SuperGrok Heavy',
    platform: 'Grok',
    channelCount: 0,
    sort_order: 1,
    platform_sort_order: 1,
  }),
];

test('recommended order keeps active core AI products ahead of auxiliary and empty rows', () => {
  const ordered = sortCatalogProducts(products, 'recommended');
  assert.deepEqual(ordered.map((item) => item.slug), [
    'chatgpt-plus',
    'claude-pro',
    'chatgpt-plus-legacy',
    'openai-verification',
    'grok-empty',
  ]);
  assert.equal(hasActiveCatalogOffer(ordered[0]), true);
  assert.equal(hasActiveCatalogOffer(ordered.at(-1) as ProductType), false);
});

test('recognizes subscriptions as core products without promoting verification services', () => {
  assert.equal(isCoreAiProduct(products[1]), true);
  assert.equal(isCoreAiProduct(products[0]), false);
});

test('channel, price and freshness modes follow their visible labels', () => {
  assert.equal(sortCatalogProducts(products, 'channels')[0].slug, 'chatgpt-plus');
  assert.equal(sortCatalogProducts(products, 'price')[0].slug, 'openai-verification');
  assert.equal(sortCatalogProducts(products, 'updated')[0].slug, 'claude-pro');
});

test('availability filtering preserves the source array and every catalog entry', () => {
  const source = [...products];
  assert.equal(filterCatalogAvailability(products, 'available').length, 4);
  assert.deepEqual(filterCatalogAvailability(products, 'unavailable').map((item) => item.slug), ['grok-empty']);
  assert.equal(filterCatalogAvailability(products, 'all').length, products.length);
  assert.deepEqual(products, source);
});
