import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public worker converts unhandled OpenNext failures into a branded 503 boundary', async () => {
  const workerSource = await readFile(new URL('../../cloudflare-worker.mjs', import.meta.url), 'utf8');

  assert.match(workerSource, /function failureResponse\(/);
  assert.match(workerSource, /supply_service_temporarily_unavailable/);
  assert.match(workerSource, /status: 503/);
  assert.match(workerSource, /Retry-After/);
  assert.match(workerSource, /X-Robots-Tag/);
  assert.match(workerSource, /catch \(error\)/);
});

test('buyer and seller conversion routes participate in the public HTML cache boundary', async () => {
  const workerSource = await readFile(new URL('../../cloudflare-worker.mjs', import.meta.url), 'utf8');

  assert.match(workerSource, /'\/commercial'/);
  assert.match(workerSource, /'\/wholesale'/);
});

test('public HTML cache is isolated by the immutable Worker release', async () => {
  const workerSource = await readFile(new URL('../../cloudflare-worker.mjs', import.meta.url), 'utf8');

  assert.match(workerSource, /env\.WORKER_CACHE_VERSION/);
  assert.match(workerSource, /__aivora_worker_html_v/);
  assert.match(workerSource, /x-aivora-worker-release/);
  assert.match(workerSource, /publicHtmlCacheKey\(url, release\)/);
});
