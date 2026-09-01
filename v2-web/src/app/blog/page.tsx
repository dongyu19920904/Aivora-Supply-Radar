import { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/notion';
import BlogListClient from './BlogListClient';
import { DEFAULT_SHARE_IMAGE } from '@/lib/site';
import { blogCoverThumbnailUrl } from '@/lib/blog-cover';

export const metadata: Metadata = {
  title: '博客 | 爱窝啦·货源雷达',
  description: '爱窝啦·货源雷达官方博客为 AI 账号卖家提供货源核验、交付风控、售后边界、经营复盘和平台更新。',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: '爱窝啦·货源雷达 博客｜AI账号卖家经营指南',
    description: '获取货源核验、交付风控、售后边界、经营复盘和平台更新。',
    type: 'website',
    url: '/blog',
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: '爱窝啦·货源雷达 博客｜AI账号卖家经营指南',
    description: '获取货源核验、交付风控、售后边界、经营复盘和平台更新。',
    images: [DEFAULT_SHARE_IMAGE],
  },
};

// Refresh the public blog snapshot once per day.
export const revalidate = 86400;

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const postsWithStableCovers = posts.map(post => ({
    ...post,
    cover: blogCoverThumbnailUrl(post),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">博客</h1>
            <p className="text-xs text-gray-500">查看卖家经营方法、货源核验和平台更新</p>
          </div>
        </div>

        {(!process.env.NOTION_API_KEY || !process.env.NOTION_BLOG_DATABASE_ID) && (
          <div className="mb-8 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm">
            <strong>未配置 Notion 环境变量</strong>：请在 `.env.local` 中配置 `NOTION_API_KEY` 和 `NOTION_BLOG_DATABASE_ID` 以获取真实的博客数据。
          </div>
        )}

        <BlogListClient initialPosts={postsWithStableCovers} />
      </div>
    </div>
  );
}
