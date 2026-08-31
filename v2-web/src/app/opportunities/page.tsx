import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Calculator,
  CalendarDays,
  CircleAlert,
  ExternalLink,
  Layers3,
  Newspaper,
  PackageCheck,
  Search,
  Store,
} from 'lucide-react';

import { listCatalogSummaryProducts } from '@/lib/catalog-summary';
import { listAccountOpportunities, listPriceChanges } from '@/lib/legacy-radar';
import {
  buildSupplyOpportunityDashboard,
  getProfitCalculatorHref,
  supplySignalCategory,
  type SupplyOpportunitySignal,
} from '@/lib/supply-opportunity';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI 账号货源商机与风险 | 爱窝啦·货源雷达',
  description: '把当前可购买货源、最低价、渠道数量、价格与库存异动组合成可核验的账号货源线索，并保留行业日报作为辅助证据。',
  alternates: { canonical: '/opportunities' },
};

function formatPrice(value: number | null): string {
  return value === null ? '暂无报价' : `¥${value.toFixed(2)}`;
}

function formatShanghaiTime(value: string | null): string {
  if (!value) return '等待有效快照';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '等待有效快照';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

const toneClasses = {
  opportunity: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  warning: 'border-red-300 bg-red-50 text-red-800',
  watch: 'border-amber-300 bg-amber-50 text-amber-800',
} as const;

function SignalCard({ signal, index }: { signal: SupplyOpportunitySignal; index: number }) {
  return (
    <article data-supply-opportunity={signal.kind} className="border-t-2 border-t-gray-950 bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-gray-400">{String(index + 1).padStart(2, '0')}</span>
          <span className={`rounded border px-2 py-1 text-xs font-semibold ${toneClasses[signal.tone]}`}>{signal.label}</span>
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">{supplySignalCategory(signal)}</span>
        </div>
        <time dateTime={signal.observedAt || undefined} className="text-xs text-gray-500">快照 {formatShanghaiTime(signal.observedAt)}</time>
      </div>

      <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{signal.title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{signal.summary}</p>

      <div className="mt-4 border-l-2 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
        <strong>当前证据：</strong>{signal.evidence}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="border-t border-gray-200 pt-3"><dt className="font-semibold text-gray-950">买家怎么做</dt><dd className="mt-1 leading-6 text-gray-600">{signal.buyerAction}</dd></div>
        <div className="border-t border-gray-200 pt-3"><dt className="font-semibold text-gray-950">卖家怎么做</dt><dd className="mt-1 leading-6 text-gray-600">{signal.sellerAction}</dd></div>
        <div className="border-t border-gray-200 pt-3"><dt className="font-semibold text-red-800">停止条件</dt><dd className="mt-1 leading-6 text-gray-600">{signal.stopCondition}</dd></div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/card-products/${signal.product.slug}`} data-opportunity-product-link className="inline-flex items-center gap-1.5 rounded-md bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
          核验 {signal.product.name} 货源 <Search className="h-4 w-4" />
        </Link>
        <Link href={getProfitCalculatorHref(signal.product)} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 hover:border-gray-500">
          带入 {formatPrice(signal.product.lowestPrice)} 算利润 <Calculator className="h-4 w-4" />
        </Link>
        {signal.sourceUrl && (
          <a href={signal.sourceUrl} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1.5 px-1 py-2.5 text-sm font-semibold text-blue-700 hover:underline">
            查看异动原始页 <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export default async function OpportunitiesPage() {
  const [products, changes, opportunities] = await Promise.all([
    listCatalogSummaryProducts(),
    listPriceChanges(),
    listAccountOpportunities(),
  ]);
  const dashboard = buildSupplyOpportunityDashboard(products, changes);
  const statItems = [
    { label: '可购买商品', value: dashboard.stats.availableProductCount, detail: `共 ${dashboard.stats.productCount} 个标准商品` },
    { label: '可购买报价', value: dashboard.stats.availableOfferCount, detail: '按当前在售状态汇总' },
    { label: '24 小时异动', value: dashboard.stats.recentChangeCount, detail: '连续有效快照确认' },
    { label: '低供给观察', value: dashboard.stats.lowSupplyProductCount, detail: '仍需验证真实需求' },
  ];

  return (
    <main className="radar-page py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="grid gap-6 border-b border-gray-300 pb-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-end" data-opportunity-live-dashboard>
          <div>
            <span className="radar-kicker inline-flex items-center gap-2"><Activity className="h-4 w-4" />货源快照驱动 / 非收益承诺</span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">今天哪些 AI 账号货源值得看</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
              先看当前库存、最低价、渠道密度和真实异动，再决定是否采购或上架。这里给的是可核验线索，不把新闻热度、渠道数量或低价冒充销量与利润。
            </p>
          </div>
          <div className="border-l-2 border-amber-400 bg-white p-4 text-sm leading-6 text-gray-600">
            <strong className="block text-gray-950">最近有效快照</strong>
            <span>{formatShanghaiTime(dashboard.latestObservedAt)}（Asia/Shanghai）</span>
            <span className="mt-2 flex gap-2 text-xs text-gray-500"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />购买或接单前必须打开原始页面复核库存、规格、交付和售后。</span>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-px border-b border-gray-300 bg-gray-200 sm:grid-cols-4" aria-label="实时货源盘面">
          {statItems.map((item) => (
            <div key={item.label} className="bg-white px-4 py-5 sm:px-5">
              <span className="block text-xs font-medium text-gray-500">{item.label}</span>
              <strong className="mt-1 block font-mono text-2xl tabular-nums text-gray-950">{item.value.toLocaleString('zh-CN')}</strong>
              <small className="mt-1 block text-xs leading-5 text-gray-500">{item.detail}</small>
            </div>
          ))}
        </section>

        <section className="py-8" aria-labelledby="live-signals-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><span className="radar-kicker">Live supply signals</span><h2 id="live-signals-title" className="mt-2 text-2xl font-bold tracking-tight text-gray-950">当前货源线索与风险</h2></div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/changes" className="text-blue-700 hover:underline">查看全部异动 →</Link>
              <Link href="/card-products" className="text-emerald-700 hover:underline">打开分类货源 →</Link>
            </div>
          </div>

          {dashboard.signals.length ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {dashboard.signals.map((signal, index) => <SignalCard key={signal.id} signal={signal} index={index} />)}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              当前没有达到阈值的价格、库存或低供给线索。货源市场仍可正常使用，不会用旧新闻凑商机。
            </div>
          )}
        </section>

        <section className="border-y border-gray-300 py-8" data-opportunity-supply-map aria-labelledby="supply-map-title">
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <span className="radar-kicker inline-flex items-center gap-2"><Layers3 className="h-4 w-4" />分类供给地图</span>
              <h2 id="supply-map-title" className="mt-3 text-2xl font-bold tracking-tight text-gray-950">先看平台，再判断供给空档或红海</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">报价少不等于有需求，报价多也不等于不能卖。这里先把供给事实摆清楚，再用询问、成交和售后数据验证。</p>
            </div>
            <div className="overflow-x-auto border-y border-gray-300 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-3">平台分类</th><th className="px-4 py-3">商品</th><th className="px-4 py-3">可购买商品</th><th className="px-4 py-3">可购买报价</th><th className="px-4 py-3">最低价</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-4 py-3"><Link href={`/card-products#${category.id}`} className="font-semibold text-gray-950 hover:text-emerald-700">{category.name}</Link><small className="mt-0.5 block max-w-xs text-xs text-gray-500">{category.description}</small></td>
                      <td className="px-4 py-3 font-mono tabular-nums text-gray-700">{category.productCount}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-emerald-700">{category.availableProductCount}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-blue-700">{category.availableOfferCount}</td>
                      <td className="px-4 py-3 font-mono font-semibold tabular-nums text-gray-950">{formatPrice(category.lowestPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-8 lg:grid-cols-3" aria-label="从货源到利润的执行路径">
          {[
            { icon: Search, title: '1. 核验具体货源', text: '进入标准商品，确认可购买渠道、更新时间、原始链接、交付和售后。', href: '/card-products', link: '打开分类货源' },
            { icon: Calculator, title: '2. 计算真实利润', text: '把进货、支付、退款、售后和获客成本一起放进保本价。', href: '/profit-calculator', link: '打开利润计算器' },
            { icon: Store, title: '3. 小量验证再放大', text: '没有询问、交付不稳或利润不足就停止，不因“商机”两个字囤货。', href: '/guide/best-practices', link: '查看交易检查清单' },
          ].map((step) => {
            const Icon = step.icon;
            return <article key={step.title} className="border-t-2 border-t-amber-400 bg-white p-5 ring-1 ring-gray-200"><Icon className="h-5 w-5 text-amber-500" /><h3 className="mt-3 font-bold text-gray-950">{step.title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{step.text}</p><Link href={step.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">{step.link} <ArrowRight className="h-4 w-4" /></Link></article>;
          })}
        </section>

        <section className="border-t border-gray-300 pt-8" data-opportunity-industry-archive aria-labelledby="industry-signals-title">
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <span className="radar-kicker inline-flex items-center gap-2"><Newspaper className="h-4 w-4" />经营记录 / 日报归档</span>
              <h2 id="industry-signals-title" className="mt-3 text-2xl font-bold tracking-tight text-gray-950">日报记录当天判断，实时盘面决定今天动作</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">每期日报由当日货源、库存、报价和异动生成，并保留官方变化作为辅助证据。进入详情后会重新匹配当前商品，避免把历史判断当成今天的库存。</p>
              <Link href="/opportunities/archive" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">查看完整日报归档 <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="divide-y divide-gray-300 border-y border-gray-300">
              {opportunities.length ? opportunities.slice(0, 12).map((item) => (
                <article key={item.report_date} className="bg-white px-1 py-5 sm:px-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CalendarDays className="h-4 w-4" /><time dateTime={item.report_date}>{item.report_date}</time></div>
                  <h3 className="mt-2 text-lg font-bold text-gray-950"><Link href={`/opportunities/${item.report_date}`} className="hover:text-emerald-700">{item.title}</Link></h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                  <Link href={`/opportunities/${item.report_date}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">查看当日判断与当前货源 <ArrowRight className="h-4 w-4" /></Link>
                </article>
              )) : (
                <div className="bg-white p-6 text-sm text-gray-600">行业日报暂不可用；实时货源、分类供给地图和价格异动不受影响。</div>
              )}
            </div>
          </div>
        </section>

        <p className="mt-8 flex gap-2 border border-gray-300 bg-white p-4 text-xs leading-5 text-gray-500"><PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />本页只聚合公开可核验货源与连续快照，不参与第三方交易。价格和库存可能随时变化，最终以原始页面为准。</p>
      </div>
    </main>
  );
}
