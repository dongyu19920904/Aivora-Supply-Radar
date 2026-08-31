import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';
import { parseProductOfferQuery } from '@/lib/product-offer-query';
import {
  productSlugsForCanonical,
  resolveCanonicalProductSlug,
} from '@/lib/product-canonicalization';

export const dynamic = 'force-dynamic';

interface TargetRow {
  id: string;
}

interface OfferRow {
  id: string;
  product_title: string;
  price: number | string | null;
  status: 'in_stock' | 'out_of_stock' | 'offline';
  url: string;
  tags: string[] | null;
  inventory_level: number | null;
  updated_at: string;
  canonical_product_id: string | null;
  crawler_targets: { name: string; scraper_type: string | null; created_at: string } | { name: string; scraper_type: string | null; created_at: string }[] | null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
}

function tagValue(tags: string[] | null, prefix: string, fallback: string): string {
  const tag = tags?.find((value) => value.startsWith(`${prefix}:`));
  return tag ? tag.slice(prefix.length + 1) : fallback;
}

async function findTargetIds(term: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('crawler_targets')
    .select('id')
    .ilike('name', `%${term}%`)
    .limit(200);
  if (error) throw error;
  return ((data || []) as TargetRow[]).map((row) => row.id);
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const canonicalSlug = resolveCanonicalProductSlug(slug);
    const { data: products, error: productError } = await supabase
      .from('product_catalog')
      .select('id,slug,is_active')
      .in('slug', productSlugsForCanonical(canonicalSlug));
    if (productError || !products?.some((product) => product.is_active)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const productIds = products.map((product) => product.id);

    const params = parseProductOfferQuery(new URL(request.url).searchParams);
    const allTerms = [...new Set([...params.searchTerms, ...params.excludedTerms])];
    const targetMatches = new Map(await Promise.all(
      allTerms.map(async (term) => [term, await findTargetIds(term)] as const),
    ));

    let query = supabase
      .from('market_offers')
      .select(
        'id, product_title, price, status, url, tags, inventory_level, updated_at, canonical_product_id, target_id, crawler_targets(name, scraper_type, created_at)',
        { count: 'exact' },
      )
      .in('canonical_product_id', productIds)
      .neq('status', 'blacklisted');

    if (params.minPrice !== null) query = query.gte('price', params.minPrice);
    if (params.maxPrice !== null) query = query.lte('price', params.maxPrice);
    if (params.minInventory !== null) query = query.gte('inventory_level', params.minInventory);
    if (params.updatedWithinHours !== null) {
      const threshold = new Date(Date.now() - params.updatedWithinHours * 60 * 60 * 1_000).toISOString();
      query = query.gte('updated_at', threshold);
    }
    if (params.availability === 'available') query = query.eq('status', 'in_stock');
    if (params.availability === 'unavailable') query = query.in('status', ['out_of_stock', 'offline']);
    for (const term of params.searchTerms) {
      const targetIds = targetMatches.get(term) || [];
      const targetFilter = targetIds.length ? `,target_id.in.(${targetIds.join(',')})` : '';
      query = query.or(`product_title.ilike.%${term}%${targetFilter}`);
    }
    for (const term of params.excludedTerms) {
      query = query.not('product_title', 'ilike', `%${term}%`);
      const targetIds = targetMatches.get(term) || [];
      if (targetIds.length) query = query.not('target_id', 'in', `(${targetIds.join(',')})`);
    }

    const { data, error, count } = await query
      .order('status', { ascending: true })
      .order('price', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(params.offset, params.offset + params.limit - 1);
    if (error) throw error;

    const items = ((data || []) as unknown as OfferRow[]).map((row) => {
      const channel = firstRelation(row.crawler_targets);
      return {
        id: row.id,
        typeId: row.canonical_product_id || '',
        status: row.status,
        channel: channel?.name || '未知渠道',
        channelType: channel?.scraper_type || '未知渠道',
        originalName: row.product_title,
        price: Number(row.price || 0),
        url: row.url,
        updateTime: row.updated_at,
        includedTime: channel?.created_at || tagValue(row.tags, 'includedTime', ''),
        operateTime: tagValue(row.tags, 'operateTime', '1年'),
        risk: tagValue(row.tags, 'risk', 'medium'),
        inventory: row.inventory_level,
      };
    });
    const total = count || 0;

    return NextResponse.json(
      {
        items,
        pageInfo: {
          total,
          hasMore: params.offset + items.length < total,
          nextOffset: params.offset + items.length,
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('Failed to fetch product offers:', error);
    return NextResponse.json({ error: 'Failed to fetch product offers' }, { status: 500 });
  }
}
