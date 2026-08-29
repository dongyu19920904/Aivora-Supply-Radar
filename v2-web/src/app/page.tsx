import React from 'react';
import Link from 'next/link';
import { Search, Store, Zap, ArrowRight, Sparkles, TrendingDown, Newspaper, Activity } from 'lucide-react';
import { PlatformCountBadge } from '../components/PlatformCountBadge';
import { SubmitChannelButton } from '../components/SubmitChannelButton';
import { getChannelProviderCount } from './actions';
import type { Metadata } from 'next';
import { DEFAULT_SHARE_IMAGE } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';

const homeTitle = '爱窝啦·货源雷达 | AI账号货源、全网比价与每日商机';
const homeDescription = '聚合 AI 账号与数字商品货源、渠道报价、官方地区价格、价格异动和账号商机日报，让买家更快比价，让卖家更快找到可执行的利润机会。';

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: ['AI订阅比价', 'AI订阅价格', '卡网渠道比价', 'ChatGPT Plus价格', 'Claude Pro价格', 'AI代充价格', '成品号价格'],
  alternates: { canonical: '/' },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: '/',
    type: 'website',
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [DEFAULT_SHARE_IMAGE],
  },
};

export const dynamic = 'force-dynamic';

const faqItems = [
  {
    question: 'ChatGPT Plus 代充价格怎么查询？',
    answer: '可以在 爱窝啦·货源雷达 的卡网商品聚合页查看 ChatGPT Plus 代充相关报价。页面按价格排序，并展示库存、更新时间和渠道信息，方便对比不同卡网渠道的 AI 订阅价格。',
  },
  {
    question: 'Claude Pro 成品号和代充有什么区别？',
    answer: '成品号通常是已经开通订阅的账号，代充通常面向已有账号的充值服务。两者在账号归属、售后方式和风险上不同，购买前建议先查看每种卡网渠道的服务说明。',
  },
  {
    question: 'AI 订阅比价应该看哪些信息？',
    answer: '除了价格，还应该看商品类型、订阅来源和售后说明。爱窝啦·货源雷达 只聚合公开报价，不参与交易，用户需要自行甄别渠道和商品规则。',
  },
  {
    question: '官方订阅不同地区价格在哪里看？',
    answer: '爱窝啦·货源雷达 的官方订阅价格页会对比 ChatGPT、Claude、Grok 等应用在不同 App Store 国家和地区的订阅价格，适合对自己的账号进行充值的场景。',
  },
  {
    question: '卡网渠道报价会实时变化吗？',
    answer: '会。卡网渠道商品的价格、库存和上下架状态可能频繁变化，爱窝啦·货源雷达 会持续聚合公开 AI 订阅产品的渠道报价，展示最新的渠道报价。',
  },
  {
    question: '爱窝啦·货源雷达 会销售 AI 订阅或账号吗？',
    answer: '货源雷达本身只做公开价格整理、聚合和比价展示，不处理第三方交易；爱窝啦自营商品会以独立入口清楚标注，不参与全网报价排序。',
  },
];

