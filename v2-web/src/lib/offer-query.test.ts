import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeOfferCursor,
  encodeOfferCursor,
  OFFER_PAGE_MAX_LIMIT,
  parseOfferQuery,
} from './offer-query';

test('offer query clamps limits and normalizes filters', () => {
  const params = new URLSearchParams({
    limit: '5000',
    q: 'ChatGPT -共享 %_*,() ChatGPT',
    platform: ' OpenAI% ',
    category: ' Plus_账号 ',
    status: 'in_stock',
  });

  assert.deepEqual(parseOfferQuery(params), {
    limit: OFFER_PAGE_MAX_LIMIT,
    cursor: null,
    searchTerms: ['chatgpt'],
    excludedTerms: ['共享'],
    platform: 'OpenAI',
    category: 'Plus账号',
    status: 'in_stock',
  });
});

test('offer cursor round-trips only allowlisted values', () => {
  const cursor = {
    status: 'out_of_stock' as const,
    updatedAt: '2026-08-29T06:30:00.000Z',
    id: '24bee918-d2f4-4ecf-8ba1-f39f9b369c4a',
  };

  const encoded = encodeOfferCursor(cursor);
  assert.deepEqual(decodeOfferCursor(encoded), cursor);
  assert.equal(decodeOfferCursor('not-a-cursor'), null);
});

test('offer query ignores malformed status and cursor', () => {
  const params = new URLSearchParams({
    cursor: 'eyJzIjoiYmxhY2tsaXN0ZWQifQ',
    status: 'blacklisted',
    limit: '-5',
  });

  const parsed = parseOfferQuery(params);
  assert.equal(parsed.cursor, null);
  assert.equal(parsed.status, '');
  assert.equal(parsed.limit, 1);
});
