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

export default async function ChannelsPage() {
  const summary = await supabaseAdmin.rpc('get_active_channel_summary');
  let channelsWithCounts = (summary.data || []).map((target) => ({
    ...target,
    productCount: Number(target.product_count || 0),
  }));

  if (summary.error) {
    console.error('Channel summary RPC unavailable; using a bounded channel fallback:', summary.error);
    const fallback = await supabaseAdmin.from('crawler_targets').select('id, name, scraper_type, created_at, updated_at').eq('is_active', true).order('updated_at', { ascending: false }).limit(1_000);
    channelsWithCounts = (fallback.data || []).map((target) => ({ ...target, productCount: 0 }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <React.Suspense fallback={<div className="py-8 text-center text-gray-500">Loading channels...</div>}>
        <ChannelsClient initialChannels={channelsWithCounts} />
      </React.Suspense>
    </div>
  );
}
