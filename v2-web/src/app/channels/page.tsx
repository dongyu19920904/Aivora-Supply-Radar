import React from 'react';
import { Metadata } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { ChannelsClient } from './ChannelsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '渠道商 - 爱窝啦·货源雷达',
  description: '查看所有收录的活跃的爬取渠道，获取最新的AI订阅和充值账号来源。',
  alternates: { canonical: '/channels' },
};

interface ChannelRow {
  id: string;
  name: string;
  scraper_type: string;
  created_at: string;
  updated_at: string;
  product_count?: number | string | null;
  productCount: number;
}

export default async function ChannelsPage() {
  let channelsWithCounts: ChannelRow[] = [];
  try {
    const summary = await supabaseAdmin.rpc('get_active_channel_summary');
    channelsWithCounts = ((summary.data || []) as Omit<ChannelRow, 'productCount'>[]).map((target) => ({
      ...target,
      productCount: Number(target.product_count || 0),
    }));

    if (summary.error) {
      console.warn('Channel summary RPC unavailable; using a bounded channel fallback:', summary.error.message);
      const fallback = await supabaseAdmin.from('crawler_targets').select('id, name, scraper_type, created_at, updated_at').eq('is_active', true).order('updated_at', { ascending: false }).limit(1_000);
      channelsWithCounts = ((fallback.data || []) as Omit<ChannelRow, 'productCount'>[]).map((target) => ({ ...target, productCount: 0 }));
    }
  } catch (error) {
    console.warn('Channel list unavailable:', error instanceof Error ? error.message : 'unknown');
  }

  return (
    <main className="market-page py-8 sm:py-12"><div className="market-shell">
      <React.Suspense fallback={<div className="py-8 text-center text-gray-500">正在加载渠道目录…</div>}>
        <ChannelsClient initialChannels={channelsWithCounts} />
      </React.Suspense>
    </div></main>
  );
}
