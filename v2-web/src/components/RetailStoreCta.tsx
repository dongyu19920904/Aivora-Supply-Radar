import { ArrowUpRight, ShoppingBag } from 'lucide-react';

interface RetailStoreCtaProps {
  href: string;
  compact?: boolean;
}

export function RetailStoreCta({ href, compact = false }: RetailStoreCtaProps) {
  return (
    <aside
      data-retail-handoff
      className={`rounded-2xl border border-amber-200 bg-amber-50 ${compact ? 'p-5' : 'p-6 sm:p-7'}`}
      aria-labelledby="retail-store-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 ring-1 ring-amber-200">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-amber-800">个人自用零售入口</span>
          <h2 id="retail-store-title" className="mt-1 text-lg font-bold text-gray-950">自己使用，可以直接查看零售现货</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            本页继续帮助卖家核价。只为自己购买时，可到爱窝啦·AI账号店查看当前零售商品、交付方式和售后说明。
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener"
            data-retail-store-link
            className="market-pill market-pill--primary mt-4"
          >
            进入爱窝啦·AI账号店
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  );
}
