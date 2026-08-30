import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, ArrowRight, Calculator, Database, Newspaper, Search, Store, TrendingDown } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHARE_IMAGE } from '@/lib/site';
import { listAccountOpportunities } from '@/lib/legacy-radar';
import { getChannelProviderCount } from './actions';

const homeTitle = '爱窝啦·货源雷达 | AI账号货源、全网比价与每日商机';
const homeDescription = '聚合 AI 账号与数字商品货源、渠道报价、官方地区价格、价格异动和账号商机日报，让买家更快比价，让卖家更快找到可执行的利润机会。';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: ['AI订阅比价', 'AI订阅价格', '卡网渠道比价', 'ChatGPT Plus价格', 'Claude Pro价格', 'AI代充价格', '成品号价格'],
  alternates: { canonical: '/' },
  openGraph: { title: homeTitle, description: homeDescription, url: '/', type: 'website', images: [DEFAULT_SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: homeTitle, description: homeDescription, images: [DEFAULT_SHARE_IMAGE] },
};

export const dynamic = 'force-dynamic';

const faqItems = [
  { question: 'ChatGPT Plus 代充价格怎么查询？', answer: '在货源市场选择 ChatGPT 平台或搜索代充关键词，可查看公开报价、可购买状态、库存、更新时间和原始商品链接。' },
  { question: 'Claude Pro 成品号和代充有什么区别？', answer: '成品号通常交付已经开通订阅的账号；代充面向买家已有账号。账号归属、开通方式和售后边界不同，不能只比较价格。' },
  { question: 'AI 订阅比价应该看哪些信息？', answer: '至少同时核验商品类型、库存、更新时间、原始链接、售后说明和渠道稳定性。最低价只是一项信号。' },
  { question: '官方订阅不同地区价格在哪里看？', answer: '官方价格页比较 ChatGPT、Claude 和 Grok 在不同 App Store 地区的公开订阅价格，并区分月付与年付计划。' },
  { question: '卖家怎样判断一条货源值不值得卖？', answer: '先用商机日报确认需求与停止条件，再核验当前渠道报价，最后把支付费、退款、售后与获客成本放进利润计算器。' },
];

async function getHomeStats() {
  try {
    const [products, offers, opportunities] = await Promise.race([
      Promise.all([
        supabase.from('product_catalog').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('market_offers').select('id', { count: 'exact', head: true }).eq('status', 'in_stock'),
        listAccountOpportunities(),
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('home_stats_timeout')), 5_000)),
    ]);
    return { products: products.count || 0, offers: offers.count || 0, latestOpportunity: opportunities[0]?.report_date || '待更新' };
  } catch (error) {
    console.warn('Home statistics unavailable:', error instanceof Error ? error.message : 'unknown');
    return { products: 0, offers: 0, latestOpportunity: '待更新' };
  }
}

const buyerTasks = [
  { href: '/card-products', icon: Search, label: '按标准商品比价', detail: '先选 ChatGPT、Claude、Gemini、Grok 或 Cursor，再看同类货源。' },
  { href: '/card-products/all', icon: Database, label: '搜索全部渠道商品', detail: '按商品、店铺、平台和类目筛选海量原始报价。' },
  { href: '/official-prices', icon: TrendingDown, label: '比较官方地区价格', detail: '确认官方订阅与第三方代充是否真的存在价差。' },
];

const sellerTasks = [
  { href: '/opportunities', icon: Newspaper, label: '读取今日账号商机', detail: '看证据、买家需求、售后边界和明确停止条件。' },
  { href: '/changes', icon: Activity, label: '跟踪价格与库存异动', detail: '只展示连续有效快照确认的变化，不把首次采集当涨跌。' },
  { href: '/profit-calculator', icon: Calculator, label: '计算利润与保本价', detail: '把进货、支付、退款、售后和固定成本放进同一张账。' },
];

