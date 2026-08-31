import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProductType } from '../data';
import {
  catalogCategories,
  classifyCatalogProduct,
  getCatalogCategoryOptions,
  groupCatalogProducts,
} from './catalog-taxonomy';

function product(name: string, platform = '其他'): ProductType {
  return {
    id: `${platform}-${name}`,
    slug: `${platform}-${name}`.toLowerCase().replace(/\s+/g, '-'),
    name,
    platform,
    lowestPrice: 10,
    warrantyPrice: null,
    channelCount: 1,
    updatedAt: '2026-08-31T00:00:00Z',
    sort_order: 1,
  };
}

test('uses a stable buyer-facing category order with ChatGPT first', () => {
  assert.deepEqual(catalogCategories.map((category) => category.id), [
    'chatgpt',
    'claude',
    'gemini',
    'grok',
    'ai-coding',
    'ai-creative',
    'email',
    'verification',
    'social',
    'api-payment',
    'other',
  ]);
});

test('normalizes split source platforms into useful storefront categories', () => {
  assert.equal(classifyCatalogProduct(product('ChatGPT Plus 试用订阅', 'ChatGPT')), 'chatgpt');
  assert.equal(classifyCatalogProduct(product('Claude Max 20x', 'Claude')), 'claude');
  assert.equal(classifyCatalogProduct(product('Gemini Pro 成品号', 'Gemini')), 'gemini');
  assert.equal(classifyCatalogProduct(product('SuperGrok Heavy', 'Grok')), 'grok');
  assert.equal(classifyCatalogProduct(product('Cursor 账号', '其他')), 'ai-coding');
  assert.equal(classifyCatalogProduct(product('Kiro Pro / 额度号', '编程工具')), 'ai-coding');
  assert.equal(classifyCatalogProduct(product('Dreamina / 即梦', '其他')), 'ai-creative');
  assert.equal(classifyCatalogProduct(product('Outlook / Hotmail 邮箱', '其他')), 'email');
  assert.equal(classifyCatalogProduct(product('真人 / KYC 验证', '验证')), 'verification');
  assert.equal(classifyCatalogProduct(product('X Premium / 推特会员', '其他')), 'social');
  assert.equal(classifyCatalogProduct(product('OpenAI API 额度', 'API')), 'api-payment');
  assert.equal(classifyCatalogProduct(product('OpenAI / ChatGPT 接码', 'ChatGPT')), 'verification');
});

test('groups every product exactly once and keeps category options aligned', () => {
  const products = [
    product('ChatGPT Plus', 'ChatGPT'),
    product('Claude Pro', 'Claude'),
    product('Cursor 账号'),
    product('Gmail 邮箱'),
    product('无法识别的商品'),
  ];
  const groups = groupCatalogProducts(products);
  assert.equal(groups.flatMap((group) => group.products).length, products.length);
  assert.equal(new Set(groups.flatMap((group) => group.products.map((item) => item.id))).size, products.length);
  assert.deepEqual(groups.map((group) => group.category.id), ['chatgpt', 'claude', 'ai-coding', 'email', 'other']);
  assert.deepEqual(getCatalogCategoryOptions(products).map((option) => option.value), groups.map((group) => group.category.id));
});
