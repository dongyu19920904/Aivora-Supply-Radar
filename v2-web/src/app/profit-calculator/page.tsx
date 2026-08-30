import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfitCalculatorClient } from './ProfitCalculatorClient';

export const metadata: Metadata = {
  title: 'AI账号货源利润计算器 | 爱窝啦·货源雷达',
  description: '输入进货价、售价、支付费率、退款和售后预留，计算 AI 账号与数字商品的净利润、净利率和保本售价。',
  alternates: { canonical: '/profit-calculator' },
};

export default function ProfitCalculatorPage() {
  return (
    <main className="radar-page">
      <div className="radar-shell py-8 sm:py-12">
        <Link href="/opportunities" className="radar-back"><ArrowLeft className="h-4 w-4" />返回账号商机</Link>
        <header className="radar-page-head">
          <span className="radar-kicker">卖家工作台 / 01</span>
          <h1>利润计算器</h1>
          <p>不要只看“进货价减售价”。把支付费、退款、售后和获客成本一起放进来，先算清保本线，再决定这条货源值不值得卖。</p>
        </header>
        <ProfitCalculatorClient />
      </div>
    </main>
  );
}
