import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Calculator,
  Code2,
  Database,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  TrendingDown,
} from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHARE_IMAGE } from '@/lib/site';
import { listAccountOpportunities } from '@/lib/legacy-radar';
import { getChannelProviderCount } from './actions';

const homeTitle = '爱窝啦·货源雷达 | AI账号货源、订阅比价与商家经营日报';
const homeDescription = '聚合 AI 账号与订阅货源、渠道报价、官方地区价格、库存变化和账号商机日报，让买家更快找到可售报价，让卖家算清真实利润。';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: ['AI订阅比价', 'AI账号货源', 'ChatGPT Plus价格', 'Claude Pro价格', 'AI代充价格', '成品号价格'],
  alternates: { canonical: '/' },
  openGraph: { title: homeTitle, description: homeDescription, url: '/', type: 'website', images: [DEFAULT_SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: homeTitle, description: homeDescription, images: [DEFAULT_SHARE_IMAGE] },
};

export const dynamic = 'force-dynamic';

const faqItems = [
  { question: '怎样最快找到 ChatGPT Plus 可购买货源？', answer: '进入订阅货源，ChatGPT 默认排在分类首位；同一标准商品内先显示可购买报价，再比较价格、库存、更新时间和售后说明。' },
  { question: '为什么最低价不一定最值得买？', answer: '低价可能对应共享、短保、低库存或很久未更新的商品。购买前至少同时核验交付类型、库存、更新时间、原始链接和售后边界。' },
  { question: '官方价格和第三方货源有什么区别？', answer: '官方价格页用于判断地区与周期差价；第三方货源来自公开渠道。两者身份分离，第三方低价不代表官方授权或风险更低。' },
  { question: '商家经营日报怎样使用实时货源？', answer: '日报把需求信号与当前可售报价、库存、价差和停止条件放在一起。卖家可以继续进入商品页核验货源，再用利润计算器测算。' },
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

const entryPaths = [
  {
    href: '/card-products',
    icon: Sparkles,
    eyebrow: '新手买订阅',
    title: '按标准商品找货',
    description: 'ChatGPT、Claude 等热门平台已经归类。同一商品集中比价，不必在几千条标题中碰运气。',
    action: '选择订阅商品',
  },
  {
    href: '/card-products/all',
    icon: Tags,
    eyebrow: '熟悉货源市场',
    title: '搜索全部原始报价',
    description: '需要代充、成品号、共享或冷门规格时，直接按平台、渠道、库存和关键词筛选。',
    action: '搜索全部报价',
  },
  {
    href: '/opportunities/latest',
    icon: BadgeDollarSign,
    eyebrow: 'AI账号卖家',
    title: '从今日商机开始经营',
    description: '把需求、实时可售货源、利润空间和停止条件放在一起，先算清楚再上架。',
    action: '查看账号商机日报',
  },
];

const modules = [
  { href: '/card-products', icon: Database, title: '第三方订阅货源', text: '标准商品聚合、库存优先、原始报价可核验。' },
  { href: '/official-prices', icon: TrendingDown, title: '官方地区价格', text: '比较官方月付、年付与地区定价，识别真实价差。' },
  { href: '/channels', icon: Store, title: '渠道商目录', text: '查看来源覆盖和在售商品，减少重复寻找渠道。' },
  { href: '/profit-calculator', icon: Calculator, title: '卖家利润工具', text: '把进货、支付费、退款、售后和获客成本算在一起。' },
];

export default async function HomePage() {
  const [platformCount, stats] = await Promise.all([getChannelProviderCount(), getHomeStats()]);
  const statItems = [
    ['公开渠道', platformCount.toLocaleString('zh-CN')],
    ['标准商品', stats.products.toLocaleString('zh-CN')],
    ['当前可售报价', stats.offers.toLocaleString('zh-CN')],
    ['日报日期', stats.latestOpportunity],
  ];

  return (
    <main className="market-page">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }} />

      <section className="market-shell grid gap-7 pb-14 pt-12 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 公开货源持续更新</span>
          <h1 className="market-display mt-6 max-w-4xl text-[clamp(2.7rem,7vw,5.8rem)]">找货、比价、<br />算利润</h1>
        </div>
        <div className="pb-1">
          <p className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">为 AI 订阅买家和账号卖家整理公开货源。先找到真正可购买的商品，再核验库存、价格、售后与利润。</p>
          <div className="mt-7 flex flex-wrap items-center gap-3"><Link href="/card-products" className="market-pill market-pill--primary"><Search className="h-4 w-4" />开始找货</Link><Link href="/opportunities/latest" className="market-pill market-pill--secondary"><Newspaper className="h-4 w-4" />看今日账号商机日报</Link></div>
        </div>
      </section>

      <section className="market-shell pb-14" aria-labelledby="choose-path">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="text-left"><span className="radar-kicker">Choose a path</span><h2 id="choose-path" className="market-display mt-2 text-2xl sm:text-3xl">你现在想解决什么？</h2></div>
          <span className="hidden text-sm text-gray-500 sm:block">三条路径都使用同一份实时货源数据</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          {entryPaths.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`market-card group flex flex-col p-6 transition-colors hover:border-emerald-400 sm:p-7 ${index === 0 ? 'lg:col-span-7 lg:row-span-2 lg:min-h-[32rem]' : 'lg:col-span-5 lg:min-h-[15.5rem]'}`}>
                <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-gray-400">0{index + 1}</span></div>
                <span className="mt-7 text-xs font-semibold text-emerald-700">{item.eyebrow}</span>
                <h3 className="market-display mt-2 text-2xl">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gray-950 group-hover:text-emerald-700">{item.action}<ArrowRight className="h-4 w-4" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white/75 py-12 sm:py-16">
        <div className="market-shell">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><span className="radar-kicker">Live marketplace</span><h2 className="market-display mt-3 text-3xl sm:text-4xl">数据规模不等于可用，<br />可购买才排在前面</h2><p className="mt-4 max-w-lg text-sm leading-7 text-gray-600">目录保留完整商品，但分类内优先展示有库存、有有效报价的项目。无法确认的数据不会伪装成零元或有货。</p></div>
            <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:grid-cols-4">
              {statItems.map(([label, value]) => <div key={label} className="bg-white px-4 py-5 text-left sm:px-5"><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-2 break-words font-mono text-xl font-bold tabular-nums text-gray-950">{value}</dd></div>)}
            </dl>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="group bg-white p-6 hover:bg-emerald-50/40"><Icon className="h-5 w-5 text-emerald-700" /><h3 className="mt-5 font-bold text-gray-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{item.text}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">打开模块 <ArrowRight className="h-3.5 w-3.5" /></span></Link>; })}
          </div>
        </div>
      </section>

      <section className="market-shell grid gap-8 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
        <div><span className="radar-kicker">Merchant daily</span><h2 className="market-display mt-3 text-3xl sm:text-4xl">新手看第一单，<br />老商家看开盘单</h2><p className="mt-4 max-w-lg text-sm leading-7 text-gray-600">日报每天只保留可执行商品、成本口径、停止条件和收盘复盘。完整分类与全部异动继续放在实时商机台。</p><Link href="/opportunities/latest" className="market-pill market-pill--primary mt-6">打开今日账号商机日报<ArrowRight className="h-4 w-4" /></Link></div>
        <ol className="market-card divide-y divide-gray-200 px-5 sm:px-7">
          {[
            [Bot, '确认需求', '看买家是谁、为什么现在需要，以及证据日期。'],
            [Database, '核验货源', '打开关联商品，确认可售报价、库存、更新时间和原页。'],
            [Calculator, '测算利润', '加入支付、退款、售后、获客成本，得到保本价。'],
            [Code2, '设置停止条件', '库存失效、价格倒挂或证据过期时立即暂停。'],
          ].map(([Icon, title, text], index) => {
            const StepIcon = Icon as typeof Bot;
            return <li key={String(title)} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 sm:grid-cols-[2.5rem_8rem_1fr] sm:items-center"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700"><StepIcon className="h-4 w-4" /></span><strong className="text-sm text-gray-950"><span className="mr-2 font-mono text-xs text-gray-400">0{index + 1}</span>{String(title)}</strong><span className="text-sm leading-6 text-gray-600">{String(text)}</span></li>;
          })}
        </ol>
      </section>

      <section className="border-y border-gray-200 bg-white py-12">
        <div className="market-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div><span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><ShieldCheck className="h-5 w-5" /></span><h2 className="market-display mt-5 text-3xl">公开信息有边界</h2></div>
          <div className="grid gap-5 text-sm leading-7 text-gray-600 sm:grid-cols-2"><p>本站聚合公开页面，不代收货款、不保管账号、不替第三方交易背书。购买前必须打开原始商品页复核。</p><p>价格、库存、交付和售后可能变化。暂无可靠报价时明确显示“暂无报价”，不会用无关商品或虚构数据补位。</p></div>
        </div>
      </section>

      <section className="market-shell py-14">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="radar-kicker">FAQ</span><h2 className="market-display mt-2 text-3xl">开始交易前先问清楚</h2></div><Link href="/guide" className="text-sm font-bold text-blue-700 hover:underline">阅读完整购买指南 →</Link></div>
        <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">{faqItems.map((item) => <details key={item.question} className="group py-5"><summary className="cursor-pointer list-none font-semibold text-gray-950 marker:hidden">{item.question}<span className="float-right font-mono text-gray-400 group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">{item.answer}</p></details>)}</div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center"><div><strong className="text-gray-950">你有稳定且可公开核验的货源？</strong><p className="mt-1 text-sm text-gray-600">提交公开 HTTPS 页面或结构化接口，审核通过后进入渠道目录。</p></div><Link href="/submit" className="market-pill market-pill--secondary"><Store className="h-4 w-4" />提交渠道</Link></div>
      </section>
    </main>
  );
}
