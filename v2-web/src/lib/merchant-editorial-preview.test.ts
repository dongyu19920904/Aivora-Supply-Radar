import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import fixture from '@/fixtures/merchant-editorial-preview.json';
import { parseAccountOpportunityReplayMetadata, parseAccountOpportunitySections, splitBeginnerSteps } from './opportunity-markdown';

test('real reviewed editorial fixture remains readable and exposes its copy material after metadata removal', () => {
  const sections = parseAccountOpportunitySections(fixture.body);
  assert.equal(sections.enhanced, true);
  assert.equal(splitBeginnerSteps(sections.beginner).steps.length, 5);
  assert.match(parseAccountOpportunityReplayMetadata(fixture.body)?.copyDraft || '', /付款前再次确认库存/);
  assert.doesNotMatch(sections.evidence, /profit-calculator\?product=Claude%20Max/);
  assert.match(fixture.body, /Google AI Pro|Google 家庭共享/);
  assert.match(fixture.body, /gemini-pro-recharge/);
  assert.match(fixture.body, /不能把它们写成每位成员都有一份独立额度/);
});

test('editorial preview is noindex and explicitly unavailable on production', () => {
  const page = readFileSync(new URL('../app/opportunities/editorial-preview/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /SITE_URL !== 'https:\/\/aivora-supply-radar-v2-preview\.sabrinamisan090\.workers\.dev'\) notFound\(\)/);
  assert.match(page, /index: false/);
  assert.match(page, /datePublished: `\$\{fixture.date\}T00:00:00\+08:00`/);
});
