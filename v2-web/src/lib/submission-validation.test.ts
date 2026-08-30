import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePublicHttpsUrl, validateChannelSubmission } from './submission-validation';

test('normalizes public HTTPS URLs and drops fragments', () => {
  assert.equal(normalizePublicHttpsUrl('https://Example.com/path/#offer'), 'https://example.com/path');
  assert.equal(normalizePublicHttpsUrl('https://example.com/'), 'https://example.com');
});

test('rejects insecure, credentialed, local, and private submission URLs', () => {
  for (const value of [
    'http://example.com',
    'https://user:pass@example.com',
    'https://localhost',
    'https://127.0.0.1',
    'https://192.168.1.8',
    'https://service.internal',
  ]) {
    assert.equal(normalizePublicHttpsUrl(value), null, value);
  }
});

test('validates and bounds channel submission fields', () => {
  const form = new FormData();
  form.set('site_name', ' 示例渠道 ');
  form.set('site_url', 'https://example.com/');
  form.set('contact', 'seller@example.com');
  const result = validateChannelSubmission(form);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.name, '示例渠道');
    assert.equal(result.value.siteUrl, 'https://example.com');
  }
});
