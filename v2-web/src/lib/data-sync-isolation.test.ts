import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('archive and PriceAI have separate matrix jobs and do not hide failures', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/v2-data-sync.yml', import.meta.url), 'utf8');
  assert.match(workflow, /fail-fast: false/);
  assert.match(workflow, /feed: \[legacy, account-opportunity-archive, priceai\]/);
  assert.doesNotMatch(workflow, /continue-on-error/);
  assert.match(workflow, /if: always\(\)/);
});
