"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ProductType } from '../../data';
import { MasterTable } from '../../components/MasterTable';
import { FilterBar } from '../../components/FilterBar';
import { CustomDropdown } from '../../components/CustomDropdown';
import { useUrlState } from '../../hooks/useUrlState';
import { useRouter } from 'next/navigation';
import { matchesSearchQuery } from '../../lib/search-query';
import {
  catalogAvailabilityOptions,
  catalogSortOptions,
  filterCatalogAvailability,
  hasActiveCatalogOffer,
  isCatalogAvailability,
  isCatalogSortMode,
  sortCatalogProducts,
} from '../../lib/product-ranking';

interface CardProductsClientProps {
  initialProducts: ProductType[];
  platformCount: number;
}

const INITIAL_VISIBLE_PRODUCTS = 24;
const VISIBLE_PRODUCTS_STEP = 24;

export const CardProductsClient: React.FC<CardProductsClientProps> = ({ initialProducts, platformCount }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  const [sortParam, setSortParam] = useUrlState('sort', '');
  const [availabilityParam, setAvailabilityParam] = useUrlState('availability', '');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const sortMode = isCatalogSortMode(sortParam) ? sortParam : 'recommended';
  const availability = isCatalogAvailability(availabilityParam) ? availabilityParam : 'all';
  const availableCount = useMemo(
    () => initialProducts.filter(hasActiveCatalogOffer).length,
    [initialProducts],
  );
  const unavailableCount = initialProducts.length - availableCount;
  
  const availablePlatforms = useMemo(() => {
    const platformMap = new Map<string, number>();
    initialProducts.forEach(p => {
      if (!platformMap.has(p.platform)) {
        platformMap.set(p.platform, p.platform_sort_order ?? 9999);
      }
    });
    return Array.from(platformMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
  }, [initialProducts]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const decodedHash = decodeURIComponent(hash.substring(1)).toLowerCase();
        const matchedPlatform = availablePlatforms.find(p => p.toLowerCase() === decodedHash);
        if (matchedPlatform) {
          setSelectedPlatform(matchedPlatform);
        } else {
          setSelectedPlatform('');
        }
      } else {
        setSelectedPlatform('');
      }
      setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [availablePlatforms]);

  const handlePlatformChange = (val: string) => {
    setSelectedPlatform(val);
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
    const baseUrl = window.location.pathname + window.location.search;
    const targetUrl = val ? `${baseUrl}#${encodeURIComponent(val)}` : baseUrl;
    router.replace(targetUrl, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    const matchingProducts = initialProducts.filter(p => {
      const matchSearch = matchesSearchQuery(
        [p.name, p.platform, ...(p.searchKeywords ?? [])],
        searchQuery,
      );
      const matchPlatform = selectedPlatform ? p.platform === selectedPlatform : true;
      
      return matchSearch && matchPlatform;
    });

    return sortCatalogProducts(
      filterCatalogAvailability(matchingProducts, availability),
      sortMode,
    );
  }, [searchQuery, selectedPlatform, initialProducts, availability, sortMode]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="relative">
      <div className="mb-6 pt-2">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center mb-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            AI 订阅比价与卡网渠道报价聚合
          </h1>
          <Link
            href="/card-products/all"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-500 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            查看全部报价
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>
        <p className="text-sm text-gray-500 max-w-4xl leading-relaxed">
          先看当前可购买的核心 AI 商品，再按可购买报价数和更新时间判断。推荐排序不代表销量或收益承诺，购买或上架前仍需打开详情核验交付、售后与原始链接。
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-4" aria-label="标准商品数据概览">
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-950">{initialProducts.length}</div>
          <div className="mt-0.5 text-xs text-gray-500">标准商品，完整保留</div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-emerald-700">{availableCount}</div>
          <div className="mt-0.5 text-xs text-gray-500">当前可购买商品</div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-600">{unavailableCount}</div>
          <div className="mt-0.5 text-xs text-gray-500">暂不可购买，排在后面</div>
        </div>
        <Link href="/channels" className="group bg-white px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-950">{platformCount}</div>
          <div className="mt-0.5 text-xs text-gray-500 group-hover:text-gray-900">渠道来源，查看目录 →</div>
        </Link>
      </div>

      <div className="flex flex-col relative">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
          }}
          onReset={() => {
            setSearchQuery("");
            setSortParam("");
            setAvailabilityParam("");
            handlePlatformChange("");
          }}
          searchPlaceholder="搜索商品或平台（-关键词可排除）"
          searchHelp="排除不想看的结果：在词语前加“-”。例如输入“-共享”，就不会显示含“共享”的商品。"
        >
          <CustomDropdown
            value={selectedPlatform}
            onChange={handlePlatformChange}
            options={availablePlatforms.map(platform => ({ value: platform, label: platform }))}
            placeholder="所有平台"
            allOptionLabel="所有平台"
          />
        </FilterBar>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden shrink-0 text-xs font-semibold text-gray-500 sm:inline">报价状态</span>
            <div className="flex flex-wrap gap-1" role="group" aria-label="按报价状态筛选">
              {catalogAvailabilityOptions.map((option) => {
                const count = option.value === 'available'
                  ? availableCount
                  : option.value === 'unavailable'
                    ? unavailableCount
                    : initialProducts.length;
                const active = availability === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAvailabilityParam(option.value === 'all' ? '' : option.value);
                      setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
                    }}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${
                      active
                        ? 'bg-gray-950 text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-950'
                    }`}
                  >
                    <span className="sm:hidden">
                      {option.value === 'available' ? '可买' : option.value === 'unavailable' ? '待补' : '全部'}
                    </span>
                    <span className="hidden sm:inline">{option.label}</span>{' '}
                    <span className="font-mono tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="sr-only sm:not-sr-only">排序</span>
            <select
              aria-label="商品排序"
              value={sortMode}
              onChange={(event) => {
                setSortParam(event.target.value === 'recommended' ? '' : event.target.value);
                setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
              }}
              className="h-8 max-w-28 rounded-md border border-gray-300 bg-white px-2 pr-7 text-xs font-semibold text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:h-9 sm:max-w-none sm:px-3 sm:pr-8 sm:text-sm"
            >
              {catalogSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-3 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
          <span>
            当前显示 <strong className="font-mono tabular-nums text-gray-900">{visibleProducts.length}</strong>
            {' / '}
            <strong className="font-mono tabular-nums text-gray-900">{filteredProducts.length}</strong> 个匹配商品
          </span>
          <span>推荐规则：可购买 → 核心 AI 商品 → 报价覆盖 → 更新时间</span>
        </div>
        
        <div className="min-h-[400px] relative">
          <MasterTable products={visibleProducts} />
        </div>

        {visibleProducts.length < filteredProducts.length && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + VISIBLE_PRODUCTS_STEP)}
              className="whitespace-nowrap rounded-md border border-gray-400 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
            >
              加载更多（已显示 {visibleProducts.length} / {filteredProducts.length}）
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