export default async function HomePage() {
  const platformCount = await getChannelProviderCount();

  return (
    <main className="min-h-screen bg-gray-50/50">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }} />
      {/* Background decoration */}
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-gray-50/20 to-transparent"></div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
          <PlatformCountBadge count={platformCount} href="/channels" />
          
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-20 pt-8">
            <div className="inline-flex items-center justify-center rounded-full bg-emerald-100/80 px-4 py-1.5 text-sm font-semibold text-emerald-800 mb-8 shadow-sm backdrop-blur-sm border border-emerald-200">
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
              AI 账号货源、比价、异动与商机平台
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-7 leading-[1.15]">
              找货源、看行情、抓商机<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">把价格信息变成今天能做的生意</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              聚合 ChatGPT、Claude、Gemini、Grok、Cursor 等 AI 产品的公开货源和官方地区价格，再结合价格异动与账号商机日报，帮助买家少花冤枉钱，也帮助卖家判断什么值得卖、怎么卖、什么时候停止。
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-5 py-4 rounded-2xl mb-10 max-w-2xl mx-auto flex items-start text-left shadow-sm">
              <span className="text-xl mr-3 leading-none">⚠️</span>
              <p className="leading-relaxed"><strong>免责声明：</strong>本网站仅提供全网卡网渠道价格的客观聚合展示，不对任何第三方产品的质量负责。购买前请仔细甄别，并遵循原商品发布平台的规则与质保条款。</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/card-products" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5"
              >
                浏览全网货源 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/opportunities"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5"
              >
                看今日账号商机 <Newspaper className="ml-2 h-5 w-5" />
              </Link>
              <SubmitChannelButton 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5"
              >
                提交渠道免费收录 <Store className="ml-2 h-5 w-5 text-gray-500" />
              </SubmitChannelButton>
            </div>
          </div>

          {/* Features / Value Props Section */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto mt-16">
            
            {/* Card 1: For Buyers */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                <TrendingDown className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">卡网渠道 AI 订阅比价</h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                  查询 ChatGPT Plus 代充、Claude Pro 成品号、Gemini、Grok、Cursor 等 AI 订阅卡网渠道的最新价格，一站式比价。
                </p>
                <Link href="/card-products" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                  查看 AI 订阅比价 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Card 2: Official subscriptions */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-6 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">官方订阅地区价格</h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                  查看 ChatGPT、Claude 和 Grok 在不同 App Store 国家和地区的官方订阅价格，快速找到官方订阅的低价区。
                </p>
                <Link href="/official-prices" className="inline-flex items-center text-sm font-semibold text-orange-600 hover:text-orange-700">
                  查看官方订阅 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Card 3: Opportunities */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                <Newspaper className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Newspaper className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">账号商机日报</h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                  把当天 AI 账号、订阅、API、支付和政策信号转成可执行动作，写清证据、买家需求、售后边界和停止条件。
                </p>
                <Link href="/opportunities" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  查看今日商机 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Card 4: User Experience */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                <Zap className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">渠道商免费收录</h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                  支持链动小铺、独角数卡、二次元发卡等常见发卡系统，也支持自建商城按规范接入。
                </p>
                <SubmitChannelButton
                  className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  提交渠道 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </SubmitChannelButton>
              </div>
            </div>

          </div>

          <section className="mt-16 rounded-3xl border border-gray-200 bg-gray-950 px-6 py-9 text-white shadow-xl sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><Activity className="h-4 w-4" />真正能赚钱的闭环</span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">不是堆几千条链接，而是让每条数据回答下一步</h2>
                <p className="mt-4 leading-7 text-gray-300">先从货源市场确认供给与成本，再看价格和库存异动，接着用账号商机判断真实需求，最后把可售动作、毛利、售后和停止条件落到当天。</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/changes" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-100">查看价格异动 <ArrowRight className="h-4 w-4" /></Link>
                  <Link href="/opportunities" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">查看账号商机 <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {[
                  ['1', '找货源', '确认商品、渠道、库存与公开原文'],
                  ['2', '算空间', '比较成本、官方价与全网报价'],
                  ['3', '看信号', '核验需求、政策、额度和价格变化'],
                  ['4', '做动作', '上架、优化、观察或明确停止'],
                ].map(([step, title, description]) => (
                  <li key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-xs font-bold text-emerald-300">STEP {step}</span>
                    <h3 className="mt-1 font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mt-16 border-t border-gray-200 pt-12">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                为什么不同渠道的 AI 订阅价格差别很大？
              </h2>
              <p className="text-gray-600 leading-relaxed">
                ChatGPT Plus、Claude Pro、Gemini、Grok、Cursor 等 AI 订阅的价格，不仅取决于产品本身，还与购买方式、订阅地区和渠道的供货成本有关。比价前先确认商品类型和服务内容，才能判断哪个报价更适合自己。
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 border-y border-gray-200 md:grid-cols-3 md:divide-x md:divide-gray-200">
              <div className="py-6 md:pr-8">
                <h3 className="font-semibold text-gray-900 mb-2">购买方式不同</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  官方订阅、代充和成品号提供的服务并不相同，在账号归属、开通方式和售后保障上也有区别，因此不能只比较价格。购买前可先了解
                  <Link href="/guide/official-vs-card-products" className="font-medium text-blue-600 hover:text-blue-700">官方订阅与卡网渠道的区别</Link>。
                </p>
              </div>
              <div className="border-t border-gray-200 py-6 md:border-t-0 md:px-8">
                <h3 className="font-semibold text-gray-900 mb-2">订阅地区不同</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  同一款 AI 工具在不同国家和地区可能采用不同的官方定价，结算货币、税费以及月付或年付方案也会影响最终支出。你可以通过
                  <Link href="/official-prices" className="font-medium text-orange-600 hover:text-orange-700">官方订阅地区价格</Link>查看具体差异。
                </p>
              </div>
              <div className="border-t border-gray-200 py-6 md:border-t-0 md:pl-8">
                <h3 className="font-semibold text-gray-900 mb-2">渠道报价不同</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  不同卡网商家的进货成本、库存和促销活动不同，报价也会随之变化。爱窝啦·货源雷达 将公开报价按价格排序，并展示库存和更新时间，方便进行
                  <Link href="/card-products" className="font-medium text-emerald-600 hover:text-emerald-700">AI 订阅多渠道比价</Link>。
                </p>
              </div>
            </div>
          </section>

          <section className="mt-16 border-t border-gray-200 pt-12">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                AI 订阅比价常见问题
              </h2>
              <p className="text-gray-600 leading-relaxed">
                这些问题覆盖了用户在搜索 ChatGPT Plus 价格、Claude Pro 代充、AI 成品号、官方订阅地区价格和卡网渠道比价时最常见的决策点。
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
