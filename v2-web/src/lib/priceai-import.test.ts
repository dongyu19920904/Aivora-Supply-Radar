import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPriceAiChange,
  buildPriceAiTags,
  isAllowedPriceAiProduct,
  normalizePriceAiStatus,
  validHttpsUrl,
} from './priceai-import';

const changeContext = {
  productSlug: 'chatgpt-plus',
  productName: 'ChatGPT Plus',
  merchantName: '示例渠道',
  sourceUrl: 'https://example.com/chatgpt-plus',
};

test('keeps AI catalog products and excludes the mixed non-AI catch-all', () => {
  assert.equal(isAllowedPriceAiProduct({ id: 'chatgpt-plus', slug: 'chatgpt-plus', platform: 'ChatGPT' }), true);
  assert.equal(isAllowedPriceAiProduct({ id: 'cursor-account', slug: 'cursor-account', platform: '其他' }), true);
  assert.equal(isAllowedPriceAiProduct({ id: 'other-product', slug: 'other-product', platform: '其他' }), false);
});

test('maps PriceAI availability without promoting unknown states', () => {
  assert.equal(normalizePriceAiStatus('in_stock', 'available', false), 'in_stock');
  assert.equal(normalizePriceAiStatus('unknown', 'unknown', false), 'offline');
  assert.equal(normalizePriceAiStatus('in_stock', 'available', true), 'blacklisted');
});

test('accepts only bounded HTTPS purchase links', () => {
  assert.equal(validHttpsUrl('https://example.com/item/1'), 'https://example.com/item/1');
  assert.equal(validHttpsUrl('http://example.com/item/1'), null);
  assert.equal(validHttpsUrl('not-a-url'), null);
});

test('builds traceable grouped PriceAI tags', () => {
  assert.deepEqual(buildPriceAiTags({
    id: 'id-1',
    currency: 'CNY',
    collectorKind: 'shop_api',
    confidence: 0.85,
    filterTags: ['delivery account'],
    minOrderQuantity: 10,
    sourceIncludedAt: '2026-08-29T10:00:00+08:00',
    freshnessStatus: 'fresh',
  }, 4), [
    'source:priceai',
    'priceaiOfferId:id-1',
    'groupCount:4',
    'currency:CNY',
    'collector:shop_api',
    'freshness:fresh',
    'minOrder:10',
    'includedTime:2026-08-29',
    'risk:low',
    'facet:delivery_account',
  ]);
});

test('does not report first snapshots or unchanged snapshots as price changes', () => {
  const current = { price: 99, status: 'in_stock' as const, observedAt: '2026-08-30T10:00:00+08:00' };
  assert.equal(buildPriceAiChange(null, current, changeContext), null);
  assert.equal(buildPriceAiChange({ ...current, observedAt: '2026-08-30T09:00:00+08:00' }, current, changeContext), null);
});

test('reports price and stock changes only when the source snapshot moves forward', () => {
  assert.deepEqual(buildPriceAiChange(
    { price: '109.00', status: 'in_stock', observedAt: '2026-08-30T09:00:00+08:00' },
    { price: 99, status: 'out_of_stock', observedAt: '2026-08-30T10:00:00+08:00' },
    changeContext,
  ), {
    product_slug: 'chatgpt-plus',
    product_name: 'ChatGPT Plus',
    merchant_name: '示例渠道',
    source_url: 'https://example.com/chatgpt-plus',
    previous_price: 109,
    current_price: 99,
    previous_stock: 'in_stock',
    current_stock: 'out_of_stock',
    observed_at: '2026-08-30T10:00:00+08:00',
  });

  assert.equal(buildPriceAiChange(
    { price: 109, status: 'in_stock', observedAt: '2026-08-30T11:00:00+08:00' },
    { price: 99, status: 'out_of_stock', observedAt: '2026-08-30T10:00:00+08:00' },
    changeContext,
  ), null);
});
