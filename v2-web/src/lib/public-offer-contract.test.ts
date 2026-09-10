import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('public offer API preserves column-level grants and labels aggregate timestamps honestly', () => {
  const route = readFileSync(new URL('../app/api/products/[slug]/offers/route.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(route, /\b(?:scraped_at|last_crawled_at)\b/);
  assert.match(route, /observationKind: 'aggregate-record-update'/);
  assert.match(route, /originalPageVerified: false/);
});
