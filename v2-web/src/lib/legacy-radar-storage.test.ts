import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('stores optional V1 signals in read-only Supabase tables', async () => {
  const migration = await readFile(
    new URL('../../supabase/migrations/20260829002000_add_legacy_signal_feeds.sql', import.meta.url),
    'utf8',
  );
  assert.match(migration, /create table if not exists public\.account_opportunities/);
  assert.match(migration, /create table if not exists public\.market_price_changes/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant select[\s\S]*to anon, authenticated/);

  const workflow = await readFile(new URL('../../../.github/workflows/v2-data-sync.yml', import.meta.url), 'utf8');
  assert.match(workflow, /LEGACY_RADAR_API_URL: https:\/\/aivora-supply-radar\.sabrinamisan090\.workers\.dev/);
});
