import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfitCalculatorClient } from './ProfitCalculatorClient';
import { parseProfitCalculatorPrefill } from '@/lib/profit-calculator';
import { parseSpecification } from '@/lib/offer-specification';

export const metadata: Metadata = {
  title: 'AI账号货源利润计算器 | 爱窝啦·货源雷达',
  description: '输入进货价、售价、支付费率、退款和售后预留，计算 AI 账号与数字商品的净利润、净利率和保本售价。',
  alternates: { canonical: '/profit-calculator' },
};

type PageProps = {
  searchParams: Promise<{ cost?: string | string[]; product?: string | string[]; spec?: string; report?: string }>;
};

export default async function ProfitCalculatorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const prefill = parseProfitCalculatorPrefill(params.cost, params.product);
  const spec = parseSpecification(params.spec);
  const report = typeof params.report === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.report) ? params.report : '';
  return (
    <main className="radar-page">
      <div className="radar-shell py-8 sm:py-12">
        <Link href="/opportunities" className="radar-back"><ArrowLeft className="h-4 w-4" />返回账号商机</Link>
        <header className="radar-page-head">
          <span className="radar-kicker">卖家工作台 / 01</span>
          <h1>利润计算器</h1>
          <p>不要只看“进货价减售价”。把支付费、退款、售后和获客成本一起放进来，先算清保本线，再决定这条货源值不值得卖。</p>
        </header>
        {prefill.unitCost !== null && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">链接带入的参考成本为 ¥{prefill.unitCost.toFixed(2)}{spec ? `，规格：${spec}` : '，规格未提供'}。{report ? <Link href={`/opportunities/${report}`} className="text-blue-700 underline dark:text-blue-400">返回 {report} 日报核对</Link> : null} 这不是当前成交价或报价保证；请先核对原始来源，将当前实际进货成本填入，再填写你自己的售价和费用。</p>}
        <ProfitCalculatorClient initialUnitCost={prefill.unitCost} productName={prefill.productName} />
      </div>
    </main>
  );
}
