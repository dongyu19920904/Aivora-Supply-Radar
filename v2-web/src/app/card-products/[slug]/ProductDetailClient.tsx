"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    return `/api/products/${encodeURIComponent(slug)}/offers?${params.toString()}`;
  }, [customMaxPrice, customMinPrice, searchQuery, slug]);

  useEffect(() => {
    if (!searchQuery.trim() && !customMinPrice && !customMaxPrice) {
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
  }, [buildRequestUrl, customMaxPrice, customMinPrice, initialDetails, initialTotal, searchQuery]);

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

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        <PlatformCountBadge count={selectedProduct.channelCount} prefix="该商品有" suffix="个渠道报价" />
        
        {/* Option A: Static Header with Title and Back Button */}
        <div className="mb-6 flex flex-col md:flex-row items-start gap-4 md:gap-6">
          <BackButton href="/card-products" />
          <div className="flex-1 w-full">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl mb-2 flex items-center gap-2">
              {selectedProduct.name}
              <span className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{selectedProduct.platform}</span>
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              {selectedProduct.shortDesc || '暂无详细描述'}
            </p>
          </div>
        </div>

        <div className="flex flex-col relative">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onReset={() => {
              setSearchQuery("");
              setCustomMinPrice("");
              setCustomMaxPrice("");
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
