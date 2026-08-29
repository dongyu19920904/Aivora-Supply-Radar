import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const deploymentConfigs = [
  '../../wrangler.preview.toml',
  '../../wrangler.production.toml',
];

test('routes the optional V1 opportunity feed through a Cloudflare service binding', async () => {
  const source = await readFile(new URL('./legacy-radar.ts', import.meta.url), 'utf8');
  assert.match(source, /getCloudflareContext\(\)/);
  assert.match(source, /LEGACY_RADAR_SERVICE/);

  for (const config of deploymentConfigs) {
    const toml = await readFile(new URL(config, import.meta.url), 'utf8');
    assert.match(toml, /\[\[services\]\][\s\S]*binding = "LEGACY_RADAR_SERVICE"/);
    assert.match(toml, /\[\[services\]\][\s\S]*service = "aivora-supply-radar"/);
  }
});
