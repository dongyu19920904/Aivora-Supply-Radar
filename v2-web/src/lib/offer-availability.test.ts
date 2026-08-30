import assert from 'node:assert/strict';
import test from 'node:test';

import { isOfferPurchasable, visibleInventory } from './offer-availability';

test('treats only in-stock offers as purchasable', () => {
  assert.equal(isOfferPurchasable({ status: 'in_stock' }), true);
  assert.equal(isOfferPurchasable({ status: 'out_of_stock' }), false);
  assert.equal(isOfferPurchasable({ status: 'offline' }), false);
});

test('never displays zero or unavailable inventory as purchasable stock', () => {
  assert.equal(visibleInventory({ status: 'in_stock', inventory: 8 }), 8);
  assert.equal(visibleInventory({ status: 'in_stock', inventory: 0 }), null);
  assert.equal(visibleInventory({ status: 'in_stock', inventory: null }), null);
  assert.equal(visibleInventory({ status: 'out_of_stock', inventory: 8 }), null);
});
