import assert from 'node:assert/strict';
import test from 'node:test';
import { getAccountOpportunity, parseAccountOpportunityRow, parsePriceChangeRow } from './legacy-radar';

test('reads and validates a synchronized account-opportunity row', () => {
  const result = parseAccountOpportunityRow({
    report_date: '2026-08-29',
    title: '今天的账号商机',
    description: '公开证据与执行动作',
    body_markdown: '## 结论',
    source_url: 'https://news.aivora.cn/account-opportunity/2026-08/2026-08-29/',
    source_sha: null,
    published_at: '2026-08-29T00:00:00+08:00',
    source_synced_at: '2026-08-29T12:50:08+08:00',
  });
  assert.equal(result?.report_date, '2026-08-29');
  assert.equal(result?.synced_at, '2026-08-29T12:50:08+08:00');
});

test('rejects malformed optional signal rows without affecting the core catalog', () => {
  assert.equal(parseAccountOpportunityRow({ report_date: '../admin' }), null);
  assert.equal(parsePriceChangeRow({ source_url: 'http://insecure.example' }), null);
});

test('rejects malformed dates without making a network request', async () => {
  assert.equal(await getAccountOpportunity('../admin'), null);
});
