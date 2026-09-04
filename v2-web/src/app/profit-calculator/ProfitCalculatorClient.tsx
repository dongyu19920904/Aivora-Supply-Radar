'use client';

import { useMemo, useState } from 'react';
import { Calculator, CircleAlert, TrendingUp } from 'lucide-react';
import { calculateProfit, parseCompleteProfitInputs, type ProfitInputDraft } from '@/lib/profit-calculator';

const fields = [
  { key: 'unitCost', label: '单件进货成本', suffix: '元', step: '0.01' },
  { key: 'salePrice', label: '你的单件售价', suffix: '元', step: '0.01' },
  { key: 'quantity', label: '预计成交数量', suffix: '单', step: '1' },
  { key: 'paymentFeeRate', label: '支付或平台费率', suffix: '%', step: '0.1' },
  { key: 'refundReserveRate', label: '退款损耗预留', suffix: '%', step: '0.1' },
  { key: 'serviceReserveRate', label: '售后成本预留', suffix: '%', step: '0.1' },
  { key: 'fixedCost', label: '获客与其他固定成本', suffix: '元', step: '0.01' },
] as const;

function money(value: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value);
}

interface ProfitCalculatorClientProps {
  initialUnitCost?: number | null;
  productName?: string;
}

export function ProfitCalculatorClient({ initialUnitCost = null, productName = '' }: ProfitCalculatorClientProps) {
  const [values, setValues] = useState<ProfitInputDraft>(() => ({
    unitCost: initialUnitCost === null ? '' : String(initialUnitCost),
    salePrice: '',
    quantity: '',
    paymentFeeRate: '',
    refundReserveRate: '',
    serviceReserveRate: '',
    fixedCost: '',
  }));
  const inputs = useMemo(() => parseCompleteProfitInputs(values), [values]);
  const result = useMemo(() => inputs ? calculateProfit(inputs) : null, [inputs]);
  const profitable = Boolean(result && result.netProfit > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
      <section className="radar-panel" aria-labelledby="profit-inputs-title">
        <div className="radar-panel__head">
          <div><span className="radar-kicker">输入真实成本</span><h2 id="profit-inputs-title">一单生意到底剩多少钱</h2></div>
          <Calculator className="h-5 w-5 text-amber-500" aria-hidden="true" />
        </div>
        {initialUnitCost !== null && (
          <div className="mx-5 mt-5 border-l-2 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100">
            已从货源日报带入{productName ? `「${productName}」` : '商品'}进货参考 ¥{initialUnitCost.toFixed(2)}。这是公开快照，不是最终采购成本，请先复核原始页面。
          </div>
        )}
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-zinc-200">
              {field.label}
              <span className="relative">
                <input
                  type="number"
                  min="0"
                  step={field.step}
                  inputMode="decimal"
                  value={values[field.key]}
                  placeholder={field.key === 'unitCost' ? '填写实际进货成本' : '待填写'}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="radar-input pr-12 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">{field.suffix}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <aside className="radar-panel lg:sticky lg:top-24 lg:self-start" aria-live="polite">
        <div className="radar-panel__head"><div><span className="radar-kicker">实时结果</span><h2>利润判断</h2></div><TrendingUp className="h-5 w-5 text-amber-500" aria-hidden="true" /></div>
        {result ? (
          <>
            <dl className="divide-y divide-gray-200 px-5 dark:divide-zinc-700">
              {[
                ['预计销售额', money(result.revenue)],
                ['货源成本', money(result.supplierCost)],
                ['支付费用', money(result.paymentFee)],
                ['退款与售后预留', money(result.riskReserve)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3"><dt className="text-sm text-gray-600 dark:text-zinc-300">{label}</dt><dd className="font-mono text-sm font-semibold text-gray-950 dark:text-white">{value}</dd></div>
              ))}
            </dl>
            <div className={`m-5 border border-t-2 p-4 ${profitable ? 'border-emerald-300 border-t-emerald-500 bg-emerald-50' : 'border-red-300 border-t-red-500 bg-red-50'}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">预计净利润</p>
              <p className={`mt-1 font-mono text-3xl font-bold ${profitable ? 'text-emerald-700' : 'text-red-700'}`}>{money(result.netProfit)}</p>
              <p className="mt-2 text-sm text-gray-700">净利率 {result.marginRate.toFixed(1)}% · 不亏钱所需的最低售价 {result.breakEvenPrice === null ? '无法计算' : money(result.breakEvenPrice)}</p>
            </div>
          </>
        ) : (
          <div className="m-5 border border-dashed border-gray-300 bg-gray-50 p-5 text-sm leading-6 text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <strong className="block text-gray-950 dark:text-white">等待你填写真实数据</strong>
            售价、数量和各项费用全部填写后，才会显示利润和不亏钱所需的最低售价。页面不会替你猜售价。
          </div>
        )}
        <p className="mx-5 mb-5 flex gap-2 text-xs leading-5 text-gray-500 dark:text-zinc-400"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />结果只用于把成本项算全，不代表销量、售后或平台规则承诺；报价前仍需核验货源稳定性。</p>
      </aside>
    </div>
  );
}
