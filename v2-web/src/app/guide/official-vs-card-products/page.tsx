import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Scale, ShieldCheck, Store, TriangleAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: '官方成本和第三方货源怎样比较？AI账号卖家进货指南 | 爱窝啦·货源雷达',
  description: '帮助 AI 账号卖家比较官方方案与第三方货源的进货来源、成本、账号归属、售后和风险，接单前先核验商品类型。',
  keywords: ['AI账号进货指南', '官方订阅成本', '第三方AI货源', 'ChatGPT货源', '卡网渠道核验'],
  alternates: { canonical: '/guide/official-vs-card-products' },
  openGraph: {
    title: '官方成本和第三方货源怎样比较？',
    description: '卖家核对两类货源的成本、账号归属、售后和风险。',
    type: 'article',
  },
};

const comparisons = [
  ['进货来源', 'App Store 或服务提供方的官方渠道', '销售数字商品的第三方渠道商'],
  ['常见供给', '月付、年付等官方订阅套餐', '代充、兑换、成品号、共享或合租等多种商品'],
  ['账号归属', '通常在自己的账号上开通', '取决于商品，可能是自己的账号，也可能是商家提供的账号'],
  ['成本特点', '规则清晰，不同地区定价可能不同', '报价和商品规格更多样，需仔细确认交付内容'],
  ['售后方式', '按照平台或服务提供方规则处理', '由具体渠道商提供，期限和范围各不相同'],
  ['主要风险', '地区、支付方式、自动续费等规则需要了解', '商品描述、账号安全、稳定性和售后质量存在差异'],
] as const;

export default function OfficialVsCardProductsPage() {
  return (
    <article className="p-5 sm:p-8 lg:p-10">
      <header className="mb-8 border-b border-gray-100 pb-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Scale className="h-5 w-5" />
        </div>
        <div className="mb-1 text-xs font-semibold text-emerald-600">卖家进货指南</div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">官方成本与第三方货源怎样比较？</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          两者都可以进入卖家的成本核算，但供给来源、商品形态和风险不同。先看清交付内容，再决定能否作为稳定货源。
        </p>
      </header>

      <div className="space-y-8 text-sm leading-7 text-gray-600">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <div className="mb-3 flex items-center gap-2 font-bold text-gray-900">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              什么是官方订阅？
            </div>
            <p>
              官方方案由 App Store 或服务提供方直接开通，套餐、续费和售后规则由官方平台制定。它适合作为成本与权益的核验基准。
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="mb-3 flex items-center gap-2 font-bold text-gray-900">
              <Store className="h-5 w-5 text-blue-600" />
              什么是第三方货源？
            </div>
            <p>
              第三方货源来自销售数字商品的渠道商。商品可能是代充、兑换码、成品账号、共享或合租服务，不同商品的交付方式和使用限制可能完全不同。
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">两类成本怎样比较？</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-[680px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="w-28 px-4 py-3 font-semibold">对比项</th>
                  <th className="px-4 py-3 font-semibold">官方订阅</th>
                  <th className="px-4 py-3 font-semibold">第三方货源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {comparisons.map(([label, official, card]) => (
                  <tr key={label}>
                    <th className="px-4 py-3 font-medium text-gray-900">{label}</th>
                    <td className="px-4 py-3 align-top">{official}</td>
                    <td className="px-4 py-3 align-top">{card}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-amber-900">
            <TriangleAlert className="h-5 w-5" />
            把第三方货源写进报价前，至少确认这 5 件事
          </h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-amber-900/80">
            <li>交付的是客户自有账号开通，还是渠道提供的成品号或共享号？</li>
            <li>交付后能否修改密码、绑定邮箱或手机，账号找回权归谁？</li>
            <li>实际包含哪些套餐权益，能否用官方页面或交付凭证复核？</li>
            <li>售后期限多长，失效、掉订阅或无法登录时由谁处理？</li>
            <li>报价是否覆盖支付、退款、补号、人工售后和获客成本？</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            卖家应该怎样使用？
          </h2>
          <div className="space-y-2">
            <p><strong className="text-gray-900">客户重视稳定、账号归属和隐私：</strong>用官方方案或能提供完整凭证的货源测算报价。</p>
            <p><strong className="text-gray-900">客户重视价格或短期使用：</strong>可以比较第三方货源，但先确认商品类型、限制和售后。</p>
            <p><strong className="text-gray-900">仍然无法确认：</strong>暂停接单，继续核验交付和售后，不要只按目录最低价承诺客户。</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="font-bold text-gray-900">爱窝啦·货源雷达 展示的是什么？</h2>
          <p className="mt-2">
            “官方价格”展示 App Store 中的官方套餐地区价格，“第三方货源”聚合渠道公开报价。爱窝啦·货源雷达不直接销售这些商品，也不代表对某个渠道作出担保。采购或接单前仍需核对原始商品说明。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/official-prices" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              核对官方成本 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/card-products" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
              查看第三方货源 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
