import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calculator, ExternalLink, Search } from 'lucide-react';
import { getAccountOpportunity } from '@/lib/legacy-radar';

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

  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="h-4 w-4" /> 返回账号商机日报
        </Link>

        <article className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-9">
            <time dateTime={opportunity.report_date} className="text-sm font-semibold text-emerald-700">{opportunity.report_date} · 账号商机</time>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{opportunity.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">{opportunity.description}</p>
            <a href={opportunity.source_url} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800">
              查看日报原页 <ExternalLink className="h-4 w-4" />
            </a>
          </header>

          <div className="prose prose-gray max-w-none p-6 prose-a:text-blue-700 prose-headings:scroll-mt-24 prose-strong:text-gray-950 sm:p-9">
            <ReactMarkdown>{opportunity.body_markdown}</ReactMarkdown>
          </div>
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
