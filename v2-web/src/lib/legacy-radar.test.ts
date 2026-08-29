import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { getAccountOpportunity, listAccountOpportunities, listPriceChanges } from './legacy-radar';

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.LEGACY_RADAR_API_URL;
const originalConsoleError = console.error;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalApiUrl === undefined) delete process.env.LEGACY_RADAR_API_URL;
  else process.env.LEGACY_RADAR_API_URL = originalApiUrl;
});

test('reads and validates the existing account-opportunity feed', async () => {
  process.env.LEGACY_RADAR_API_URL = 'https://legacy.example.test';
  globalThis.fetch = (async () => new Response(JSON.stringify({
    data: [{
      id: 7,
      report_date: '2026-08-29',
      title: '今天的账号商机',
      description: '公开证据与执行动作',
      body_markdown: '## 结论',
      source_url: 'https://news.aivora.cn/account-opportunity/2026-08/2026-08-29/',
      source_sha: null,
      published_at: '2026-08-29T00:00:00+08:00',
      synced_at: '2026-08-29 10:00:00',
    }],
  }), { headers: { 'content-type': 'application/json' } })) as typeof fetch;

  const result = await listAccountOpportunities();
  assert.equal(result.length, 1);
  assert.equal(result[0]?.report_date, '2026-08-29');
});

test('isolates an unavailable optional feed from the core site', async () => {
  process.env.LEGACY_RADAR_API_URL = 'https://legacy.example.test';
  console.error = () => undefined;
  globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;

  assert.deepEqual(await listAccountOpportunities(), []);
  assert.deepEqual(await listPriceChanges(), []);
});

test('rejects malformed dates without making a network request', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response('{}', { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  assert.equal(await getAccountOpportunity('../admin'), null);
  assert.equal(calls, 0);
});
