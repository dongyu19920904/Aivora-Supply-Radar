import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { AccountOpportunityDaily } from '@/components/AccountOpportunityDaily';
import { parseAccountOpportunityReplayMetadata, parseAccountOpportunitySections } from '@/lib/opportunity-markdown';
import { SITE_URL } from '@/lib/site';
import fixture from '@/fixtures/merchant-editorial-preview.json';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '账号日报编辑验收预览', robots: { index: false, follow: false }, alternates: { canonical: '/opportunities/editorial-preview' } };

export default function EditorialPreview() {
  if (SITE_URL !== 'https://aivora-supply-radar-v2-preview.sabrinamisan090.workers.dev') notFound();
  const sections = parseAccountOpportunitySections(fixture.body);
  return <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: fixture.title, datePublished: `${fixture.date}T00:00:00+08:00` }) }} />
    <article className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <header data-account-daily-hero className="border-b border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 dark:bg-zinc-900 dark:bg-none sm:p-9">
        <p className="text-sm text-gray-600 dark:text-zinc-300">仅预览验收 · 不写生产归档</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-950 dark:text-white sm:text-4xl">{fixture.title}</h1>
        <div className="prose prose-sm mt-5 dark:prose-invert"><ReactMarkdown>{sections.today}</ReactMarkdown></div>
        <a href="#merchant-task" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-gray-950 px-5 py-3 font-semibold text-white dark:bg-white dark:text-gray-950">开始今天的任务</a>
      </header>
      <AccountOpportunityDaily reportDate={fixture.date} sections={sections} metadata={parseAccountOpportunityReplayMetadata(fixture.body)} />
    </article>
  </div></main>;
}
