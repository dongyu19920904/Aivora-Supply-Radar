import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateProfit } from './profit-calculator';

test('calculates net profit, margin, and break-even price', () => {
  const result = calculateProfit({
    unitCost: 70,
    salePrice: 100,
    quantity: 10,
    paymentFeeRate: 3,
    refundReserveRate: 5,
    serviceReserveRate: 2,
    fixedCost: 50,
  });
  assert.deepEqual(result, {
    revenue: 1_000,
    supplierCost: 700,
    paymentFee: 30,
    riskReserve: 70,
    netProfit: 150,
    marginRate: 15,
    breakEvenPrice: 83.33333333333333,
  });
});

test('bounds invalid inputs and reports no break-even price at 100% variable cost', () => {
  const result = calculateProfit({
    unitCost: -20,
    salePrice: Number.NaN,
    quantity: 0,
    paymentFeeRate: 60,
    refundReserveRate: 40,
    serviceReserveRate: 20,
    fixedCost: -1,
  });
  assert.equal(result.revenue, 0);
  assert.equal(result.supplierCost, 0);
  assert.equal(result.breakEvenPrice, null);
});
