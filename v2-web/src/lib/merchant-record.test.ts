import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyMerchantRecord, parseMerchantRecord, recordedContribution } from './merchant-record';
test('missing income or cost is unknown, not zero profit', () => {
  assert.equal(recordedContribution(emptyMerchantRecord()), null);
  const row = { ...emptyMerchantRecord(), revenue: '100', purchase: '60', fees: '2', refunds: '0', service: '5', acquisition: '3', fixed: '4' };
  assert.equal(recordedContribution(row), 26);
  assert.equal(recordedContribution({ ...row, revenue: '' }), null);
  assert.equal(recordedContribution({ ...row, fees: '-1' }), null);
});
test('local record parsing is bounded and only uses known fields', () => {
  assert.equal(parseMerchantRecord({ task: 'x'.repeat(3000), token: 'not-a-record-field' }).task.length, 2000);
  assert.deepEqual(parseMerchantRecord(null), emptyMerchantRecord());
});
