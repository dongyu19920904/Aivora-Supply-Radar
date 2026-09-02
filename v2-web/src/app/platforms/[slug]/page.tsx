import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock3, PackageCheck, PackageSearch, Store } from 'lucide-react';

import { JsonLd } from '@/components/JsonLd';
import { RetailStoreCta } from '@/components/RetailStoreCta';
import { listCatalogSummaryProducts } from '@/lib/catalog-summary';
import { hasActiveCatalogOffer, sortCatalogProducts } from '@/lib/product-ranking';
import {
  getRetailStoreUrl,
  getSellerPlatformTopic,
  selectSellerPlatformProducts,
  sellerPlatformTopics,
  STORE_ORGANIZATION_ID,
} from '@/lib/seo-geo';
import { DEFAULT_SHARE_IMAGE, SITE_URL, absoluteUrl } from '@/lib/site';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

function latestTimestamp(values: Array<string | null>): string | null {
  return values
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] || null;
}

function formatShanghaiDateTime(value: string | null): string {
  if (!value) return '等待下一次有效报价';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function generateStaticParams() {
  return sellerPlatformTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getSellerPlatformTopic(slug);
  if (!topic) return { title: '平台货源未找到 | 爱窝啦·货源雷达', robots: { index: false } };

  const title = `${topic.title} | 爱窝啦·货源雷达`;
  return {
    title,
    description: topic.description,
    keywords: [`${topic.name}货源`, `${topic.name}账号货源`, `${topic.name}订阅价格`, 'AI账号卖家', 'AI账号进货'],
    alternates: { canonical: `/platforms/${topic.slug}` },
    openGraph: {
      title,
      description: topic.description,
      url: `/platforms/${topic.slug}`,
      type: 'website',
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: topic.description,
      images: [DEFAULT_SHARE_IMAGE],
    },
  };
}

export default async function SellerPlatformPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getSellerPlatformTopic(slug);
  if (!topic) notFound();

  const allProducts = await listCatalogSummaryProducts();
  const products = sortCatalogProducts(
    selectSellerPlatformProducts(allProducts, topic),
    'recommended',
  );
  const availableProducts = products.filter(hasActiveCatalogOffer);
  const offerCount = products.reduce((sum, product) => sum + Math.max(0, product.channelCount || 0), 0);
  const lowestPrice = products
    .map((product) => product.lowestPrice)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
    .sort((left, right) => left - right)[0] || null;
  const updatedAt = latestTimestamp(products.map((product) => product.updatedAt));
  const pageUrl = absoluteUrl(`/platforms/${topic.slug}`);
  const retailUrl = getRetailStoreUrl({
    content: `platform_${topic.slug}`,
    productSlug: topic.retailProductSlug,
  });

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: topic.title,
        description: topic.description,
        inLanguage: 'zh-CN',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: { '@id': STORE_ORGANIZATION_ID },
        audience: { '@type': 'BusinessAudience', audienceType: 'AI账号卖家和数字商品渠道商' },
        dateModified: updatedAt || undefined,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: products.length,
          itemListElement: products.slice(0, 20).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebPage',
              name: product.name,
              description: product.shortDesc || undefined,
              url: absoluteUrl(`/card-products/${product.slug}`),
              about: topic.name,
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '订阅货源', item: absoluteUrl('/card-products') },
          { '@type': 'ListItem', position: 2, name: topic.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="market-page py-10 sm:py-14">
      <JsonLd data={schema} />
      <div className="market-shell">
        <nav aria-label="面包屑" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Link href="/card-products" className="font-semibold text-blue-700 hover:underline">订阅货源</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{topic.name}</span>
        </nav>

        <header className="grid gap-7 border-b border-gray-200 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <span className="radar-kicker">Seller platform intelligence</span>
            <h1 className="market-display mt-3 max-w-4xl text-4xl sm:text-6xl">{topic.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600">{topic.answer}</p>
          </div>
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
            <div className="bg-white p-4"><dt className="text-xs text-gray-500">标准商品</dt><dd className="mt-2 font-mono text-2xl font-bold tabular-nums text-gray-950">{products.length}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs text-gray-500">当前可采购</dt><dd className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">{availableProducts.length}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs text-gray-500">公开报价</dt><dd className="mt-2 font-mono text-2xl font-bold tabular-nums text-blue-700">{offerCount}</dd></div>
            <div className="bg-white p-4"><dt className="text-xs text-gray-500">当前最低参考</dt><dd className="mt-2 font-mono text-xl font-bold tabular-nums text-gray-950">{lowestPrice === null ? '暂无' : `¥${lowestPrice.toFixed(2)}`}</dd></div>
          </dl>
        </header>

        <section className="py-10" aria-labelledby="platform-products-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="radar-kicker">Live snapshot</span>
              <h2 id="platform-products-title" className="market-display mt-2 text-3xl">当前 {topic.name} 标准商品</h2>
            </div>
            <time dateTime={updatedAt || undefined} className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              最近报价 {formatShanghaiDateTime(updatedAt)}
            </time>
          </div>

          {products.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {products.map((product) => {
                const available = hasActiveCatalogOffer(product);
                return (
                  <article key={product.id} className="market-card flex flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${available ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                        {available ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageSearch className="h-3.5 w-3.5" />}
                        {available ? '当前可采购' : '暂无可采购报价'}
                      </span>
                      <span className="font-mono text-xs text-gray-400">{product.channelCount} 条报价</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-950">{product.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{product.shortDesc || `查看 ${product.name} 的公开货源、库存和更新时间。`}</p>
                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-gray-200 pt-4">
                      <div><span className="block text-xs text-gray-500">有货最低参考</span><strong className="mt-1 block font-mono text-xl tabular-nums text-emerald-700">{product.lowestPrice === null ? '暂无报价' : `¥${product.lowestPrice.toFixed(2)}`}</strong></div>
                      <Link href={`/card-products/${product.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">核验全部货源<ArrowRight className="h-4 w-4" /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm leading-7 text-gray-600">
              当前无法读取该平台的标准商品。货源目录仍可使用，页面不会用其他平台商品补位。
            </div>
          )}
        </section>

        <section className="grid gap-4 border-y border-gray-200 py-10 md:grid-cols-3" aria-labelledby="platform-checkpoints-title">
          <h2 id="platform-checkpoints-title" className="sr-only">{topic.name} 卖家核价重点</h2>
          {topic.checkpoints.map((item, index) => (
            <article key={item.title} className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <span className="font-mono text-xs text-emerald-700">0{index + 1}</span>
              <h3 className="mt-3 font-bold text-gray-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
            <Store className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-gray-950">卖家下一步</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">进入标准商品页检查全部原始报价。接单前再把采购、支付、退款、人工和售后成本带入利润计算器。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/card-products#${topic.categoryId}`} className="market-pill market-pill--primary">查看全部 {topic.name} 货源<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/profit-calculator" className="market-pill market-pill--secondary">打开利润计算器</Link>
            </div>
          </div>
          <RetailStoreCta href={retailUrl} compact />
        </section>
      </div>
    </main>
  );
}
