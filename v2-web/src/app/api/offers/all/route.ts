import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import {
  encodeOfferCursor,
  OfferCursor,
  parseOfferQuery,
  PublicOfferStatus,
} from '../../../../lib/offer-query';

export const dynamic = 'force-dynamic';

interface CatalogRow {
  id: string;
  name: string;
  platform_id: string;
  sort_order: number | null;
  product_platforms:
    | { name: string; sort_order: number | null }
    | { name: string; sort_order: number | null }[]
    | null;
}

interface TargetRow {
  id: string;
}

interface MarketOfferRow {
  id: string;
  product_title: string | null;
  price: number | string | null;
  status: PublicOfferStatus;
  url: string;
  updated_at: string;
  canonical_product_id: string | null;
  crawler_targets: { name: string; scraper_type: string | null } | { name: string; scraper_type: string | null }[] | null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = parseOfferQuery(url.searchParams);
    const allTerms = [...new Set([...params.searchTerms, ...params.excludedTerms])];

    const [catalogResponse, targetMatches] = await Promise.all([
      supabase
        .from('product_catalog')
        .select('id, name, platform_id, sort_order, product_platforms(name, sort_order)')
        .eq('is_active', true),
      Promise.all(allTerms.map(async (term) => [term, await findTargetIds(term)] as const)),
    ]);

    if (catalogResponse.error) throw catalogResponse.error;

    const catalogRows = (catalogResponse.data || []) as unknown as CatalogRow[];
    const catalogMap = new Map(catalogRows.map((row) => [row.id, row]));
    const eligibleCatalogIds = catalogRows
      .filter((row) => {
        const platform = firstRelation(row.product_platforms)?.name || row.platform_id;
        return (!params.platform || platform === params.platform)
          && (!params.category || row.name === params.category);
      })
      .map((row) => row.id);

    if ((params.platform || params.category) && eligibleCatalogIds.length === 0) {
      return NextResponse.json(
        { items: [], pageInfo: { hasMore: false, nextCursor: null } },
        { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
      );
    }

    let offersQuery = supabase
      .from('market_offers')
      .select('id, product_title, price, status, url, updated_at, canonical_product_id, target_id, crawler_targets(name, scraper_type)')
      .neq('status', 'blacklisted');

    if (params.status) offersQuery = offersQuery.eq('status', params.status);
    if (params.platform || params.category) offersQuery = offersQuery.in('canonical_product_id', eligibleCatalogIds);

    if (params.cursor) {
      const { status, updatedAt, id } = params.cursor;
      offersQuery = offersQuery.or(
        `status.gt.${status},and(status.eq.${status},updated_at.lt.${updatedAt}),and(status.eq.${status},updated_at.eq.${updatedAt},id.lt.${id})`,
      );
    }

    const matchingTargets = new Map(targetMatches);
    for (const term of params.searchTerms) {
      const targetIds = matchingTargets.get(term) || [];
      const targetFilter = targetIds.length ? `,target_id.in.(${targetIds.join(',')})` : '';
      offersQuery = offersQuery.or(`product_title.ilike.%${term}%${targetFilter}`);
    }

    for (const term of params.excludedTerms) {
      offersQuery = offersQuery.not('product_title', 'ilike', `%${term}%`);
      const targetIds = matchingTargets.get(term) || [];
      if (targetIds.length) offersQuery = offersQuery.not('target_id', 'in', `(${targetIds.join(',')})`);
    }

    const { data, error } = await offersQuery
      .order('status', { ascending: true })
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(params.limit + 1);

    if (error) throw error;

    const offerRows = (data || []) as unknown as MarketOfferRow[];
    const hasMore = offerRows.length > params.limit;
    const visibleRows = offerRows.slice(0, params.limit);
    const items = visibleRows.map((row) => {
      const catalogItem = row.canonical_product_id ? catalogMap.get(row.canonical_product_id) : null;
      const platform = firstRelation(catalogItem?.product_platforms || null);
      const channel = firstRelation(row.crawler_targets);

      return {
        id: row.id,
        title: row.product_title || '未命名商品',
        price: Number(row.price || 0),
        status: row.status,
        url: row.url,
        updatedAt: row.updated_at,
        shopName: channel?.name || '未知渠道',
        category: catalogItem?.name || '未分类',
        platform: platform?.name || catalogItem?.platform_id || '未知平台',
        platformSortOrder: platform?.sort_order ?? 9999,
        productSortOrder: catalogItem?.sort_order ?? 9999,
      };
    });

    const lastRow = visibleRows.at(-1);
    const nextCursor: OfferCursor | null = hasMore && lastRow
      ? {
          status: lastRow.status,
          updatedAt: new Date(lastRow.updated_at).toISOString(),
          id: lastRow.id,
        }
      : null;

    return NextResponse.json(
      {
        items,
        pageInfo: {
          hasMore,
          nextCursor: nextCursor ? encodeOfferCursor(nextCursor) : null,
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('Failed to fetch paginated offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
