import assert from 'node:assert/strict';
import test from 'node:test';
import { collectOfferPool, offerSpecification, parseSpecification, specificationGroups } from './offer-specification';

test('separates recharge, shared accounts, regions and durations', () => {
  assert.equal(offerSpecification('ChatGPT Plus 菲律宾卡密充值 1个月'), '卡密充值 · 1个月 · 菲律宾');
  assert.equal(offerSpecification('美区 Claude Pro 个人账号 一年'), '独享账号 · 12个月 · 美国');
  assert.equal(offerSpecification('G plus官方正价拼车（全程质保）'), null);
  assert.equal(offerSpecification('ChatGPT 共享账号 单月'), '共享账号 · 1个月');
  assert.equal(offerSpecification('ChatGPT Pro 菲律宾1个月'), '标准商品 · 1个月 · 菲律宾');
});

test('does not guess incomplete, short-duration or conflicting specs', () => {
  for (const title of ['SuperGrok 1-10天账号', '卡密充值1个月', '菲律宾卡密1个月/12个月', '菲律宾美国卡密1个月', '拼车卡密菲律宾月卡', '菲律宾卡密1个月试用', '菲律宾卡密30天']) {
    assert.equal(offerSpecification(title), null, title);
  }
  assert.equal(parseSpecification('<script>'), '');
  assert.equal(parseSpecification('卡密充值 · 1个月 · 菲律宾'), '卡密充值 · 1个月 · 菲律宾');
  assert.equal(parseSpecification(['账号 · 1个月']), '');
});

test('reads complete pages before classifying, including matches beyond first 50/500', async () => {
  const rows = Array.from({ length: 620 }, (_, index) => ({ product_title: index < 600 ? '拼车不明规格' : '菲律宾卡密1个月', price: 116, status: 'in_stock' }));
  const pool = await collectOfferPool(async (offset, limit) => ({ rows: rows.slice(offset, offset + limit), total: rows.length }));
  assert.equal(pool.length, 620);
  assert.equal(pool.filter((row) => offerSpecification(row.product_title) === '卡密充值 · 1个月 · 菲律宾').length, 20);
  assert.deepEqual(specificationGroups(pool), ['卡密充值 · 1个月 · 菲律宾']);
});

test('fails closed for excessive, truncated or changing pools', async () => {
  await assert.rejects(collectOfferPool(async () => ({ rows: [], total: 5001 })), /limit/);
  await assert.rejects(collectOfferPool(async () => ({ rows: [1], total: 2 })), /incomplete/);
  await assert.rejects(collectOfferPool(async (offset) => ({ rows: Array(500).fill(1), total: offset ? 601 : 600 })), /changed/);
  assert.deepEqual(await collectOfferPool(async () => ({ rows: [], total: 0 })), []);
});
