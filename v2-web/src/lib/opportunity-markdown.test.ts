import assert from 'node:assert/strict';
import test from 'node:test';

import { publicOpportunityMarkdown } from './opportunity-markdown';

test('removes internal replay metadata from merchant reports', () => {
  const markdown = `## 今日动作

只展示给商家的经营正文。

<!-- opportunity-replay: {"entity":"supply:chatgpt-plus","preferredLane":"account"} -->`;

  assert.equal(publicOpportunityMarkdown(markdown), '## 今日动作\n\n只展示给商家的经营正文。');
});

test('preserves ordinary markdown and unrelated comments', () => {
  const markdown = '## 标题\n\n[核验货源](https://supply.aivora.cn/)\n\n<!-- editorial-note -->';

  assert.equal(publicOpportunityMarkdown(markdown), markdown);
});
