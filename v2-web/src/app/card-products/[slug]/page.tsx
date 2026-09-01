import React from 'react';
import { Metadata } from 'next';
import { supabase } from '../../../lib/supabase';
import { ProductDetailClient } from './ProductDetailClient';
import { JsonLd } from '@/components/JsonLd';
import { DEFAULT_SHARE_IMAGE, absoluteUrl } from '@/lib/site';
import { YoufenkAffiliateAd } from '@/components/YoufenkAffiliateAd';
import {
  productSlugsForCanonical,
  resolveCanonicalProductSlug,
} from '@/lib/product-canonicalization';
import { notFound, permanentRedirect } from 'next/navigation';
import { ProductType, ProductDetail } from '../../../data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProductOfferRow {
  id: string;
  product_title: string;
  price: number | string | null;
  status: string;
  url: string;
  tags: string[] | null;
  inventory_level: number | null;
  updated_at: string;
  canonical_product_id: string | null;
  crawler_targets: { name: string; scraper_type: string | null; created_at: string } | { name: string; scraper_type: string | null; created_at: string }[] | null;
}

interface ProductSummaryRow {
  id: string;
  lowest_price: number | string | null;
  warranty_price: number | string | null;
  channel_count: number | string;
  latest_offer_at: string | null;
}

