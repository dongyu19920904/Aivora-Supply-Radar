"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FilterBar } from '../../../components/FilterBar';
import { CustomDropdown } from '../../../components/CustomDropdown';
import { BackButton } from '../../../components/BackButton';
import { StickyHeaderAddon } from '../../../components/StickyHeaderAddon';
import { FeedbackModal } from '../../../components/FeedbackModal';
import { BuyDisclaimerModal } from '../../../components/BuyDisclaimerModal';
import { YoufenkAffiliateBanner } from '../../../components/YoufenkAffiliateAd';
import { useBuyAction } from '../../../hooks/useBuyAction';
import { DetailTable } from '../../../components/DetailTable';
import type { ProductDetail } from '../../../data';
import { useUrlState } from '../../../hooks/useUrlState';

export interface OfferItem {
  id: string;
  title: string;
  price: number;
  status: string;
  url: string;
  updatedAt: string;
  shopName: string;
  category: string;
  platform: string;
  platformSortOrder: number;
  productSortOrder: number;
}

export interface CategoryFilterOption {
  name: string;
  platform: string;
  sortOrder: number;
  platformSortOrder: number;
}

interface OffersPageResponse {
  items: OfferItem[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

interface AllProductsClientProps {
  initialCategories: CategoryFilterOption[];
}

export const AllProductsClient: React.FC<AllProductsClientProps> = ({ initialCategories }) => {
  const [initialItems, setInitialItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  const [selectedPlatform, setSelectedPlatform] = useUrlState('platform', '');
  const [selectedCategory, setSelectedCategory] = useUrlState('category', '');
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [feedbackModalItem, setFeedbackModalItem] = useState<OfferItem | null>(null);
  
  const { isBuyModalOpen, handleBuyClick, handleBuyConfirm, handleBuyCancel } = useBuyAction();

  const onBuyClick = (item: OfferItem) => {
    handleBuyClick(item.url, item.shopName);
  };

  const buildRequestUrl = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams({ limit: '50' });
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedPlatform) params.set('platform', selectedPlatform);
    if (selectedCategory) params.set('category', selectedCategory);
    if (cursor) params.set('cursor', cursor);
    return `/api/offers/all?${params.toString()}`;
  }, [searchQuery, selectedPlatform, selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await fetch(buildRequestUrl(), { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json() as OffersPageResponse;
        setInitialItems(Array.isArray(result.items) ? result.items : []);
        setNextCursor(result.pageInfo?.nextCursor || null);
        setHasMore(Boolean(result.pageInfo?.hasMore));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching product page:', error);
          setInitialItems([]);
          setNextCursor(null);
          setHasMore(false);
          setLoadError('货源数据暂时无法加载，请稍后重试。');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [buildRequestUrl]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError('');

    try {
      const response = await fetch(buildRequestUrl(nextCursor));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json() as OffersPageResponse;
      setInitialItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...result.items.filter((item) => !knownIds.has(item.id))];
      });
      setNextCursor(result.pageInfo?.nextCursor || null);
      setHasMore(Boolean(result.pageInfo?.hasMore));
    } catch (error) {
      console.error('Error fetching the next product page:', error);
      setLoadError('下一页加载失败，请重试。');
    } finally {
      setLoadingMore(false);
    }
  }, [buildRequestUrl, loadingMore, nextCursor]);

  const availablePlatforms = useMemo(() => {
    const platformMap = new Map<string, number>();
    initialCategories.forEach(category => {
      const currentOrder = platformMap.get(category.platform);
      if (currentOrder === undefined || category.platformSortOrder < currentOrder) {
        platformMap.set(category.platform, category.platformSortOrder);
      }
    });
    return Array.from(platformMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
  }, [initialCategories]);

  const availableCategories = useMemo(() => {
    const seenCategories = new Set<string>();

    return initialCategories
      .filter(category => !selectedPlatform || category.platform === selectedPlatform)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter(category => {
        if (seenCategories.has(category.name)) return false;
        seenCategories.add(category.name);
        return true;
      })
      .map(category => category.name);
  }, [initialCategories, selectedPlatform]);

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    setSelectedCategory('');
  };

  const productDetails: ProductDetail[] = useMemo(() => {
    return initialItems.map(item => ({
      id: item.id,
      typeId: '',
      status: (item.status === 'in_stock' || item.status === 'out_of_stock' || item.status === 'offline') 
        ? item.status 
        : 'in_stock',
      channel: item.shopName,
      operateTime: item.updatedAt,
      originalName: item.title,
      price: item.price,
      url: item.url,
      updateTime: item.updatedAt,
      risk: 'low',
      platform: item.platform,
      category: item.category
    }));
  }, [initialItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="mb-6 flex flex-col md:flex-row items-start gap-4 md:gap-6 mt-4">
        <BackButton href="/card-products" />
        <div className="flex-1 w-full">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl mb-2 flex items-center gap-3">
            所有渠道所有商品
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            查看 爱窝啦·货源雷达 收录的所有卡网渠道所有商品，涵盖 ChatGPT、Claude、Gemini、Cursor、Grok、Kiro等AI订阅，以及谷歌邮箱、outlook 邮箱以及苹果账号、telegram 账号以及接码服务等。支持多维度价格和平台筛选，快速找到全网最低价。
          </p>
        </div>
      </div>

      <div className="flex flex-col relative space-y-4">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReset={() => {
            setSearchQuery("");
            setSelectedPlatform("");
            setSelectedCategory("");
          }}
          searchPlaceholder="搜索商品或店铺（-关键词可排除）"
          searchHelp="排除不想看的结果：在词语前加“-”。例如输入“-共享”，就不会显示含“共享”的商品。"
          isExpanded={isScrolled}
          collapsedWidth="wide"
          leftAddon={<StickyHeaderAddon title="所有渠道商品" />}
        >
          <CustomDropdown
            value={selectedPlatform}
            onChange={handlePlatformChange}
            options={availablePlatforms.map(platform => ({ value: platform, label: platform }))}
            placeholder="所有平台"
            allOptionLabel="所有平台"
          />
          <div className="hidden lg:block">
            <CustomDropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={availableCategories.map(cat => ({ value: cat, label: cat }))}
              placeholder="所有类目"
              allOptionLabel="所有类目"
            />
          </div>
        </FilterBar>
        
        <div className="min-h-[400px] relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p>正在努力加载海量商品数据，请稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {loadError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
                  {loadError}
                </div>
              )}
              <DetailTable 
                details={productDetails}
                mode="all"
                onBuyClick={(detail) => {
                  const item = initialItems.find(i => i.id === detail.id);
                  if (item) onBuyClick(item);
                }}
                onFeedbackClick={(detail) => {
                  const item = initialItems.find(i => i.id === detail.id);
                  if (item) setFeedbackModalItem(item);
                }}
              />
              {productDetails.length > 0 && (
                <div
                  className="py-6 flex justify-center items-center text-gray-500 text-sm"
                  aria-live="polite"
                >
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-lg border border-emerald-600 bg-white px-6 py-2.5 font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                    >
                      {loadingMore ? '正在加载…' : `加载更多（已显示 ${productDetails.length} 条）`}
                    </button>
                  ) : (
                    `已显示全部 ${productDetails.length} 条商品`
                  )}
                </div>
              )}
              <YoufenkAffiliateBanner className="mx-auto" />
            </div>
          )}
        </div>
      </div>

      <FeedbackModal
        isOpen={!!feedbackModalItem}
        onClose={() => setFeedbackModalItem(null)}
        offerId={feedbackModalItem?.id || ''}
        productName={feedbackModalItem?.title || ''}
        channelName={feedbackModalItem?.shopName || ''}
      />

      <BuyDisclaimerModal 
        isOpen={isBuyModalOpen}
        onClose={handleBuyCancel}
        onConfirm={handleBuyConfirm}
      />
    </div>
  );
};
