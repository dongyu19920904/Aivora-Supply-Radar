'use client';

import { useSyncExternalStore } from 'react';
import { ArrowUpRight, ShoppingBag, X } from 'lucide-react';

import { getRetailStoreUrl } from '@/lib/seo-geo';
import { STORE_NAME } from '@/lib/site';

const DISMISSED_STORAGE_KEY = 'aivora:supply-promotion-dismissed';
const DISMISSED_EVENT = 'aivora:supply-promotion-dismissed';

let dismissedInMemory = false;

function subscribeToDismissal(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === DISMISSED_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener(DISMISSED_EVENT, onStoreChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(DISMISSED_EVENT, onStoreChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function isPromotionVisible() {
  if (dismissedInMemory) return false;

  try {
    return sessionStorage.getItem(DISMISSED_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

interface YoufenkAffiliateAdProps {
  className?: string;
  productSlug?: string;
}

function usePromotionVisibility() {
  const isVisible = useSyncExternalStore(subscribeToDismissal, isPromotionVisible, () => true);

  const dismissPromotion = () => {
    dismissedInMemory = true;
    try {
      sessionStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    } catch {
      // The in-memory flag still keeps the promotion closed if storage is unavailable.
    }
    window.dispatchEvent(new Event(DISMISSED_EVENT));
  };

  return { isVisible, dismissPromotion };
}

interface PromotionCardProps {
  href: string;
  compact?: boolean;
}

function PromotionCard({ href, compact = false }: PromotionCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-retail-store-link
      aria-label={`个人自用时访问${STORE_NAME}，在新窗口打开`}
      className={`group flex overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 transition-colors hover:border-amber-300 hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${compact ? 'flex-col p-5 text-center' : 'items-center gap-4 p-5 sm:p-6'}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 ring-1 ring-amber-200">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-amber-800">个人自用零售入口</span>
        <strong className="mt-1 block text-base text-gray-950">自己使用，可以直接查看爱窝啦零售现货</strong>
        <span className="mt-1 block text-xs leading-5 text-gray-600">卖家继续在本页核价。个人自用可查看当前商品、交付方式和售后说明。</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-700">
        进入账号店
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </a>
  );
}

interface PromotionHeaderProps {
  dismissPromotion: () => void;
}

function PromotionHeader({ dismissPromotion }: PromotionHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-gray-400">
      <span>意图分流</span>
      <button
        type="button"
        onClick={dismissPromotion}
        aria-label="关闭个人自用零售入口"
        title="关闭推荐"
        className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function YoufenkAffiliateAd({ className = '', productSlug }: YoufenkAffiliateAdProps) {
  const { isVisible, dismissPromotion } = usePromotionVisibility();
  if (!isVisible) return null;

  const href = getRetailStoreUrl({
    content: productSlug ? `product_${productSlug}_rail` : 'market_rail',
    productSlug,
  });

  return (
    <aside aria-label="个人自用零售入口" className={`max-w-[320px] ${className}`}>
      <div className="sticky top-28">
        <PromotionHeader dismissPromotion={dismissPromotion} />
        <PromotionCard href={href} compact />
        <p className="mt-2 px-1 text-center text-[10px] leading-relaxed text-gray-400">零售商品不参与第三方货源价格排序</p>
      </div>
    </aside>
  );
}

export function YoufenkAffiliateBanner({ className = '', productSlug }: YoufenkAffiliateAdProps) {
  const { isVisible, dismissPromotion } = usePromotionVisibility();
  if (!isVisible) return null;

  const href = getRetailStoreUrl({
    content: productSlug ? `product_${productSlug}` : 'market_banner',
    productSlug,
  });

  return (
    <aside aria-label="个人自用零售入口" className={`youfenk-affiliate-banner w-full ${className}`}>
      <PromotionHeader dismissPromotion={dismissPromotion} />
      <PromotionCard href={href} />
    </aside>
  );
}
