import type { Metadata } from 'next';
import { Database, RefreshCw, ShieldCheck, Split } from 'lucide-react';

export const metadata: Metadata = {
  title: '数据方法与稳定性边界 | 爱窝啦·货源雷达',
  description: '说明货源采集、标准化、去重、价格快照、异常隔离和账号商机只读接入方法。',
  alternates: { canonical: '/methodology' },
};

const sections = [
  { icon: Database, title: '公开来源与标准商品', body: '每条报价保留原始商品 URL、渠道、价格、库存和采集时间；原始报价与标准商品分开，避免同款换标题后重复计数。' },
  { icon: RefreshCw, title: '连续快照而非伪异动', body: '首次采集只建立基线。只有同一货源后续有效快照发生变化，才显示涨价、降价、补货或下架。' },
  { icon: Split, title: '模块失败隔离', body: '单个渠道、图片、官方价格或账号商机不可用时只跳过对应模块，已验证的货源目录和最后正常数据继续服务。' },
  { icon: ShieldCheck, title: '商机证据边界', body: '账号商机只读复用现有日报成品，不新增大模型调用；重要价格、额度、政策和融资事实优先核对官方来源，不把传闻写成确定事实。' },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl"><span className="text-sm font-semibold text-emerald-700">公开方法</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">数据方法与稳定性边界</h1><p className="mt-4 leading-7 text-gray-600">比收录数量更重要的是知道数据从哪里来、什么时候更新、什么情况下会被跳过，以及异常时哪些功能仍然可用。</p></header>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">{sections.map(({ icon: Icon, title, body }) => <section key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><Icon className="h-6 w-6 text-emerald-600" /><h2 className="mt-4 text-lg font-bold text-gray-950">{title}</h2><p className="mt-2 text-sm leading-7 text-gray-600">{body}</p></section>)}</div>
      </div>
    </main>
  );
}