async function getProductSummary(productIds: string[]): Promise<ProductSummaryRow | null> {
  try {
    const { data, error } = await supabase.rpc('get_product_catalog_summary');
    if (error) throw error;
    const rows = ((data || []) as ProductSummaryRow[]).filter((row) => productIds.includes(row.id));
    if (!rows.length) return null;
    const positive = (values: Array<number | string | null>) => {
      const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
      return valid.length ? Math.min(...valid) : null;
    };
    const latest = rows.map((row) => row.latest_offer_at).filter((value): value is string => Boolean(value)).sort().at(-1) || null;
    return {
      id: productIds[0] || rows[0].id,
      lowest_price: positive(rows.map((row) => row.lowest_price)),
      warranty_price: positive(rows.map((row) => row.warranty_price)),
      channel_count: rows.reduce((sum, row) => sum + Number(row.channel_count || 0), 0),
      latest_offer_at: latest,
    };
  } catch (error) {
    console.warn('Product summary unavailable:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

async function listInitialProductOffers(productIds: string[]): Promise<{ rows: ProductOfferRow[]; total: number }> {
  try {
    const { data, error, count } = await supabase
      .from('market_offers')
      .select(
        'id, product_title, price, status, url, tags, inventory_level, updated_at, canonical_product_id, crawler_targets(name, scraper_type, created_at)',
        { count: 'exact' },
      )
      .in('canonical_product_id', productIds)
      .neq('status', 'blacklisted')
      .order('status', { ascending: true })
      .order('price', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(0, 49);
    if (error) throw error;
    return { rows: (data || []) as unknown as ProductOfferRow[], total: count || 0 };
  } catch (error) {
    console.warn('Initial product offers unavailable:', error instanceof Error ? error.message : 'unknown');
    return { rows: [], total: 0 };
  }
}

export const revalidate = 300; // 每5分钟刷新一次静态缓存

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = resolveCanonicalProductSlug(slug);
  let productRows: Array<{ id: string; slug: string; name: string; short_desc: string }> = [];
  try {
    const response = await supabase
      .from('product_catalog')
      .select('id, slug, name, short_desc')
      .in('slug', productSlugsForCanonical(canonicalSlug));
    productRows = (response.data || []) as typeof productRows;
  } catch (error) {
    console.warn('Product metadata unavailable:', error instanceof Error ? error.message : 'unknown');
  }
  const product = productRows?.find((row) => row.slug === canonicalSlug) || productRows?.[0];

  if (!product) {
    return {
      title: '商品未找到 - 爱窝啦·货源雷达',
    };
  }

  const summary = await getProductSummary(productRows.map((row) => row.id));
  const lowestPrice = Number(summary?.lowest_price || 0);
  const channelCount = Number(summary?.channel_count || 0);
  const shortDesc = String(product.short_desc || '').trim();
  const descriptionSubject = (shortDesc || `查看 ${product.name} 的实时渠道报价`).replace(/[。.!！]+$/, '');

  const title = `${product.name}价格对比｜AI订阅卡网渠道比价 - 爱窝啦·货源雷达`;
  const description = channelCount > 0 && lowestPrice > 0
    ? `${descriptionSubject}。爱窝啦·货源雷达当前收录 ${channelCount} 条可采购报价，最低价约 ¥${lowestPrice}，可采购优先并展示库存和更新时间，不参与交易。`
    : `${descriptionSubject}。爱窝啦·货源雷达 聚合公开渠道价格，支持 AI 订阅和数字产品多渠道比价，不参与交易。`;

  return {
    title,
    description,
    alternates: { canonical: `/card-products/${canonicalSlug}` },
    openGraph: {
      title,
      description,
      url: `/card-products/${canonicalSlug}`,
      type: 'website',
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_SHARE_IMAGE],
    },
  };
}

// Helper for extracting tag values
const extractTagValue = (tags: string[] | null, prefix: string, defaultValue: string) => {
  if (!tags || !Array.isArray(tags)) return defaultValue;
  const tag = tags.find(t => t.startsWith(prefix + ':'));
  return tag ? tag.split(':')[1] : defaultValue;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalSlug = resolveCanonicalProductSlug(slug);
  if (slug !== canonicalSlug) permanentRedirect(`/card-products/${canonicalSlug}`);

  // 1. Fetch Product
  let productRows: any[] = [];
  try {
    const response = await supabase
      .from('product_catalog')
      .select('id, slug, name, short_desc, search_keywords, is_active, platform_id, sort_order, display_id, product_platforms(name)')
      .in('slug', productSlugsForCanonical(canonicalSlug));
    productRows = response.data || [];
  } catch (error) {
    console.warn('Product record unavailable:', error instanceof Error ? error.message : 'unknown');
  }
  const productRow = productRows?.find((row) => row.slug === canonicalSlug) || productRows?.[0];

  if (!productRow) {
    notFound();
  }
  const productIds = productRows.map((row) => row.id);

  // 2. Fetch Offers
  const [initialOfferPage, summary] = await Promise.all([
    listInitialProductOffers(productIds),
    getProductSummary(productIds),
  ]);

  const marketQuotes = initialOfferPage.rows;

  // 3. Map to ProductDetail
  const mappedDetails: ProductDetail[] = marketQuotes.map((row: any) => ({
    id: row.id,
    typeId: row.canonical_product_id,
    status: row.status as 'in_stock' | 'out_of_stock' | 'offline',
    channel: row.crawler_targets?.name || '未知渠道',
    channelType: row.crawler_targets?.scraper_type || '未知渠道',
    originalName: row.product_title,
    price: Number(row.price || 0),
    url: row.url,
    updateTime: row.updated_at,
    includedTime: row.crawler_targets?.created_at || extractTagValue(row.tags, 'includedTime', '2026-01-01'),
    operateTime: extractTagValue(row.tags, 'operateTime', '1年'),
    risk: extractTagValue(row.tags, 'risk', 'medium') as 'low' | 'medium' | 'high',
    inventory: row.inventory_level,
  }));

  // 4. Map ProductType
  const lowestPrice = Number(summary?.lowest_price || 0);
  const warrantyPrice = Number(summary?.warranty_price || 0);
  const channelCount = Number(summary?.channel_count || 0);
  const updatedAt = summary?.latest_offer_at || new Date().toISOString();

  // Type workaround for Supabase relation inference
  const platformData: any = productRow.product_platforms;
  const platformName = Array.isArray(platformData) ? platformData[0]?.name : platformData?.name;

  const product: ProductType = {
    id: productRow.id,
    slug: productRow.slug,
    name: productRow.name,
    platform: platformName || productRow.platform_id,
    lowestPrice,
    warrantyPrice,
    channelCount,
    updatedAt,
    shortDesc: productRow.short_desc,
    searchKeywords: productRow.search_keywords || [],
    sort_order: productRow.sort_order || 0,
    display_id: productRow.display_id,
  };
  
  return (
    <main className="market-page relative py-8 sm:py-12"><div className="market-shell">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '卡网商品', item: absoluteUrl('/card-products') },
          { '@type': 'ListItem', position: 2, name: productRow.name },
        ],
      }} />
      <ProductDetailClient
        slug={canonicalSlug}
        initialProduct={product}
        initialDetails={mappedDetails}
        initialTotal={initialOfferPage.total}
      />
      <YoufenkAffiliateAd className="youfenk-affiliate-rail absolute bottom-0 top-12" />
    </div></main>
  );
}
