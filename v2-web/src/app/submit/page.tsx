import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, FileJson, ShieldCheck } from 'lucide-react';
import { SubmitChannelButton } from '@/components/SubmitChannelButton';

export const metadata: Metadata = {
  title: '提交货源渠道 | 爱窝啦·货源雷达',
  description: '提交可公开核验的 AI 账号与数字商品货源渠道，进入审核、采集测试和收录流程。',
  robots: { index: false, follow: true },
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <span className="text-sm font-semibold text-emerald-700">商家与货源方入口</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">提交货源渠道</h1>
          <p className="mt-4 max-w-3xl leading-7 text-gray-600">提交公开网站和联系方式即可进入待审核队列。我们会先验证 HTTPS、来源真实性、商品结构与更新稳定性，再决定是否自动采集；不会要求卡密、账号密码、订单或客户资料。</p>
          <SubmitChannelButton className="mt-7 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
            打开渠道提交表单
          </SubmitChannelButton>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="mt-3 font-bold text-gray-950">公开来源</h2><p className="mt-2 text-sm leading-6 text-gray-600">必须有可核验的 HTTPS 页面，不收私密凭证。</p></div>
            <div className="rounded-2xl bg-gray-50 p-5"><FileJson className="h-5 w-5 text-blue-600" /><h2 className="mt-3 font-bold text-gray-950">结构化接入</h2><p className="mt-2 text-sm leading-6 text-gray-600">JSON-LD 或稳定 JSON Feed 更容易快速收录。</p></div>
            <div className="rounded-2xl bg-gray-50 p-5"><CheckCircle2 className="h-5 w-5 text-amber-600" /><h2 className="mt-3 font-bold text-gray-950">审核上线</h2><p className="mt-2 text-sm leading-6 text-gray-600">采集测试通过后才进入公开比价，不自动发布投稿。</p></div>
          </div>

          <p className="mt-7 text-sm text-gray-500">接入前可先阅读 <Link href="/guide/getting-started" className="font-semibold text-blue-700">渠道接入指南</Link> 和 <Link href="/guide/best-practices" className="font-semibold text-blue-700">商品展示建议</Link>。</p>
        </div>
      </div>
    </main>
  );
}
