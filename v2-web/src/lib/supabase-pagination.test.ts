import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchAllSupabasePages } from './supabase-pagination';

test('fetches rows beyond the Supabase 1000-row response limit', async () => {
  const source = Array.from({ length: 1_088 }, (_, index) => index);
  const ranges: Array<[number, number]> = [];
  const result = await fetchAllSupabasePages(async (from, to) => {
    ranges.push([from, to]);
    return source.slice(from, to + 1);
  });

  assert.equal(result.length, 1_088);
  assert.deepEqual(ranges, [[0, 999], [1_000, 1_999]]);
});

test('rejects page sizes that exceed the configured Supabase limit', async () => {
  await assert.rejects(() => fetchAllSupabasePages(async () => [], 1_001), /invalid_supabase_page_size/);
});
