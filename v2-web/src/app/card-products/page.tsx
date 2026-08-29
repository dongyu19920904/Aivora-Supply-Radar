import React from 'react';
import { supabase } from '../../lib/supabase';
import { ProductType } from '../../data';
import { CardProductsClient } from './CardProductsClient';
import { getChannelProviderCount } from '../actions';

export const revalidate = 300; // 5分钟静态重生成

interface CatalogSummaryRow {
  id: string;
  slug: string;
  name: string;
  short_desc: string;
  search_keywords: string[];
  platform_id: string;
  sort_order: number;
  display_id: string;
  platform_name: string;
  platform_sort_order: number;
  lowest_price: number | string;
  warranty_price: number | string;
  channel_count: number | string;
  latest_offer_at: string | null;
}

interface CatalogFallbackRow {
  id: string;
  slug: string;
  name: string;
  short_desc: string;
  search_keywords: string[];
  platform_id: string;
  sort_order: number;
  display_id: string;
  product_platforms: { name: string; sort_order: number } | { name: string; sort_order: number }[] | null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
}

export default async function CardProductsPage() {
  const [summaryResponse, platformCount] = await Promise.all([
    supabase.rpc('get_product_catalog_summary'),
    getChannelProviderCount(),
  ]);

  let mappedTypes: ProductType[];
  if (!summaryResponse.error) {
    mappedTypes = ((summaryResponse.data || []) as CatalogSummaryRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      platform: row.platform_name || row.platform_id,
      lowestPrice: Number(row.lowest_price || 0),
      warrantyPrice: Number(row.warranty_price || 0),
      channelCount: Number(row.channel_count || 0),
      updatedAt: row.latest_offer_at,
      shortDesc: row.short_desc,
      searchKeywords: row.search_keywords || [],
      sort_order: row.sort_order || 0,
      display_id: row.display_id,
      platform_sort_order: row.platform_sort_order || 0,
    }));
  } else {
    console.warn('Catalog summary RPC unavailable; returning catalog without price aggregates:', summaryResponse.error.message);
    const fallback = await supabase
      .from('product_catalog')
      .select('id, slug, name, short_desc, search_keywords, platform_id, sort_order, display_id, product_platforms(name, sort_order)')
      .eq('is_active', true);

    mappedTypes = ((fallback.data || []) as unknown as CatalogFallbackRow[]).map((row) => {
      const platform = firstRelation(row.product_platforms);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        platform: platform?.name || row.platform_id,
        lowestPrice: 0,
        warrantyPrice: 0,
        channelCount: 0,
        updatedAt: null,
        shortDesc: row.short_desc,
        searchKeywords: row.search_keywords || [],
        sort_order: row.sort_order || 0,
        display_id: row.display_id,
        platform_sort_order: platform?.sort_order || 0,
      };
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <React.Suspense fallback={<div className="py-8 text-center text-gray-500">Loading products...</div>}>
        <CardProductsClient initialProducts={mappedTypes} platformCount={platformCount} />
      </React.Suspense>
    </main>
  );
}
