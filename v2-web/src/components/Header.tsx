'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Plus, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/card-products', label: '货源市场' },
  { href: '/channels', label: '渠道商' },
  { href: '/official-prices', label: '官方价' },
  { href: '/changes', label: '异动' },
  { href: '/opportunities', label: '账号商机' },
  { href: '/guide', label: '指南' },
] as const;

export function Header() {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleOpenModal = () => { setFeedback(null); setIsSubmitModalOpen(true); };
    window.addEventListener('open-submit-modal', handleOpenModal);
    return () => window.removeEventListener('open-submit-modal', handleOpenModal);
  }, []);

  useEffect(() => {
    if (!isSubmitModalOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsSubmitModalOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSubmitModalOpen]);

  const openSubmission = () => { setFeedback(null); setIsSubmitModalOpen(true); };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const { submitChannel } = await import('@/app/actions');
      const result = await submitChannel(formData);
      if (result.success) {
        formRef.current?.reset();
        setFeedback({ type: 'success', message: '提交成功。审核通过前不会自动公开，请勿重复提交。' });
      } else {
        setFeedback({ type: 'error', message: result.error || '提交失败，请稍后重试。' });
      }
    });
  };

  return (
    <>
      <div className="bg-gray-950 text-white">
        <div className="mx-auto flex min-h-8 max-w-7xl items-center justify-between gap-4 px-4 text-[11px] sm:px-6 lg:px-8">
          <span className="font-mono uppercase tracking-[0.14em] text-gray-300">Aivora supply workbench</span>
          <div className="flex items-center gap-4">
            <Link href="/changes" className="hover:text-amber-300">查看今日异动</Link>
            <Link href="/profit-calculator" className="hidden items-center gap-1 text-amber-300 hover:text-amber-200 sm:inline-flex"><Calculator className="h-3 w-3" />利润计算器</Link>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="爱窝啦·货源雷达首页">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-300 font-mono text-xs font-black text-gray-950">AI</span>
            <span className="text-base font-bold tracking-tight text-gray-950 sm:text-lg">爱窝啦<span className="text-gray-500">·货源雷达</span></span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="主导航">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'}`}>{item.label}</Link>;
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={openSubmission} className="inline-flex items-center gap-1.5 rounded-md border border-gray-950 bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 sm:text-sm"><Plus className="h-4 w-4" /><span className="hidden sm:inline">提交渠道</span><span className="sm:hidden">提交</span></button>
          </div>
        </div>
      </header>

      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsSubmitModalOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="submission-title" className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div><span className="radar-kicker">商家入口</span><h2 id="submission-title" className="mt-1 text-xl font-bold text-gray-950">提交公开货源渠道</h2></div>
              <button type="button" onClick={() => setIsSubmitModalOpen(false)} aria-label="关闭提交表单" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-950"><X className="h-5 w-5" /></button>
            </div>
            <p className="border-b border-gray-200 px-5 py-3 text-xs leading-5 text-gray-600">只提交可公开核验的 HTTPS 网站。不要填写卡密、账号密码、订单或客户资料；所有投稿先审核再收录。</p>
            <form ref={formRef} className="grid gap-4 p-5" onSubmit={handleSubmit}>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">渠道名称<input type="text" name="site_name" maxLength={160} className="radar-input" placeholder="例如：某某 AI 账号货源" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">渠道 HTTPS 链接 <span className="sr-only">必填</span><input required type="url" inputMode="url" name="site_url" maxLength={2048} pattern="https://.*" className="radar-input" placeholder="https://example.com" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">联系方式<input type="text" name="contact" maxLength={240} className="radar-input" placeholder="Telegram / 微信 / 邮箱" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">接入说明<textarea name="remarks" maxLength={2000} className="radar-input min-h-24 resize-y" placeholder="主营商品、公开接口、更新频率与售后说明" /></label>
              <label className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">公司网站<input type="text" name="company_website" tabIndex={-1} autoComplete="off" /></label>
              {feedback && <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${feedback.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>{feedback.message}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4"><Link href="/guide/getting-started" onClick={() => setIsSubmitModalOpen(false)} className="text-xs font-semibold text-blue-700 hover:underline">查看接入标准</Link><div className="flex gap-2"><button type="button" onClick={() => setIsSubmitModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">取消</button><button type="submit" disabled={isPending} className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60">{isPending ? '正在校验…' : '提交审核'}</button></div></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
