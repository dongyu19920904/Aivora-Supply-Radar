import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, CalendarDays, Newspaper } from 'lucide-react';
import { listAccountOpportunities } from '@/lib/legacy-radar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 账号商机日报 | 爱窝啦·货源雷达',
  description: '每天核验 AI 账号、订阅、API、支付、额度与平台政策变化，并把公开证据转成卖家可执行动作与买家风险提示。',
  alternates: { canonical: '/opportunities' },
};

export default async function OpportunitiesPage() {
  const opportunities = await listAccountOpportunities();

  return (
    <main className="radar-page py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-gray-300 pb-8">
          <span className="radar-kicker inline-flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            货源之后的第二步
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">AI 账号商机日报</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
            价格低不等于能赚钱。这里把当天事实、供给形态、买家需求、可售动作、售后边界和停止条件放在一起，帮助卖家决定今天该做什么。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600">
            <span>只读复用现有日报</span><span>不增加大模型调用</span><span>失败不阻塞货源市场</span>
            <Link href="/profit-calculator" className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline"><Calculator className="h-4 w-4" />打开利润计算器</Link>
          </div>
        </header>

        <section className="mt-8 space-y-4" aria-label="账号商机日报列表">
          {opportunities.length ? opportunities.map((item) => (
            <article key={item.report_date} className="border-b border-gray-300 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={item.report_date}>{item.report_date}</time>
              </div>
              <h2 className="mt-3 text-xl font-bold text-gray-950 sm:text-2xl">
                <Link href={`/opportunities/${item.report_date}`} className="hover:text-emerald-700">{item.title}</Link>
              </h2>
              <p className="mt-3 leading-7 text-gray-600">{item.description}</p>
              <Link href={`/opportunities/${item.report_date}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                查看今天的执行动作与风险边界 <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              日报数据暂时不可用；货源、渠道和官方价格仍可正常使用，稍后会自动恢复。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
