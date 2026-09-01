"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { CustomDropdown } from '../../components/CustomDropdown';
import { FilterBar } from '../../components/FilterBar';
import type { ProductType } from '../../data';
import { useUrlState } from '../../hooks/useUrlState';
import {
  classifyCatalogProduct,
  getCatalogCategory,
  getCatalogCategoryOptions,
  groupCatalogProducts,
  isCatalogCategoryId,
} from '../../lib/catalog-taxonomy';
import {
  catalogAvailabilityOptions,
  catalogSortOptions,
  filterCatalogAvailability,
  hasActiveCatalogOffer,
  isCatalogAvailability,
  isCatalogSortMode,
  sortCatalogProducts,
} from '../../lib/product-ranking';
import { matchesSearchQuery } from '../../lib/search-query';
import { CatalogGroupSection } from './CatalogGroupSection';

interface CardProductsClientProps {
  initialProducts: ProductType[];
  platformCount: number;
}

export const CardProductsClient: React.FC<CardProductsClientProps> = ({ initialProducts, platformCount }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  const [sortParam, setSortParam] = useUrlState('sort', '');
  const [availabilityParam, setAvailabilityParam] = useUrlState('availability', '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const sortMode = isCatalogSortMode(sortParam) ? sortParam : 'recommended';
  const availability = isCatalogAvailability(availabilityParam) ? availabilityParam : 'all';
  const availableCount = useMemo(
    () => initialProducts.filter(hasActiveCatalogOffer).length,
    [initialProducts],
  );
  const unavailableCount = initialProducts.length - availableCount;
  const categoryOptions = useMemo(() => getCatalogCategoryOptions(initialProducts), [initialProducts]);

  useEffect(() => {
    const handleHashChange = () => {
      const decodedHash = decodeURIComponent(window.location.hash.slice(1)).toLowerCase();
      if (!decodedHash) {
        setSelectedCategory('');
        return;
      }
      const matchedCategory = categoryOptions.find((option) => (
        option.value.toLowerCase() === decodedHash || option.label.toLowerCase() === decodedHash
      ));
      setSelectedCategory(matchedCategory?.value || '');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [categoryOptions]);

  const handleCategoryChange = (value: string) => {
    const category = isCatalogCategoryId(value) ? value : '';
    setSelectedCategory(category);
    const baseUrl = window.location.pathname + window.location.search;
    router.replace(category ? `${baseUrl}#${category}` : baseUrl, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    const matchingProducts = initialProducts.filter((product) => {
      const categoryId = classifyCatalogProduct(product);
      const category = getCatalogCategory(categoryId);
      const matchSearch = matchesSearchQuery(
        [product.name, product.platform, category.name, ...(product.searchKeywords ?? [])],
        searchQuery,
      );
      const matchCategory = selectedCategory ? categoryId === selectedCategory : true;
      return matchSearch && matchCategory;
    });

    return sortCatalogProducts(
      filterCatalogAvailability(matchingProducts, availability),
      sortMode,
    );
  }, [searchQuery, selectedCategory, initialProducts, availability, sortMode]);

  const groupedProducts = useMemo(() => {
    return groupCatalogProducts(filteredProducts).reduce<Array<ReturnType<typeof groupCatalogProducts>[number] & { startIndex: number }>>(
      (result, group) => {
        const previous = result.at(-1);
        const startIndex = previous ? previous.startIndex + previous.products.length : 0;
        return [...result, { ...group, startIndex }];
      },
      [],
    );
  }, [filteredProducts]);

  return (
    <div className="relative">
      <div className="mb-6 pt-2 text-center sm:mb-8 sm:pt-4">
        <span className="radar-kicker">Subscription marketplace</span>
        <h1 className="market-display mx-auto mt-3 max-w-3xl text-3xl sm:text-5xl">AI 订阅货源市场</h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
          先选标准商品，再比较同类渠道。ChatGPT 等热门平台排在前面，可采购商品优先，无货商品在分类内沉底。
        </p>
        <nav className="mx-auto mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-gray-200 bg-white p-1" aria-label="货源市场视图">
          <Link href="/card-products" aria-current="page" className="whitespace-nowrap rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">标准商品</Link>
          <Link href="/card-products/all" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-950">全部报价</Link>
          <Link href="/channels" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-950">渠道商</Link>
        </nav>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4" aria-label="标准商品数据概览">
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-950">{initialProducts.length}</div>
          <div className="mt-0.5 text-xs text-gray-500">标准商品</div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-emerald-700">{availableCount}</div>
          <div className="mt-0.5 text-xs text-gray-500">当前可采购</div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-600">{unavailableCount}</div>
          <div className="mt-0.5 text-xs text-gray-500">暂无可采购报价</div>
        </div>
        <Link href="/channels" className="group bg-white px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500">
          <div className="font-mono text-xl font-bold tabular-nums text-gray-950">{platformCount}</div>
          <div className="mt-0.5 text-xs text-gray-500 group-hover:text-gray-900">公开渠道 →</div>
        </Link>
      </div>

      <div className="relative flex flex-col">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReset={() => {
            setSearchQuery('');
            setSortParam('');
            setAvailabilityParam('');
            handleCategoryChange('');
          }}
          searchPlaceholder="搜索商品或分类（-关键词可排除）"
          searchHelp="排除不想看的结果：在词语前加“-”。例如输入“-共享”，就不会显示含“共享”的商品。"
        >
          <CustomDropdown
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={categoryOptions.map((option) => ({
              value: option.value,
              label: `${option.label} · ${option.count}`,
            }))}
            placeholder="所有平台"
            allOptionLabel="所有平台"
            ariaLabel="平台分类筛选"
          />
        </FilterBar>

        <nav className="mb-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2" aria-label="热门平台分类">
          <div className="flex min-w-max gap-1.5">
            <button
              type="button"
              data-catalog-category-filter="all"
              aria-pressed={!selectedCategory}
              onClick={() => handleCategoryChange('')}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                !selectedCategory ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
            >
              全部分类 <span className="font-mono tabular-nums">{initialProducts.length}</span>
            </button>
            {categoryOptions.map((option) => {
              const active = selectedCategory === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-catalog-category-filter={option.value}
                  aria-pressed={active}
                  onClick={() => handleCategoryChange(option.value)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    active ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                  }`}
                >
                  {option.label} <span className="font-mono tabular-nums">{option.count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
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
                    onClick={() => setAvailabilityParam(option.value === 'all' ? '' : option.value)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                      active
                        ? 'bg-emerald-700 text-white'
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
            <span className="sr-only sm:not-sr-only">分类内排序</span>
            <select
              aria-label="商品排序"
              value={sortMode}
              onChange={(event) => setSortParam(event.target.value === 'recommended' ? '' : event.target.value)}
              className="h-8 max-w-28 rounded-md border border-gray-300 bg-white px-2 pr-7 text-xs font-semibold text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:h-9 sm:max-w-none sm:px-3 sm:pr-8 sm:text-sm"
            >
              {catalogSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
          <span>
            找到 <strong className="font-mono tabular-nums text-gray-900">{filteredProducts.length}</strong> 个商品，分为{' '}
            <strong className="font-mono tabular-nums text-gray-900">{groupedProducts.length}</strong> 类
          </span>
          <span>分类顺序固定；推荐、渠道、价格和更新时间只在分类内部排序</span>
        </div>

        {groupedProducts.length ? (
          <div className="space-y-10" data-catalog-grouped-view>
            {groupedProducts.map((group, index) => (
              <CatalogGroupSection
                key={group.category.id}
                category={group.category}
                products={group.products}
                startIndex={group.startIndex}
                order={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            没有找到对应的商品；可以清空分类、库存状态或排除关键词后再试。
          </div>
        )}
      </div>
    </div>
  );
};
