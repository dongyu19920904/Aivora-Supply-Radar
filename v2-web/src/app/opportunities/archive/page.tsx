import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { listAccountOpportunityArchive } from '@/lib/legacy-radar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 账号商家经营日报归档 | 爱窝啦·货源雷达',
  description: '按日期查看由实时货源、库存、报价与价格异动生成的 AI 账号商家经营日报。',
  alternates: { canonical: '/opportunities/archive' },
};

type PageProps = { searchParams: Promise<{ page?: string }> };

function pageHref(page: number): string {
  return page <= 1 ? '/opportunities/archive' : `/opportunities/archive?page=${page}`;
}

export default async function AccountOpportunityArchivePage({ searchParams }: PageProps) {
  const query = await searchParams;
  const requestedPage = Number.parseInt(query.page || '1', 10);
  const archive = await listAccountOpportunityArchive(requestedPage, 24);
  const currentPage = Math.min(archive.page, archive.totalPages);

  return (
    <main className="radar-page py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="h-4 w-4" /> 返回今日经营台
        </Link>

        <header className="mt-6 border-b border-gray-300 pb-7">
          <span className="radar-kicker">Merchant daily archive</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">AI 账号商家经营日报归档</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
            共保留 {archive.total.toLocaleString('zh-CN')} 期。每一期记录当日货源盘面与经营动作；采购和接单前仍须回到当前商品页复核库存、规格、交付与售后。
          </p>
        </header>

        <section className="divide-y divide-gray-300 border-y border-gray-300" aria-label="经营日报归档">
          {archive.items.length ? archive.items.map((item) => (
            <article key={item.report_date} className="bg-white px-2 py-6 sm:px-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={item.report_date}>{item.report_date}</time>
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-950">
                <Link href={`/opportunities/${item.report_date}`} className="hover:text-emerald-700">{item.title}</Link>
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              <Link href={`/opportunities/${item.report_date}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
                查看当日判断与当前货源 <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )) : (
            <div className="bg-white p-8 text-center text-sm text-gray-600">归档暂不可用；今日实时货源经营台不受影响。</div>
          )}
        </section>

        {archive.totalPages > 1 && (
          <nav className="mt-7 flex items-center justify-between gap-4" aria-label="归档分页">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} className="market-pill market-pill--secondary"><ChevronLeft className="h-4 w-4" />上一页</Link>
            ) : <span />}
            <span className="text-sm font-semibold text-gray-600">第 {currentPage} / {archive.totalPages} 页</span>
            {currentPage < archive.totalPages ? (
              <Link href={pageHref(currentPage + 1)} className="market-pill market-pill--secondary">下一页<ChevronRight className="h-4 w-4" /></Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
