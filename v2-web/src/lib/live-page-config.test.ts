import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const livePages = [
  '../app/page.tsx',
  '../app/card-products/page.tsx',
  '../app/card-products/all/page.tsx',
  '../app/channels/page.tsx',
  '../app/opportunities/page.tsx',
  '../app/changes/page.tsx',
  '../app/official-prices/page.tsx',
];

test('keeps synchronized market pages dynamic with the read-only edge cache', async () => {
  for (const page of livePages) {
    const source = await readFile(new URL(page, import.meta.url), 'utf8');
    assert.match(source, /export const dynamic = ['"]force-dynamic['"]/);
    assert.doesNotMatch(source, /export const revalidate\s*=/);
  }
});
