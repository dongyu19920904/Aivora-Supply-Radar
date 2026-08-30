import assert from 'node:assert/strict';
import test from 'node:test';

import { parseProductOfferQuery } from './product-offer-query';

test('parses bounded product offer filters for server-side pagination', () => {
  const params = new URLSearchParams({
    limit: '500',
    offset: '12000',
    q: 'ChatGPT -共享',
    min: '10.5',
    max: '100',
    availability: 'available',
  });
  assert.deepEqual(parseProductOfferQuery(params), {
    limit: 100,
    offset: 10_000,
    searchTerms: ['chatgpt'],
    excludedTerms: ['共享'],
    minPrice: 10.5,
    maxPrice: 100,
    availability: 'available',
  });
});

test('normalizes a maximum price below the minimum', () => {
  const parsed = parseProductOfferQuery(new URLSearchParams({ min: '50', max: '10' }));
  assert.equal(parsed.minPrice, 50);
  assert.equal(parsed.maxPrice, 50);
  assert.equal(parsed.availability, 'all');
});

test('accepts only supported availability filters', () => {
  assert.equal(parseProductOfferQuery(new URLSearchParams({ availability: 'unavailable' })).availability, 'unavailable');
  assert.equal(parseProductOfferQuery(new URLSearchParams({ availability: 'in_stock' })).availability, 'all');
});
