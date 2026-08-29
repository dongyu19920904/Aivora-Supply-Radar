import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { ChannelDetailClient } from './ChannelDetailClient';
import { JsonLd } from '@/components/JsonLd';
import { absoluteUrl } from '@/lib/site';
import { fetchAllSupabasePages } from '@/lib/supabase-pagination';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

interface ChannelOfferRow {
  id: string;
  product_title: string;
  price: number | string | null;
  status: string;
  url: string;
  updated_at: string;
  product_catalog: { name: string; product_platforms: { name: string } | { name: string }[] | null } | { name: string; product_platforms: { name: string } | { name: string }[] | null }[] | null;
}

async function listChannelOffers(channelId: string): Promise<ChannelOfferRow[]> {
  return fetchAllSupabasePages(async (from, to) => {
    const { data, error } = await supabaseAdmin
      .from('market_offers')
      .select('id, product_title, price, status, url, updated_at, product_catalog(name, product_platforms(name))')
      .eq('target_id', channelId)
      .eq('status', 'in_stock')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data || []) as unknown as ChannelOfferRow[];
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  const { data: channel } = await supabaseAdmin
    .from('crawler_targets')
    .select('name')
    .eq('id', id)
    .single();

  if (!channel) {
    return { title: '渠道未找到 - 爱窝啦·货源雷达' };
  }

  return {
    title: `${channel.name} 渠道收录详情 - 爱窝啦·货源雷达`,
    description: `查看 ${channel.name} 渠道收录的所有商品、分类及价格信息。`,
    alternates: { canonical: `/channels/${id}` },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `${channel.name} 渠道收录详情 - 爱窝啦·货源雷达`,
      description: `查看 ${channel.name} 渠道收录的所有商品、分类及价格信息。`,
      url: `/channels/${id}`,
      type: 'website',
    },
  };
}

export default async function ChannelDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const { data: channel } = await supabaseAdmin
    .from('crawler_targets')
    .select('id, name, scraper_type, created_at, updated_at')
    .eq('id', id)
    .single();

  if (!channel) {
    notFound();
  }

  // Fetch offers for this channel
  const offersData = await listChannelOffers(id);

  const mappedOffers = offersData.map((offer) => {
    const productData = Array.isArray(offer.product_catalog) ? offer.product_catalog[0] : offer.product_catalog;
    const platformData = productData?.product_platforms;
    const platformName = Array.isArray(platformData) ? platformData[0]?.name : platformData?.name;
    const category = productData?.name ? `${platformName || '未知平台'} - ${productData.name}` : '未分类';

    return {
      id: offer.id,
      title: offer.product_title,
      price: Number(offer.price || 0),
      url: offer.url,
      updatedAt: offer.updated_at,
      category,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '渠道商', item: absoluteUrl('/channels') },
          { '@type': 'ListItem', position: 2, name: channel.name },
        ],
      }} />
      <React.Suspense fallback={<div className="py-8 text-center text-gray-500">Loading channel details...</div>}>
        <ChannelDetailClient channel={channel} offers={mappedOffers} />
      </React.Suspense>
    </div>
  );
}
