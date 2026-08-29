import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLegacyOfferTags,
  buildLegacySearchKeywords,
  normalizeLegacyOpportunity,
  normalizeLegacyPriceChange,
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

test('normalizes only traceable account-opportunity reports', () => {
  const row = normalizeLegacyOpportunity({
    report_date: '2026-08-29',
    title: '今天的账号商机',
    description: '公开证据与执行动作',
    body_markdown: '## 30 秒结论',
    source_url: 'https://news.aivora.cn/account-opportunity/2026-08/2026-08-29/',
    source_sha: null,
    published_at: '2026-08-29T00:00:00+08:00',
    synced_at: '2026-08-29 12:50:08',
  });
  assert.equal(row?.report_date, '2026-08-29');
  assert.equal(row?.source_synced_at, '2026-08-29T12:50:08+08:00');
  assert.equal(normalizeLegacyOpportunity({
    report_date: '2026-08-29', title: 'bad', description: '', body_markdown: 'x',
    source_url: 'http://insecure.example', source_sha: null,
    published_at: '2026-08-29T00:00:00+08:00', synced_at: null,
  }), null);
});

test('normalizes verified price changes without inventing prices', () => {
  const row = normalizeLegacyPriceChange({
    product_slug: 'chatgpt-plus',
    product_name: 'ChatGPT Plus',
    merchant_name: '渠道 A',
    source_url: 'https://merchant.example/item',
    previous_price: null,
    current_price: 99,
    previous_stock: 'out_of_stock',
    current_stock: 'in_stock',
    observed_at: '2026-08-29T12:00:00Z',
  });
  assert.equal(row?.previous_price, null);
  assert.equal(row?.current_price, 99);
  assert.equal(row?.observed_at, '2026-08-29T12:00:00Z');
});