function TaskList({ title, description, tasks }: { title: string; description: string; tasks: typeof buyerTasks }) {
  return (
    <section className="radar-panel">
      <div className="radar-panel__head"><div><span className="radar-kicker">工作台</span><h2>{title}</h2></div><p className="hidden max-w-xs text-right text-xs leading-5 text-gray-500 sm:block">{description}</p></div>
      <div className="divide-y divide-gray-200">
        {tasks.map((task, index) => {
          const Icon = task.icon;
          return (
            <Link key={task.href} href={task.href} className="group grid grid-cols-[2rem_1fr_auto] items-start gap-3 px-5 py-5 transition-colors hover:bg-gray-50">
              <span className="font-mono text-xs text-gray-400">0{index + 1}</span>
              <span><strong className="flex items-center gap-2 text-base text-gray-950"><Icon className="h-4 w-4 text-amber-500" />{task.label}</strong><small className="mt-1 block max-w-xl text-sm leading-6 text-gray-500">{task.detail}</small></span>
              <ArrowRight className="mt-1 h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [platformCount, stats] = await Promise.all([getChannelProviderCount(), getHomeStats()]);
  const statItems = [
    ['渠道', platformCount.toLocaleString('zh-CN')],
    ['标准商品', stats.products.toLocaleString('zh-CN')],
    ['当前在售', stats.offers.toLocaleString('zh-CN')],
    ['最新商机', stats.latestOpportunity],
  ];

  return (
    <main className="radar-page">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }} />
      <div className="radar-shell py-8 sm:py-12">
        <header className="grid gap-8 border-b border-gray-300 pb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-end">
          <div>
            <span className="radar-kicker">Supply intelligence / Asia·Shanghai</span>
            <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.35rem,6vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.045em] text-gray-950">从全网货源到<br /><mark className="radar-highlight">可执行利润</mark></h1>
          </div>
          <div className="grid gap-5">
            <p className="text-base leading-7 text-gray-600">不再把货源列表和商机日报分开看。先确认需求，再比较渠道与官方价格，最后算清售后和退款之后真正能留下的钱。</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/card-products" className="inline-flex items-center gap-2 rounded-md bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">查看全网货源 <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/profit-calculator" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-950 hover:border-gray-500">测算一单利润</Link>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 border-b border-gray-300 sm:grid-cols-4" aria-label="当前数据规模">
          {statItems.map(([label, value]) => <div key={label} className="border-gray-300 py-5 pr-4 even:border-l even:pl-4 sm:border-l sm:first:border-l-0 sm:pl-5 sm:first:pl-0"><span className="block text-xs font-medium text-gray-500">{label}</span><strong className="mt-1 block font-mono text-xl tabular-nums text-gray-950 sm:text-2xl">{value}</strong></div>)}
        </section>

        <div className="grid gap-6 py-8 lg:grid-cols-2">
          <TaskList title="我要买：更快找到靠谱报价" description="从标准商品进入，保留原始链接和更新证据。" tasks={buyerTasks} />
          <TaskList title="我要卖：先判断利润和风险" description="商机不是结论，必须经过报价与成本验证。" tasks={sellerTasks} />
        </div>

        <section className="grid gap-6 border-y border-gray-300 py-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div><span className="radar-kicker">Decision loop / 04 steps</span><h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">把日报变成一条可复用的卖货流程</h2><p className="mt-3 text-sm leading-6 text-gray-600">每一步都可以回到公开证据。任一关键条件不成立，就暂停，而不是用低质量货源凑数量。</p></div>
          <ol className="divide-y divide-gray-300 border-y border-gray-300">
            {[['需求', '从账号商机日报确认谁会买、为什么现在买。'], ['货源', '核验同类商品、渠道库存、更新时间与原始页面。'], ['利润', '计算支付费、退款、售后、获客成本后的保本价。'], ['复盘', '跟踪价格与库存异动，达到停止条件立即下架或换货源。']].map(([title, text], index) => <li key={title} className="grid grid-cols-[2.5rem_5rem_1fr] gap-3 py-4 text-sm"><span className="font-mono text-gray-400">0{index + 1}</span><strong className="text-gray-950">{title}</strong><span className="leading-6 text-gray-600">{text}</span></li>)}
          </ol>
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div><span className="radar-kicker">Evidence rules</span><h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">这里聚合信息，不替第三方交易背书</h2></div>
          <div className="grid gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2"><p>价格、库存和售后可能随时变化。购买或上架前必须打开原始商品页复核；没有可靠报价时页面明确显示“暂无报价”。</p><p>官方价格、渠道货源和自营商品保持身份分离。低价不等于低风险，商机日报也不构成收益承诺。</p></div>
        </section>

        <section className="border-t border-gray-300 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="radar-kicker">FAQ</span><h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">开始比价前的五个问题</h2></div><Link href="/guide" className="text-sm font-semibold text-blue-700 hover:underline">阅读完整指南 →</Link></div>
          <div className="mt-6 divide-y divide-gray-300 border-y border-gray-300">
            {faqItems.map((item) => <details key={item.question} className="group py-4"><summary className="cursor-pointer list-none font-semibold text-gray-950 marker:hidden">{item.question}<span className="float-right font-mono text-gray-400 group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{item.answer}</p></details>)}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-300 border-t-2 border-t-amber-400 bg-white px-5 py-4 text-sm"><span className="text-gray-700">有稳定公开页面或结构化接口的货源方，可以提交审核；不接收卡密、账号密码和客户资料。</span><Link href="/submit" className="inline-flex items-center gap-2 font-semibold text-gray-950 hover:underline"><Store className="h-4 w-4 text-amber-500" />提交渠道</Link></div>
      </div>
    </main>
  );
}
