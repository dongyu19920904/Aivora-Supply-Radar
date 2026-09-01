import { Metadata } from 'next';
import React from 'react';
import { DEFAULT_SHARE_IMAGE } from '@/lib/site';

const title = 'AI账号卖家货源｜卡网渠道报价与库存聚合 - 爱窝啦·货源雷达';
const description = '为 AI 账号卖家聚合 ChatGPT、Claude、Gemini、Grok、Cursor 等公开渠道报价、库存与更新时间，覆盖代充、成品号、接码、邮箱和账号等数字商品。';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/card-products' },
  openGraph: {
    title,
    description,
    url: '/card-products',
    type: 'website',
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    title,
    description,
    images: [DEFAULT_SHARE_IMAGE],
  },
};

export default function CardProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
