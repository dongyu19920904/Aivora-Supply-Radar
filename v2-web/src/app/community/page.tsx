import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, MessageSquareText, Newspaper, Store } from 'lucide-react';
import { SubmitChannelButton } from '@/components/SubmitChannelButton';
import { PROJECT_REPOSITORY_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '货源情报社区 | 爱窝啦·货源雷达',
  description: '面向 AI 账号卖家和渠道方的货源提交、商机讨论、错误反馈与项目建议入口。',
  alternates: { canonical: '/community' },
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl"><span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><MessageSquareText className="h-4 w-4" />共同改善货源质量</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">货源情报社区</h1><p className="mt-4 leading-7 text-gray-600">社区入口按用途拆开：货源进入审核队列，商机回到日报证据链，代码与功能问题进入公开项目。这样反馈能真正落到数据和产品改进上。</p></header>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><Store className="h-6 w-6 text-emerald-600" /><h2 className="mt-4 text-lg font-bold">提交货源</h2><p className="mt-2 min-h-20 text-sm leading-6 text-gray-600">商家提交公开渠道、商品结构和联系方式，审核通过后进入采集测试。</p><SubmitChannelButton className="mt-5 font-semibold text-emerald-700 hover:text-emerald-800">打开提交表单 →</SubmitChannelButton></section>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><Newspaper className="h-6 w-6 text-blue-600" /><h2 className="mt-4 text-lg font-bold">讨论商机</h2><p className="mt-2 min-h-20 text-sm leading-6 text-gray-600">从已核验日报出发讨论需求、毛利、售后和停止条件，避免脱离证据追热点。</p><Link href="/opportunities" className="mt-5 inline-block font-semibold text-blue-700 hover:text-blue-800">查看账号商机 →</Link></section>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><Github className="h-6 w-6 text-gray-900" /><h2 className="mt-4 text-lg font-bold">功能与代码建议</h2><p className="mt-2 min-h-20 text-sm leading-6 text-gray-600">可复现的页面问题、采集适配器建议和开源贡献进入项目仓库统一跟踪。</p><a href={PROJECT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-semibold text-gray-900 hover:text-emerald-700">访问项目仓库 →</a></section>
        </div>
      </div>
    </main>
  );
}
