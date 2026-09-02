import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calculator, PackageSearch, Search } from 'lucide-react';
import { listCatalogSummaryProducts } from '@/lib/catalog-summary';
import { getAccountOpportunity } from '@/lib/legacy-radar';
import { publicOpportunityMarkdown } from '@/lib/opportunity-markdown';
import { findRelatedCatalogProducts, getProfitCalculatorHref } from '@/lib/supply-opportunity';
import { classifyCatalogProduct, getCatalogCategory } from '@/lib/catalog-taxonomy';
import { DEFAULT_SHARE_IMAGE, SITE_URL, absoluteUrl } from '@/lib/site';
import { STORE_ORGANIZATION_ID } from '@/lib/seo-geo';

export const revalidate = 300;

type PageProps = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const opportunity = await getAccountOpportunity(date);
  if (!opportunity) return { title: '商机日报未找到 | 爱窝啦·货源雷达', robots: { index: false } };
  return {
    title: `${opportunity.title} | 爱窝啦·货源雷达`,
    description: opportunity.description,
    alternates: { canonical: `/opportunities/${opportunity.report_date}` },
    openGraph: {
      type: 'article',
      title: opportunity.title,
      description: opportunity.description,
      publishedTime: opportunity.published_at,
      modifiedTime: opportunity.synced_at,
    },
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { date } = await params;
  const [opportunity, products] = await Promise.all([
    getAccountOpportunity(date),
    listCatalogSummaryProducts(),
  ]);
  if (!opportunity) notFound();
  const bodyMarkdown = publicOpportunityMarkdown(opportunity.body_markdown);
  const relatedProducts = findRelatedCatalogProducts(
    { ...opportunity, body_markdown: bodyMarkdown },
    products,
  );
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opportunity.title,
    description: opportunity.description,
    datePublished: opportunity.published_at,
    dateModified: opportunity.synced_at || opportunity.published_at,
    image: DEFAULT_SHARE_IMAGE,
    inLanguage: 'zh-CN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/opportunities/${opportunity.report_date}`) },
    author: { '@id': STORE_ORGANIZATION_ID },
    publisher: { '@id': STORE_ORGANIZATION_ID },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI账号货源', '卖家利润', '库存变化', '账号商机'],
  };

  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="h-4 w-4" /> 返回今日经营台
        </Link>

        <article className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <header
            data-account-daily-hero
            className="border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 dark:bg-zinc-900 dark:bg-none sm:p-9"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-emerald-700">
              <time dateTime={opportunity.published_at}>{opportunity.report_date} · AI 账号商机日报</time>
              <span className="text-xs font-medium text-gray-500">更新于 <time dateTime={opportunity.synced_at || opportunity.published_at}>{new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(opportunity.synced_at || opportunity.published_at))}</time></span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{opportunity.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">{opportunity.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/opportunities" className="rounded-full bg-gray-950 px-4 py-2.5 text-white hover:bg-gray-800">打开实时商机台</Link>
              <Link href="/profit-calculator" className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-blue-700 hover:border-blue-300">打开利润计算器</Link>
              <Link href="/opportunities/archive" className="px-2 py-2.5 text-blue-700 hover:text-blue-800">查看全部日报归档</Link>
            </div>
          </header>

          <div className="prose prose-gray max-w-none p-6 prose-a:text-blue-700 prose-headings:scroll-mt-24 prose-strong:text-gray-950 dark:prose-invert dark:prose-a:text-blue-400 dark:prose-strong:text-zinc-100 sm:p-9">
            <ReactMarkdown>{bodyMarkdown}</ReactMarkdown>
          </div>

          <section className="border-t border-gray-200 bg-gray-50 p-6 sm:p-9" data-opportunity-related-supply aria-labelledby="related-supply-title">
            <div className="flex items-start gap-3">
              <PackageSearch className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h2 id="related-supply-title" className="text-xl font-bold text-gray-950">复核正文中的当前货源</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">下面最多保留三个当前商品入口。价格和库存会变化，今天下单或接单前仍要打开原始页面。</p>
              </div>
            </div>

            {relatedProducts.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProducts.slice(0, 3).map((product) => {
                  const category = getCatalogCategory(classifyCatalogProduct(product));
                  return (
                    <article key={product.id} className="border-t-2 border-t-gray-950 bg-white p-4 ring-1 ring-gray-200">
                      <span className="text-xs font-semibold text-gray-500">{category.name}</span>
                      <h3 className="mt-1 font-bold text-gray-950">{product.name}</h3>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div><dt className="text-gray-500">当前目录最低价</dt><dd className="mt-0.5 font-mono font-semibold tabular-nums text-emerald-700">{product.lowestPrice === null ? '暂无报价' : `¥${product.lowestPrice.toFixed(2)}`}</dd></div>
                        <div><dt className="text-gray-500">可采购报价</dt><dd className="mt-0.5 font-mono font-semibold tabular-nums text-blue-700">{product.channelCount}</dd></div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold">
                        <Link href={`/card-products/${product.slug}`} data-opportunity-product-link className="text-emerald-700 hover:underline">核验货源 →</Link>
                        <Link href={getProfitCalculatorHref(product)} className="text-blue-700 hover:underline">带入成本算利润 →</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 border border-dashed border-gray-300 bg-white p-5 text-sm leading-6 text-gray-600">
                当前无法可靠匹配标准商品。请返回实时商机台，从库存、价格和渠道数据开始判断。
              </div>
            )}
          </section>
        </article>

        <aside className="mt-6 grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2" aria-label="把商机变成行动">
          <Link href="/profit-calculator" className="radar-action-link">
            <Calculator className="h-5 w-5 text-amber-500" />
            <span><strong>先算利润和保本价</strong><small>把进货、支付、退款与售后成本一起算清</small></span>
          </Link>
          <Link href="/card-products" className="radar-action-link">
            <Search className="h-5 w-5 text-blue-600" />
            <span><strong>再核验当前货源</strong><small>对比在售渠道、库存、更新时间与原始链接</small></span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
