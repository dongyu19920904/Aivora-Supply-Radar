import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { ProductType } from '../data';
import {
  getRetailStoreUrl,
  getSellerPlatformTopic,
  selectSellerPlatformProducts,
  sellerPlatformTopics,
  VERIFIED_RETAIL_PRODUCT_URLS,
} from './seo-geo';

function product(name: string, platform = '其他'): ProductType {
  return {
    id: name,
    slug: name.toLowerCase().replaceAll(' ', '-'),
    name,
    platform,
    lowestPrice: 10,
    warrantyPrice: 20,
    channelCount: 3,
    updatedAt: '2026-09-02T01:00:00.000Z',
    sort_order: 1,
  };
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('defines five unique seller platform landing pages', () => {
  assert.deepEqual(sellerPlatformTopics.map((topic) => topic.slug), [
    'chatgpt',
    'claude',
    'gemini',
    'grok',
    'ai-coding',
  ]);
  assert.equal(new Set(sellerPlatformTopics.map((topic) => topic.categoryId)).size, 5);
  assert.equal(getSellerPlatformTopic('chatgpt')?.name, 'ChatGPT');
  assert.equal(getSellerPlatformTopic('missing'), undefined);
});

test('selects only products that belong to the requested seller platform', () => {
  const products = [
    product('ChatGPT Plus', 'ChatGPT'),
    product('Claude Pro', 'Claude'),
    product('Cursor Pro 独享号', '编程工具'),
  ];

  assert.deepEqual(
    selectSellerPlatformProducts(products, { categoryId: 'chatgpt' }).map((item) => item.name),
    ['ChatGPT Plus'],
  );
  assert.deepEqual(
    selectSellerPlatformProducts(products, { categoryId: 'ai-coding' }).map((item) => item.name),
    ['Cursor Pro 独享号'],
  );
});

test('uses only verified retail product URLs and adds cross-site attribution', () => {
  for (const value of Object.values(VERIFIED_RETAIL_PRODUCT_URLS)) {
    const url = new URL(value);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'www.aivora.cn');
    assert.match(url.pathname, /^\/products\/[a-z0-9-]+$/);
  }

  const attributed = new URL(getRetailStoreUrl({
    content: 'product_chatgpt_plus',
    productSlug: 'chatgpt-plus-recharge',
  }));
  assert.equal(attributed.pathname, '/products/chong-zhi-xu-fei-yue-ka-1');
  assert.equal(attributed.searchParams.get('utm_source'), 'supply.aivora.cn');
  assert.equal(attributed.searchParams.get('utm_medium'), 'referral');
  assert.equal(attributed.searchParams.get('utm_campaign'), 'retail_handoff');
  assert.equal(attributed.searchParams.get('utm_content'), 'product_chatgpt_plus');
});

test('keeps platform pages crawlable, structured and listed in the sitemap', () => {
  const page = source('../app/platforms/[slug]/page.tsx');
  const sitemap = source('../app/sitemap.ts');
  assert.match(page, /CollectionPage/);
  assert.match(page, /ItemList/);
  assert.match(page, /BreadcrumbList/);
  assert.match(page, /alternates: \{ canonical: `\/platforms\/\$\{topic\.slug\}` \}/);
  assert.match(page, /<RetailStoreCta/);
  assert.match(sitemap, /sellerPlatformTopics/);
});

test('keeps one visible retail handoff per high-intent content block', () => {
  const productPage = source('../app/card-products/[slug]/page.tsx');
  const productClient = source('../app/card-products/[slug]/ProductDetailClient.tsx');
  const officialPage = source('../app/official-prices/[appId]/page.tsx');

  assert.doesNotMatch(productPage, /<YoufenkAffiliateAd/);
  assert.equal(productClient.match(/<YoufenkAffiliateBanner/g)?.length, 1);
  assert.doesNotMatch(officialPage, /<YoufenkAffiliateAd/);
  assert.equal(officialPage.match(/<YoufenkAffiliateBanner/g)?.length, 1);
});
