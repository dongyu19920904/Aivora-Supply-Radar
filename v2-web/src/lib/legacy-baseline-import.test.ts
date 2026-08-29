import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLegacyOfferTags,
  buildLegacySearchKeywords,
  normalizeLegacyStockStatus,
} from './legacy-baseline-import';

test('normalizes unsupported legacy stock values to offline', () => {
  assert.equal(normalizeLegacyStockStatus('in_stock'), 'in_stock');
  assert.equal(normalizeLegacyStockStatus('sold_out'), 'offline');
  assert.equal(normalizeLegacyStockStatus(null), 'offline');
});

test('builds stable deduplicated legacy product keywords', () => {
  assert.deepEqual(buildLegacySearchKeywords({
    slug: 'chatgpt-plus',
    platform: 'ChatGPT',
    name: 'ChatGPT Plus',
    subtitle: 'ChatGPT',
    product_type: 'subscription',
  }), ['ChatGPT', 'ChatGPT Plus', 'subscription']);
});

test('adds traceable source and date tags without inventing fields', () => {
  assert.deepEqual(buildLegacyOfferTags({
    id: 7,
    currency: 'CNY',
    delivery_type: 'mirror',
    warranty: 'store-terms',
    high_price: null,
    observed_at: '2026-08-29T12:50:11.750Z',
  }), [
    'source:legacy-v1',
    'legacyOfferId:7',
    'currency:CNY',
    'deliveryType:mirror',
    'warranty:store-terms',
    'includedTime:2026-08-29',
    'risk:low',
  ]);
});
