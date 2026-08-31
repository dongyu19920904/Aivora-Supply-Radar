import { cache } from 'react';

import type { ProductType } from '../data';
import { mergeCanonicalCatalogProducts } from './product-canonicalization';
import { supabase } from './supabase';

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
  lowest_price: number | string | null;
  warranty_price: number | string | null;
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

export function mapCatalogSummaryRows(rows: readonly CatalogSummaryRow[]): ProductType[] {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    platform: row.platform_name || row.platform_id,
    lowestPrice: row.lowest_price === null ? null : Number(row.lowest_price),
    warrantyPrice: row.warranty_price === null ? null : Number(row.warranty_price),
    channelCount: Number(row.channel_count || 0),
    updatedAt: row.latest_offer_at,
    shortDesc: row.short_desc,
    searchKeywords: row.search_keywords || [],
    sort_order: row.sort_order || 0,
    display_id: row.display_id,
    platform_sort_order: row.platform_sort_order || 0,
  }));
}

export const listCatalogSummaryProducts = cache(async (): Promise<ProductType[]> => {
  try {
    const summaryResponse = await supabase.rpc('get_product_catalog_summary');
    if (!summaryResponse.error) {
      return mergeCanonicalCatalogProducts(mapCatalogSummaryRows((summaryResponse.data || []) as CatalogSummaryRow[]));
    }

    console.warn('Catalog summary RPC unavailable; returning catalog without price aggregates:', summaryResponse.error.message);
    const fallback = await supabase
      .from('product_catalog')
      .select('id, slug, name, short_desc, search_keywords, platform_id, sort_order, display_id, product_platforms(name, sort_order)')
      .eq('is_active', true);
    if (fallback.error) {
      console.warn('Catalog fallback unavailable:', fallback.error.message);
      return [];
    }

    return mergeCanonicalCatalogProducts(((fallback.data || []) as unknown as CatalogFallbackRow[]).map((row) => {
      const platform = firstRelation(row.product_platforms);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        platform: platform?.name || row.platform_id,
        lowestPrice: null,
        warrantyPrice: null,
        channelCount: 0,
        updatedAt: null,
        shortDesc: row.short_desc,
        searchKeywords: row.search_keywords || [],
        sort_order: row.sort_order || 0,
        display_id: row.display_id,
        platform_sort_order: platform?.sort_order || 0,
      };
    }));
  } catch (error) {
    console.warn('Catalog data unavailable:', error instanceof Error ? error.message : 'unknown');
    return [];
  }
});
