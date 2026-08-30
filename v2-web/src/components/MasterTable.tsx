import React from 'react';
import { ProductType } from '../data';
import { useRouter } from 'next/navigation';
import { getRelativeTime } from '../lib/utils';
import { ViewDetailsButton } from './ViewDetailsButton';

interface MasterTableProps {
  products: ProductType[];
}

function priceLabel(price: number | null): string {
  return price === null ? '暂无报价' : `¥${price.toFixed(2)}`;
}

export const MasterTable: React.FC<MasterTableProps> = ({ products }) => {
  const router = useRouter();
  const firstUnavailableIndex = products.findIndex((product) => product.channelCount === 0);
  
  return (
    <div className="flex flex-col gap-4">
      {products.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
            
            <div data-catalog-view="desktop" className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th scope="col" className="w-[7%] px-5 py-4 font-semibold text-gray-900">序号</th>
                    <th scope="col" className="w-[43%] px-5 py-4 font-semibold text-gray-900">标准商品</th>
                    <th scope="col" className="w-[13%] px-5 py-4 font-semibold text-gray-900">最低价</th>
                    <th scope="col" className="w-[12%] px-5 py-4 font-semibold text-gray-900">在售渠道</th>
                    <th scope="col" className="w-[12%] px-5 py-4 font-semibold text-gray-900">最近更新</th>
                    <th scope="col" className="w-[13%] px-5 py-4 font-semibold text-gray-900 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {products.map((product, index) => (
                    <React.Fragment key={product.id}>
                      {firstUnavailableIndex > 0 && index === firstUnavailableIndex && (
                        <tr>
                          <td colSpan={6} className="border-y border-gray-200 bg-gray-100 px-5 py-2.5 text-xs font-semibold text-gray-600">
                            以下商品当前暂无在售渠道，仍保留在完整目录中
                          </td>
                        </tr>
                      )}
                      <tr
                        data-catalog-product
                        data-catalog-name={product.name}
                        data-active-offer={product.channelCount > 0 ? 'true' : 'false'}
                        className="even:bg-gray-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer group border-b border-gray-100 last:border-0"
                        onClick={() => router.push(`/card-products/${product.slug}`)}
                      >
                        <td className="px-5 py-4 font-mono text-xs tabular-nums text-gray-500">#{String(index + 1).padStart(2, '0')}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-950">{product.name}</span>
                            <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">{product.platform}</span>
                            {product.display_id && <span className="font-mono text-[11px] text-gray-400">目录 {product.display_id}</span>}
                          </div>
                          {product.shortDesc && (
                            <p className="mt-1 line-clamp-1 max-w-2xl text-xs leading-5 text-gray-500">{product.shortDesc}</p>
                          )}
                        </td>
                        <td className={`px-5 py-4 font-mono font-semibold tabular-nums ${product.lowestPrice === null ? 'text-gray-400' : 'text-emerald-700'}`}>{priceLabel(product.lowestPrice)}</td>
                        <td className={`px-5 py-4 font-medium tabular-nums ${product.channelCount === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                          {product.channelCount === 0 ? '暂无在售' : product.channelCount}
                        </td>
                        <td suppressHydrationWarning className="px-5 py-4 text-xs text-gray-500">
                          {product.updatedAt ? getRelativeTime(product.updatedAt) : '待首次采集'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ViewDetailsButton
                            href={`/card-products/${product.slug}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div data-catalog-view="mobile" className="block md:hidden flex flex-col divide-y divide-gray-100">
              {products.map((product, index) => (
                <React.Fragment key={product.id}>
                  {firstUnavailableIndex > 0 && index === firstUnavailableIndex && (
                    <div className="bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600">
                      以下商品当前暂无在售渠道
                    </div>
                  )}
                  <div
                    data-catalog-product
                    data-catalog-name={product.name}
                    data-active-offer={product.channelCount > 0 ? 'true' : 'false'}
                    className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/card-products/${product.slug}`)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                          <span className="font-mono tabular-nums">#{String(index + 1).padStart(2, '0')}</span>
                          <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-semibold text-gray-600">{product.platform}</span>
                          {product.display_id && <span className="font-mono">目录 {product.display_id}</span>}
                        </div>
                        <h3 className="font-semibold text-gray-950 leading-snug">{product.name}</h3>
                      </div>
                      <span className={`whitespace-nowrap font-mono font-bold tabular-nums ${product.lowestPrice === null ? 'text-gray-400' : 'text-emerald-700'}`}>{priceLabel(product.lowestPrice)}</span>
                    </div>
                    {product.shortDesc && (
                      <p className="mb-2 line-clamp-2 text-xs leading-5 text-gray-500">{product.shortDesc}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500">
                      <span className={`rounded px-1.5 py-0.5 font-semibold ${product.channelCount === 0 ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                        {product.channelCount === 0 ? '暂无在售' : `在售 ${product.channelCount}`}
                      </span>
                      <span suppressHydrationWarning className="text-gray-400">
                        {product.updatedAt ? getRelativeTime(product.updatedAt) : '待首次采集'}
                      </span>
                      <span className="ml-auto">
                        <ViewDetailsButton
                          href={`/card-products/${product.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          variant="text"
                        />
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
        </div>
      )}
      
      {products.length === 0 && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          没有找到对应的商品
        </div>
      )}
    </div>
  );
};
