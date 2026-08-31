import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, ShieldCheck } from 'lucide-react';
import { STORE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '企业与商用采购 - 爱窝啦·货源雷达',
  description: 'AI 订阅企业采购决策入口：比较官方价格、公开渠道、预算与售后边界。',
  alternates: { canonical: '/commercial' },
};

export default function CommercialPage() {
  return (
    <main className="market-page py-10 sm:py-16"><div className="market-shell">
      <header className="mx-auto max-w-3xl text-center"><span className="radar-kicker">Commercial buying</span><h1 className="market-display mt-3 text-4xl sm:text-6xl">企业与商用采购决策</h1><p className="mt-5 text-base leading-8 text-gray-600">先确定账号归属、席位、周期和售后，再比较官方方案与第三方货源。商用采购不能只按最低价下单。</p></header>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[['01', Building2, '定义使用方式', '确认个人订阅、团队席位、API 额度，以及账号和数据归属。'], ['02', BarChart3, '比较完整成本', '加入汇率、税费、支付、退款、续费和内部管理成本。'], ['03', ShieldCheck, '核验交付边界', '确认原始购买页面、供应主体、质保与异常处理方式。']].map(([number, Icon, title, text]) => { const ItemIcon = Icon as typeof Building2; return <article key={String(number)} className="market-card p-6"><span className="font-mono text-xs text-gray-400">{String(number)}</span><ItemIcon className="mt-6 h-5 w-5 text-emerald-700" /><h2 className="market-display mt-4 text-2xl">{String(title)}</h2><p className="mt-3 text-sm leading-7 text-gray-600">{String(text)}</p></article>; })}
      </section>
      <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="market-display text-2xl">从可核验数据开始</h2><p className="mt-2 text-sm leading-6 text-gray-600">先看官方地区价格与第三方报价；如需人工采购支持，再联系爱窝啦·AI账号店。</p></div><div className="flex flex-wrap gap-2"><Link href="/official-prices" className="market-pill market-pill--secondary">比较官方价格</Link><a href={STORE_URL} target="_blank" rel="noopener" className="market-pill market-pill--primary">联系采购支持<ArrowRight className="h-4 w-4" /></a></div></section>
    </div></main>
  );
}
