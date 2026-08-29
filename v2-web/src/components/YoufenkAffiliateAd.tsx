'use client';

import { useSyncExternalStore } from 'react';
import { ArrowUpRight, Store, X } from 'lucide-react';
import { STORE_NAME, STORE_URL } from '@/lib/site';

const DISMISSED_STORAGE_KEY = 'aivora:supply-promotion-dismissed';
const DISMISSED_EVENT = 'aivora:supply-promotion-dismissed';
const AD_SLOTS = [1, 2, 3] as const;

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

function isAdVisible() {
  if (dismissedInMemory) return false;

  try {
    return sessionStorage.getItem(DISMISSED_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

interface YoufenkAffiliateAdProps {
  className?: string;
}

function useAffiliateAdVisibility() {
  const isVisible = useSyncExternalStore(subscribeToDismissal, isAdVisible, () => true);

  const dismissAd = () => {
    dismissedInMemory = true;
    try {
      sessionStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    } catch {
      // The in-memory flag still keeps the ad closed if storage is unavailable.
    }
    window.dispatchEvent(new Event(DISMISSED_EVENT));
  };

  return { isVisible, dismissAd };
}

interface AffiliateCardProps {
  slot: number;
  showAction?: boolean;
}

function AffiliateCard({ slot, showAction = false }: AffiliateCardProps) {
  if (slot !== 1) {
    return (
      <div
        aria-label={`广告位 ${slot} 招租`}
        className="overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-emerald-50/50"
      >
        <div className="flex aspect-[3/2] items-center justify-center px-4 text-center">
          <div>
            <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-400 shadow-sm ring-1 ring-gray-200">
              广告位 {slot}
            </span>
            <p className="mt-3 text-base font-semibold text-gray-600">广告位招租</p>
            <p className="mt-1 text-xs text-gray-400">期待合作伙伴</p>
          </div>
        </div>
        {showAction && (
          <span className="block border-t border-dashed border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-400">
            广告位招租
          </span>
        )}
      </div>
    );
  }

  return (
    <a
      href={STORE_URL}
      target="_blank"
      rel="noopener"
      aria-label={`访问${STORE_NAME}（推荐位 ${slot}，在新窗口打开）`}
      className="group block overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      <span className="flex aspect-[3/2] flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <Store className="h-6 w-6" aria-hidden="true" />
        </span>
        <strong className="mt-4 text-base text-gray-900">{STORE_NAME}</strong>
        <span className="mt-1 text-xs leading-5 text-gray-500">需要现货时查看爱窝啦当前公开商品与服务说明</span>
      </span>
      {showAction && (
        <span className="flex items-center justify-between border-t border-emerald-100 px-3 py-2 text-xs font-semibold text-gray-800 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
          查看爱窝啦现货
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </a>
  );
}

interface AffiliateHeaderProps {
  dismissAd: () => void;
}

function AffiliateHeader({ dismissAd }: AffiliateHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-gray-400">
      <span>合作推广</span>
      <span className="flex items-center gap-1.5">
        爱窝啦自营入口
        <button
          type="button"
          onClick={dismissAd}
          aria-label="关闭爱窝啦推荐入口"
          title="关闭推荐"
          className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

export function YoufenkAffiliateAd({ className = '' }: YoufenkAffiliateAdProps) {
  const { isVisible, dismissAd } = useAffiliateAdVisibility();

  if (!isVisible) return null;

  return (
    <aside
      aria-label="爱窝啦账号店推荐"
      className={`max-w-[320px] ${className}`}
    >
      <div className="sticky top-28">
        <AffiliateHeader dismissAd={dismissAd} />
        <div className="flex flex-col gap-3">
          {AD_SLOTS.map((slot) => (
            <AffiliateCard key={slot} slot={slot} showAction />
          ))}
        </div>

        <p className="mt-2 px-1 text-center text-[10px] leading-relaxed text-gray-400">
          自营商品与全网比价数据分开标注，不参与价格排序
        </p>
      </div>
    </aside>
  );
}

export function YoufenkAffiliateBanner({ className = '' }: YoufenkAffiliateAdProps) {
  const { isVisible, dismissAd } = useAffiliateAdVisibility();

  if (!isVisible) return null;

  return (
    <aside
      aria-label="爱窝啦账号店推荐横幅"
      className={`youfenk-affiliate-banner w-full ${className}`}
    >
      <AffiliateHeader dismissAd={dismissAd} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {AD_SLOTS.map((slot) => (
          <AffiliateCard key={slot} slot={slot} />
        ))}
      </div>
    </aside>
  );
}
