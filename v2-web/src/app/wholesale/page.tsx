import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Boxes, Calculator, PackageSearch, Store } from 'lucide-react';
import { SubmitChannelButton } from '@/components/SubmitChannelButton';
import { getRetailStoreUrl } from '@/lib/seo-geo';

export const metadata: Metadata = {
  title: '批发供需合作 - 爱窝啦·货源雷达',
  description: '面向 AI 账号卖家的批量采购与公开货源入驻入口，先核验货源和利润，再进入合作。',
  alternates: { canonical: '/wholesale' },
};

const checks = [
  ['公开可核验', '供应方至少提供稳定的 HTTPS 商品页或结构化接口。'],
  ['库存可说明', '区分实时库存、人工确认和暂时缺货，不把未知写成有货。'],
  ['售后有边界', '写清交付、质保、退款与异常处理，不只提供一个低价。'],
  ['价格可复核', '报价变化后能回到原始页面复核，并保留更新时间。'],
];

export default function WholesalePage() {
  const retailStoreUrl = getRetailStoreUrl({ content: 'wholesale_personal_use' });
  return (
    <main className="market-page py-10 sm:py-16">
      <div className="market-shell">
        <header className="mx-auto max-w-3xl text-center"><span className="radar-kicker">Wholesale matching</span><h1 className="market-display mt-3 text-4xl sm:text-6xl">批量补货与货源合作</h1><p className="mt-5 text-base leading-8 text-gray-600">把“账号卖家补货”和“渠道方供货”分成两条清晰路径。平台提供公开信息与核验工具，不代收款、不参与第三方履约。</p></header>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="market-card flex flex-col p-6 sm:p-8"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><PackageSearch className="h-5 w-5" /></span><span className="mt-7 text-xs font-bold text-emerald-700">账号卖家补货</span><h2 className="market-display mt-2 text-3xl">先找货，再谈批量补货</h2><p className="mt-4 flex-1 text-sm leading-7 text-gray-600">从标准商品查看当前可采购报价和渠道覆盖，确认规格后计算目标售价、退款与售后成本。个人自用的零售需求可以进入爱窝啦主站。</p><div className="mt-6 flex flex-wrap gap-2"><Link href="/card-products" className="market-pill market-pill--primary">查看可采购货源<ArrowRight className="h-4 w-4" /></Link><a href={retailStoreUrl} target="_blank" rel="noopener" data-retail-store-link className="market-pill market-pill--secondary">个人自用零售入口</a></div></article>
          <article className="market-card flex flex-col p-6 sm:p-8"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Boxes className="h-5 w-5" /></span><span className="mt-7 text-xs font-bold text-emerald-700">我是供应方</span><h2 className="market-display mt-2 text-3xl">提交公开货源渠道</h2><p className="mt-4 flex-1 text-sm leading-7 text-gray-600">提供稳定公开的商品页面、接口与售后说明。系统审核和采集成功后，报价才会进入目录；不要提交卡密、账号密码、订单或客户资料。</p><SubmitChannelButton className="market-pill market-pill--primary mt-6 self-start"><Store className="h-4 w-4" />提交渠道审核</SubmitChannelButton></article>
        </section>

        <section className="mt-10 grid gap-6 border-y border-gray-200 py-10 lg:grid-cols-[0.7fr_1.3fr]"><div><span className="radar-kicker">Before matching</span><h2 className="market-display mt-3 text-3xl">合作前必须能回答四个问题</h2><Link href="/profit-calculator" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"><Calculator className="h-4 w-4" />先计算一单真实利润</Link></div><dl className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2">{checks.map(([title, text]) => <div key={title} className="bg-white p-5"><dt className="font-bold text-gray-950">{title}</dt><dd className="mt-2 text-sm leading-6 text-gray-600">{text}</dd></div>)}</dl></section>
      </div>
    </main>
  );
}
