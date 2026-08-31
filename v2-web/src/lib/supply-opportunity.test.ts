import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductType } from '../data';
import type { AccountOpportunity, PriceChange } from './legacy-radar';
import {
  buildPublicSupplyOpportunitySnapshot,
  buildSupplyOpportunityDashboard,
  findRelatedCatalogProducts,
  getProfitCalculatorHref,
} from './supply-opportunity';

function product(overrides: Partial<ProductType> & Pick<ProductType, 'slug' | 'name'>): ProductType {
  return {
    id: overrides.slug,
    slug: overrides.slug,
    name: overrides.name,
    platform: overrides.platform || '其他',
    lowestPrice: overrides.lowestPrice ?? null,
    warrantyPrice: null,
    channelCount: overrides.channelCount ?? 0,
    updatedAt: overrides.updatedAt ?? '2026-08-31T02:00:00Z',
    sort_order: 1,
    ...overrides,
  };
}

function change(overrides: Partial<PriceChange> & Pick<PriceChange, 'product_slug'>): PriceChange {
  return {
    product_slug: overrides.product_slug,
    product_name: overrides.product_name || overrides.product_slug,
    merchant_name: overrides.merchant_name || '测试渠道',
    source_url: overrides.source_url || 'https://example.com/offer',
    previous_price: overrides.previous_price ?? 100,
    current_price: overrides.current_price ?? 80,
    previous_stock: overrides.previous_stock ?? 'in_stock',
    current_stock: overrides.current_stock ?? 'in_stock',
    observed_at: overrides.observed_at || '2026-08-31T03:00:00Z',
  };
}

const products = [
  product({ slug: 'chatgpt-plus', name: 'ChatGPT Plus', platform: 'ChatGPT', lowestPrice: 80, channelCount: 220 }),
  product({ slug: 'claude-pro', name: 'Claude Pro', platform: 'Claude', lowestPrice: 120, channelCount: 3 }),
  product({ slug: 'claude-max', name: 'Claude Max 20x', platform: 'Claude', lowestPrice: 800, channelCount: 1 }),
  product({ slug: 'cursor', name: 'Cursor 账号', lowestPrice: 20, channelCount: 4 }),
];

test('builds live supply signals from price, stock and catalog facts without inventing sales', () => {
  const dashboard = buildSupplyOpportunityDashboard(products, [
    change({ product_slug: 'chatgpt-plus', previous_stock: 'out_of_stock', current_stock: 'in_stock' }),
    change({ product_slug: 'claude-pro', previous_price: 150, current_price: 120 }),
  ], new Date('2026-08-31T04:00:00Z'));

  assert.equal(dashboard.stats.productCount, 4);
  assert.equal(dashboard.stats.availableProductCount, 4);
  assert.equal(dashboard.stats.availableOfferCount, 228);
  assert.equal(dashboard.stats.recentChangeCount, 2);
  assert.equal(dashboard.categories[0].id, 'chatgpt');
  assert.equal(dashboard.categories[1].id, 'claude');
  assert.equal(dashboard.signals[0].kind, 'restock');
  assert.ok(dashboard.signals.some((signal) => signal.kind === 'price_drop'));
  assert.ok(dashboard.signals.some((signal) => signal.kind === 'supply_gap'));
  assert.ok(dashboard.signals.every((signal) => !/保证赚钱|销量已验证/.test(signal.summary)));
});

test('ignores stale and insignificant changes while deduplicating the same product signal', () => {
  const dashboard = buildSupplyOpportunityDashboard(products, [
    change({ product_slug: 'claude-pro', previous_price: 100, current_price: 96 }),
    change({ product_slug: 'claude-pro', merchant_name: '旧渠道', observed_at: '2026-08-20T00:00:00Z' }),
  ], new Date('2026-08-31T04:00:00Z'));
  assert.equal(dashboard.stats.recentChangeCount, 1);
  assert.equal(dashboard.signals.filter((signal) => signal.product.name === 'Claude Pro').length, 1);
  assert.equal(dashboard.signals.find((signal) => signal.product.name === 'Claude Pro')?.kind, 'supply_gap');
});

test('relates an old industry report to the current matching supply category', () => {
  const report: Pick<AccountOpportunity, 'title' | 'description' | 'body_markdown'> = {
    title: 'Claude 自主研究能力更新',
    description: 'Anthropic 发布新研究。',
    body_markdown: 'Claude Claude Claude 的研究能力变化；API 只是成本说明。',
  };
  assert.deepEqual(
    findRelatedCatalogProducts(report, products).map((item) => item.slug),
    ['claude-pro', 'claude-max'],
  );
});

test('builds a prefilled profit calculator link from the current lowest price', () => {
  assert.equal(
    getProfitCalculatorHref(products[1]),
    '/profit-calculator?product=Claude+Pro&cost=120.00',
  );
});

test('serializes a bounded public snapshot for the account opportunity daily', () => {
  const dashboard = buildSupplyOpportunityDashboard(products, [
    change({ product_slug: 'chatgpt-plus', previous_stock: 'out_of_stock', current_stock: 'in_stock' }),
  ], new Date('2026-08-31T04:00:00Z'));
  dashboard.stats.recentChangeCount = 100;

  const snapshot = buildPublicSupplyOpportunitySnapshot(dashboard);

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.source, 'https://supply.aivora.cn/opportunities');
  assert.equal(snapshot.stats.recentChangeCountCapped, true);
  assert.ok(snapshot.signals.length <= 6);
  assert.equal(snapshot.signals[0].product.slug, 'chatgpt-plus');
  assert.equal(
    snapshot.signals[0].product.productUrl,
    'https://supply.aivora.cn/card-products/chatgpt-plus',
  );
  assert.equal(
    snapshot.signals[0].product.profitCalculatorUrl,
    'https://supply.aivora.cn/profit-calculator?product=ChatGPT+Plus&cost=80.00',
  );
  assert.equal('shortDesc' in snapshot.signals[0].product, false);
});
