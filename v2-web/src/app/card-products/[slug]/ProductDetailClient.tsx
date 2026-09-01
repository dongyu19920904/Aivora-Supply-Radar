"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ProductType, ProductDetail } from '../../../data';
import { DetailTable } from '../../../components/DetailTable';
import { FilterBar } from '../../../components/FilterBar';
import { BackButton } from '../../../components/BackButton';
import { StickyHeaderAddon } from '../../../components/StickyHeaderAddon';
import { BuyDisclaimerModal } from '../../../components/BuyDisclaimerModal';
import { FeedbackModal } from '../../../components/FeedbackModal';
import { YoufenkAffiliateBanner } from '../../../components/YoufenkAffiliateAd';
import { useBuyAction } from '../../../hooks/useBuyAction';
import { PlatformCountBadge } from '../../../components/PlatformCountBadge';
import type { ProductOfferAvailability } from '../../../lib/product-offer-query';
import { getRelativeTime } from '../../../lib/utils';
import { getProfitCalculatorHref } from '../../../lib/supply-opportunity';

interface ProductDetailClientProps {
  slug: string;
  initialProduct: ProductType;
  initialDetails: ProductDetail[];
  initialTotal: number;
}

interface ProductOfferPageResponse {
  items: ProductDetail[];
  pageInfo: { total: number; hasMore: boolean; nextOffset: number };
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ slug, initialProduct, initialDetails, initialTotal }) => {
  const [feedbackModalItem, setFeedbackModalItem] = useState<ProductDetail | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isBuyModalOpen, handleBuyClick, handleBuyConfirm, handleBuyCancel } = useBuyAction();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  
  const onBuyClick = (item: ProductDetail) => {
    handleBuyClick(item.url, item.channel);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [availability, setAvailability] = useState<ProductOfferAvailability>('all');
  const [minInventory, setMinInventory] = useState<number | null>(null);
  const [updatedWithinHours, setUpdatedWithinHours] = useState<number | null>(null);
  const [currentDetails, setCurrentDetails] = useState(initialDetails);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedProduct = initialProduct;

  const buildRequestUrl = useCallback((offset: number) => {
    const params = new URLSearchParams({ limit: '50', offset: String(offset) });
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (customMinPrice) params.set('min', customMinPrice);
    if (customMaxPrice) params.set('max', customMaxPrice);
    if (availability !== 'all') params.set('availability', availability);
    if (minInventory !== null) params.set('inventory', String(minInventory));
    if (updatedWithinHours !== null) params.set('hours', String(updatedWithinHours));
    return `/api/products/${encodeURIComponent(slug)}/offers?${params.toString()}`;
  }, [availability, customMaxPrice, customMinPrice, minInventory, searchQuery, slug, updatedWithinHours]);

  useEffect(() => {
    if (availability === 'all' && !searchQuery.trim() && !customMinPrice && !customMaxPrice && minInventory === null && updatedWithinHours === null) {
      const resetTimer = window.setTimeout(() => {
        setCurrentDetails(initialDetails);
        setTotal(initialTotal);
        setLoadError('');
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch(buildRequestUrl(0), { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json() as ProductOfferPageResponse;
        setCurrentDetails(Array.isArray(result.items) ? result.items : []);
        setTotal(Number(result.pageInfo?.total || 0));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error filtering product offers:', error);
          setLoadError('筛选暂时失败，请稍后重试。');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [availability, buildRequestUrl, customMaxPrice, customMinPrice, initialDetails, initialTotal, minInventory, searchQuery, updatedWithinHours]);

  const loadMore = useCallback(async () => {
    if (loadingMore || currentDetails.length >= total) return;
    setLoadingMore(true);
    setLoadError('');
    try {
      const response = await fetch(buildRequestUrl(currentDetails.length));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as ProductOfferPageResponse;
      setCurrentDetails((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...result.items.filter((item) => !knownIds.has(item.id))];
      });
      setTotal(Number(result.pageInfo?.total || 0));
    } catch (error) {
      console.error('Error loading more product offers:', error);
      setLoadError('下一页加载失败，请重试。');
    } finally {
      setLoadingMore(false);
    }
  }, [buildRequestUrl, currentDetails.length, loadingMore, total]);

  const hasMore = currentDetails.length < total;
  const availableTotal = Math.max(0, selectedProduct.channelCount);
  const unavailableTotal = Math.max(0, initialTotal - availableTotal);
  const availabilityOptions: Array<{ value: ProductOfferAvailability; label: string; count: number }> = [
    { value: 'all', label: '全部报价', count: initialTotal },
    { value: 'available', label: '可采购', count: availableTotal },
    { value: 'unavailable', label: '缺货 / 下架', count: unavailableTotal },
  ];
  const lowestPrice = selectedProduct.lowestPrice && selectedProduct.lowestPrice > 0
    ? `¥${selectedProduct.lowestPrice.toFixed(2)}`
    : '暂无报价';
  const warrantyPrice = selectedProduct.warrantyPrice && selectedProduct.warrantyPrice > 0
    ? `¥${selectedProduct.warrantyPrice.toFixed(2)}`
    : null;

  return (
    <>
      <div className="relative">
        <PlatformCountBadge count={availableTotal} prefix="当前" suffix="条可采购报价" />
        
        {/* Option A: Static Header with Title and Back Button */}
        <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:gap-6">
          <BackButton href="/card-products" />
          <div className="w-full flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{availableTotal > 0 ? '当前可采购' : '等待补货'}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{selectedProduct.platform}</span></div>
            <h1 className="market-display text-3xl sm:text-5xl">{selectedProduct.name}</h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              {selectedProduct.shortDesc || '暂无详细描述'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2"><Link href={getProfitCalculatorHref(selectedProduct)} className="market-pill market-pill--primary">带入进货价算利润</Link><Link href="/opportunities" className="market-pill market-pill--secondary">查看今日经营建议</Link></div>
          </div>
        </div>

        <div className="flex flex-col relative">
          <section
            data-product-decision-summary
            className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
            aria-label="商品市场摘要"
          >
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
              <p className="text-xs font-medium text-emerald-700">当前最低进货价</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-800">{lowestPrice}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-500">可采购报价</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-gray-950">{availableTotal}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-500">缺货 / 下架</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-gray-950">{unavailableTotal}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-500">{warrantyPrice ? '明确质保最低价' : '最近报价更新'}</p>
              <p suppressHydrationWarning className="mt-1 text-sm font-bold text-gray-950 sm:text-base">
                {warrantyPrice || (selectedProduct.updatedAt ? getRelativeTime(selectedProduct.updatedAt) : '待首次采集')}
              </p>
            </div>
          </section>
          <p className="mb-3 text-xs leading-5 text-gray-500">
            已合并同一标准商品的授权聚合与爱窝啦来源；自营报价不固定置顶，默认按可采购优先、价格从低到高排列。
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="快捷筛选">
            <span className="mr-1 text-xs font-semibold text-gray-500">快捷筛选</span>
            <button type="button" aria-pressed={minInventory === 50} onClick={() => { setMinInventory((value) => value === 50 ? null : 50); setAvailability('available'); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${minInventory === 50 ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'}`}>库存 ≥ 50</button>
            <button type="button" aria-pressed={updatedWithinHours === 24} onClick={() => setUpdatedWithinHours((value) => value === 24 ? null : 24)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${updatedWithinHours === 24 ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'}`}>24 小时内更新</button>
            <button type="button" aria-pressed={searchQuery === '-共享'} onClick={() => setSearchQuery((value) => value === '-共享' ? '' : '-共享')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${searchQuery === '-共享' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'}`}>排除共享</button>
            <button type="button" aria-pressed={searchQuery === '代充'} onClick={() => setSearchQuery((value) => value === '代充' ? '' : '代充')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${searchQuery === '代充' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'}`}>只看代充</button>
          </div>
          <div
            className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
            aria-label="报价库存筛选"
          >
            {availabilityOptions.map((option) => {
              const active = option.value === availability;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-offer-availability={option.value}
                  aria-pressed={active}
                  onClick={() => setAvailability(option.value)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                  <span className={`ml-1.5 font-mono text-xs tabular-nums ${active ? 'text-emerald-50' : 'text-gray-500'}`}>
                    {option.count}
                  </span>
                </button>
              );
            })}
            <span className="ml-auto hidden text-xs text-gray-500 sm:inline">
              默认可采购优先；缺货记录保留用于观察补货机会
            </span>
          </div>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onReset={() => {
              setSearchQuery("");
              setCustomMinPrice("");
              setCustomMaxPrice("");
              setAvailability('all');
              setMinInventory(null);
              setUpdatedWithinHours(null);
            }}
            searchPlaceholder="在当前商品中搜索（-关键词可排除）"
            searchHelp="排除不想看的结果：在词语前加“-”。例如输入“-共享”，就不会显示含“共享”的商品。"
            isExpanded={isScrolled}
            leftAddon={<StickyHeaderAddon title={selectedProduct.name} />}
          >
            <div className="flex items-center justify-center bg-white/95 rounded-lg shadow-sm px-1.5 sm:px-3 h-8 sm:h-10 shrink-0 transition-all focus-within:ring-2 focus-within:ring-white/50">
              <span className="text-gray-400 text-[12px] sm:text-sm mr-0.5 sm:mr-1">¥</span>
              <input
                type="number"
                min="0"
                placeholder="最低"
                value={customMinPrice}
                onChange={(e) => setCustomMinPrice(e.target.value)}
                className="w-9 sm:w-16 bg-transparent text-[12px] sm:text-[14px] text-gray-900 focus:outline-none placeholder-gray-400 text-center px-0"
              />
              <span className="text-gray-300 mx-0.5 sm:mx-2">-</span>
              <span className="text-gray-400 text-[12px] sm:text-sm mr-0.5 sm:mr-1">¥</span>
              <input
                type="number"
                min="0"
                placeholder="最高"
                value={customMaxPrice}
                onChange={(e) => setCustomMaxPrice(e.target.value)}
                className="w-9 sm:w-16 bg-transparent text-[12px] sm:text-[14px] text-gray-900 focus:outline-none placeholder-gray-400 text-center px-0"
              />
            </div>
          </FilterBar>
          
          <div className="min-h-[400px] relative flex flex-col gap-8">
            {loadError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</div>}
            <DetailTable
              details={currentDetails}
              onBuyClick={onBuyClick}
              onFeedbackClick={(item) => setFeedbackModalItem(item)}
            />
            {currentDetails.length > 0 && (
              <div
                className="py-6 flex justify-center items-center text-gray-500 text-sm"
                aria-live="polite"
              >
                {hasMore ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore || loading}
                    className="rounded-lg border border-emerald-600 bg-white px-6 py-2.5 font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingMore ? '正在加载…' : `加载更多（已显示 ${currentDetails.length}/${total}）`}
                  </button>
                ) : (
                  `已显示全部 ${total} 条报价`
                )}
              </div>
            )}
            <YoufenkAffiliateBanner className="mx-auto" />
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={!!feedbackModalItem}
        onClose={() => setFeedbackModalItem(null)}
        offerId={feedbackModalItem?.id || ''}
        productName={feedbackModalItem?.originalName || ''}
        channelName={feedbackModalItem?.channel || ''}
      />

      <BuyDisclaimerModal 
        isOpen={isBuyModalOpen}
        onClose={handleBuyCancel}
        onConfirm={handleBuyConfirm}
      />
    </>
  );
};
