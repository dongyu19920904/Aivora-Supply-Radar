import assert from 'node:assert/strict';
import test from 'node:test';

import { latestAccountOpportunityHref } from './account-opportunity-navigation';

test('builds a direct latest daily href from the newest report', () => {
  assert.equal(
    latestAccountOpportunityHref([{ report_date: '2026-09-01' }, { report_date: '2026-08-31' }]),
    '/opportunities/2026-09-01',
  );
});

test('falls back to the realtime dashboard when no valid report exists', () => {
  assert.equal(latestAccountOpportunityHref([]), '/opportunities');
  assert.equal(latestAccountOpportunityHref([{ report_date: 'latest' }]), '/opportunities');
});
