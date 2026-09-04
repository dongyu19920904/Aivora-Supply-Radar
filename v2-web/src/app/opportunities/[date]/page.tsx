import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AccountOpportunityDaily } from '@/components/AccountOpportunityDaily';
import { getAccountOpportunity } from '@/lib/legacy-radar';
import { parseAccountOpportunityReplayMetadata, parseAccountOpportunitySections } from '@/lib/opportunity-markdown';
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
  const opportunity = await getAccountOpportunity(date);
  if (!opportunity) notFound();
  const sections = parseAccountOpportunitySections(opportunity.body_markdown);
  const replay = parseAccountOpportunityReplayMetadata(opportunity.body_markdown);
  const primaryHref = replay?.productUrl || '/opportunities';
  const primaryLabel = replay?.decision === 'trial' ? '开始今天的任务' : '检查库存和已有订单';
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
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">{opportunity.title}</h1>
            {sections.enhanced ? (
              <>
                <div className="prose prose-sm mt-5 max-w-3xl break-words prose-a:text-blue-700 prose-strong:text-gray-950 dark:prose-invert dark:prose-a:text-blue-400 dark:prose-strong:text-white">
                  <ReactMarkdown>{sections.today}</ReactMarkdown>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href={primaryHref} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto dark:bg-white dark:text-gray-950">
                    {primaryLabel}<ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-xs leading-5 text-gray-600 dark:text-zinc-300">
                    {replay?.decision === 'trial'
                      ? `已核到 ${replay.verifiedSourceCount} 个不同货源站，付款前仍要再次确认库存。`
                      : '当前没有商品通过全部新手门槛，不要用低价或缺货商品凑数。'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-zinc-300">{opportunity.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  <Link href="/opportunities" className="rounded-full bg-gray-950 px-4 py-2.5 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950">打开实时商机台</Link>
                  <Link href="/profit-calculator" className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-blue-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-400">打开利润计算器</Link>
                  <Link href="/opportunities/archive" className="px-2 py-2.5 text-blue-700 hover:text-blue-800 dark:text-blue-400">查看全部日报归档</Link>
                </div>
              </>
            )}
          </header>

          <AccountOpportunityDaily reportDate={opportunity.report_date} sections={sections} metadata={replay} />
        </article>
      </div>
    </main>
  );
}
