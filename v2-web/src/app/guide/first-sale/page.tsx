import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, CheckCircle2, ClipboardCheck, PackageCheck, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI 账号卖家第一单试卖指南｜爱窝啦·货源雷达',
  description: '六步完成一次有证据、可停手、可复盘的 AI 账号商品试卖。售价和费用由卖家填写，不承诺成交或盈利。',
  alternates: { canonical: '/guide/first-sale' },
};

const steps = [
  {
    title: '先看今天是否建议试卖',
    body: '打开账号商机日报。只有页面明确给出一个合格商品时才继续；显示“今日不建议上新”时，今天只处理库存和旧订单。',
  },
  {
    title: '只核对一个标准商品',
    body: '打开日报推荐的商品页，记下商品名称、期限、地区、账号形态、交付方式和售后范围。六项里有一项说不清就停止。',
  },
  {
    title: '复核两个不同货源站',
    body: '分别打开至少两个仍可购买的货源站。同一站的多个店铺不能算两个站；规格对不上时不要混在一起比价。',
  },
  {
    title: '用自己的真实售价算一单',
    body: '把当前进货参考带入利润计算器，再填写你自己的售价、手续费、退款损耗、售后成本和获客成本。缺一项就先不判断利润。',
  },
  {
    title: '只写能够兑现的商品说明',
    body: '商品说明只写已经核验的规格、交付和售后。不要写官方授权、永久稳定、零风险等无法证明的承诺，并保留“付款前再次确认库存”。',
  },
  {
    title: '有订单后重查库存并收盘',
    body: '收款前重新打开原货源，确认库存和价格。交付后记录询问数、成交数、实际成本、退款补发和售后耗时，再决定明天继续还是暂停。',
  },
] as const;

export default function FirstSaleGuidePage() {
  return (
    <article className="p-5 sm:p-8 lg:p-10 dark:bg-zinc-950">
      <header className="border-b border-gray-100 pb-7 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
          <PackageCheck className="h-6 w-6" />
          <span className="text-sm font-bold">账号卖家试卖指南</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-950 sm:text-3xl dark:text-zinc-50">第一单只做一次可验证的小试卖</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base dark:text-zinc-300">
          目标是减少亏损和猜测，留下真实经营记录。货源、客户和售后都会变化，本指南不会承诺成交或盈利。
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/opportunities/latest" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
            打开今天的账号商机日报
          </Link>
          <Link href="/profit-calculator" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-blue-700 hover:border-blue-300 dark:border-zinc-700 dark:text-blue-400">
            <Calculator className="h-4 w-4" />
            打开利润计算器
          </Link>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-950 dark:text-zinc-50">照着六步做</h2>
        <ol className="mt-5 grid gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="grid min-w-0 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-950 dark:text-zinc-50">{step.title}</h3>
                <p className="mt-2 break-words text-sm leading-7 text-gray-600 dark:text-zinc-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
          <h2 className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200"><ShieldAlert className="h-5 w-5" />立即停止的情况</h2>
          <p className="mt-3 text-sm leading-7 text-amber-900 dark:text-amber-100">库存失效、两个来源规格不一致、费用填不全、真实售价覆盖不了总成本，任何一种出现都先停止。</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
          <h2 className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200"><ClipboardCheck className="h-5 w-5" />今天收盘要留下什么</h2>
          <p className="mt-3 text-sm leading-7 text-blue-900 dark:text-blue-100">留下询问、成交、实际成本、退款补发和售后耗时。没有这些记录，明天仍然只能靠猜。</p>
        </div>
      </section>

      <p className="mt-8 flex items-start gap-2 rounded-xl bg-gray-100 p-4 text-sm leading-6 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        日报负责告诉你今天出现了什么新证据，这份指南负责保留稳定步骤。这样每天的正文不需要重复整套教程。
      </p>
    </article>
  );
}
