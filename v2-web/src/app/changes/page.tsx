import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, ExternalLink } from 'lucide-react';
import { listPriceChanges } from '@/lib/legacy-radar';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '今日价格与库存异动 | 爱窝啦·货源雷达',
  description: '展示连续有效快照中确认的货源价格和库存变化；首次采集不会被误报为涨跌。',
  alternates: { canonical: '/changes' },
};

function formatPrice(value: number | null): string {
  return value === null ? '—' : `¥${value.toFixed(2)}`;
}

export default async function ChangesPage() {
  const changes = await listPriceChanges();

  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><Activity className="h-4 w-4" />连续快照确认</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">今日价格与库存异动</h1>
          <p className="mt-4 text-base leading-7 text-gray-600">只有同一货源在两次有效采集中发生真实变化才会进入这里。来源失败会保留最后一次正常结果，不制造虚假降价。</p>
        </header>

        {changes.length ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr><th className="px-5 py-3">商品</th><th className="px-5 py-3">渠道</th><th className="px-5 py-3">上次</th><th className="px-5 py-3">当前</th><th className="px-5 py-3">库存</th><th className="px-5 py-3">时间</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changes.map((change, index) => (
                  <tr key={`${change.product_slug}-${change.merchant_name}-${change.observed_at}-${index}`}>
                    <td className="px-5 py-4"><Link href={`/card-products/${change.product_slug}`} className="font-semibold text-gray-950 hover:text-emerald-700">{change.product_name}</Link><a href={change.source_url} target="_blank" rel="noopener nofollow" className="mt-1 flex items-center gap-1 text-xs text-blue-700">原始商品 <ExternalLink className="h-3 w-3" /></a></td>
                    <td className="px-5 py-4 text-gray-600">{change.merchant_name}</td>
                    <td className="px-5 py-4 text-gray-500">{formatPrice(change.previous_price)}</td>
                    <td className="px-5 py-4 font-semibold text-gray-950">{formatPrice(change.current_price)}</td>
                    <td className="px-5 py-4 text-gray-600">{change.previous_stock || '未知'} → {change.current_stock || '未知'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">{change.observed_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">暂无已确认异动。首次快照不会伪装成涨跌，出现真实变化后会自动展示。</div>
        )}
      </div>
    </main>
  );
}
