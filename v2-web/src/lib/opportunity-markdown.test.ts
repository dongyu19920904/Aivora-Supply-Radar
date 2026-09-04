import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAccountOpportunityReplayMetadata,
  parseAccountOpportunitySections,
  publicOpportunityMarkdown,
  splitBeginnerSteps,
} from './opportunity-markdown';

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

const enhancedMarkdown = `## 今天一句话

- **今天建议** 只做一件事。

## 选择你的阅读方式

- **一眼看懂** 先看结论。

## 一眼看懂

只推荐一个商品。

## 新手今天照着做

先逐步完成。

1. 打开商品页。
2. 填写自己的售价。

### 可复制商品说明草稿

> 付款前再次确认库存

## 老商家今天看这三项

今天没有可比较的连续历史快照。

## 今天暂停什么

暂停缺货商品。

## 数据和判断依据

数据来自同一次快照。

## 收盘填写结果

记录真实结果。

<!-- opportunity-replay: {"businessModel":"supply-merchant-daily-v3","decision":"trial","leadProductSlug":"chatgpt-plus","leadProductName":"ChatGPT Plus","referenceCost":111,"verifiedSourceCount":2,"verifiedSourceNames":["货源甲","货源乙"],"productUrl":"https://supply.aivora.cn/card-products/chatgpt-plus","calculatorUrl":"https://supply.aivora.cn/profit-calculator?cost=111","sourceGeneratedAt":"2026-09-04T00:00:00Z","sourceObservedAt":"2026-09-04T00:00:00Z","copyDraft":"商品名称：ChatGPT Plus\\n付款前再次确认库存"} -->`;

test('parses the three seller reading modes and keeps the full no-script body', () => {
  const sections = parseAccountOpportunitySections(enhancedMarkdown);
  assert.equal(sections.enhanced, true);
  assert.match(sections.overview, /只推荐一个商品/);
  assert.match(sections.beginner, /填写自己的售价/);
  assert.match(sections.experienced, /没有可比较/);
  assert.match(sections.full, /## 收盘填写结果/);
  const beginner = splitBeginnerSteps(sections.beginner);
  assert.deepEqual(beginner.steps, ['打开商品页。', '填写自己的售价。']);
  assert.match(beginner.remainder, /付款前再次确认库存/);
});

test('parses only safe v3 replay fields for task and copy actions', () => {
  const metadata = parseAccountOpportunityReplayMetadata(enhancedMarkdown);
  assert.equal(metadata?.decision, 'trial');
  assert.equal(metadata?.verifiedSourceCount, 2);
  assert.equal(metadata?.referenceCost, 111);
  assert.match(metadata?.copyDraft || '', /付款前再次确认库存/);
  assert.equal(metadata?.productUrl, 'https://supply.aivora.cn/card-products/chatgpt-plus');
});

test('recovers safe task fields after the archive sync removes internal replay metadata', () => {
  const published = publicOpportunityMarkdown(enhancedMarkdown.replace(
    '只推荐一个商品。',
    `### [ChatGPT Plus 正价代充](https://supply.aivora.cn/card-products/chatgpt-plus-recharge)

- **当前进货参考** ¥116.15。付款前再次确认。
- **为什么只选它** 同规格组核到 5 个不同货源站。
- **开始按钮** [带入成本](https://supply.aivora.cn/profit-calculator?product=ChatGPT+Plus&cost=116.15)。`,
  ));
  const metadata = parseAccountOpportunityReplayMetadata(published);

  assert.equal(metadata?.decision, 'trial');
  assert.equal(metadata?.leadProductSlug, 'chatgpt-plus-recharge');
  assert.equal(metadata?.referenceCost, 116.15);
  assert.equal(metadata?.verifiedSourceCount, 5);
  assert.match(metadata?.copyDraft || '', /付款前再次确认库存/);
  assert.equal(metadata?.sourceGeneratedAt, null);
});

test('keeps historical daily markdown in the legacy readable mode', () => {
  const legacy = parseAccountOpportunitySections('## 今日能不能做\n\n保留旧正文。');
  assert.equal(legacy.enhanced, false);
  assert.match(legacy.full, /保留旧正文/);
});
