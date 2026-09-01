'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Handshake, Menu, Plus, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/card-products', label: '订阅货源' },
  { href: '/official-prices', label: '官方价格' },
  { href: '/opportunities/latest', label: '账号商机日报' },
  { href: '/guide', label: '指南' },
] as const;

const moreItems = [
  { href: '/opportunities', label: '实时商机台' },
  { href: '/channels', label: '渠道商目录' },
  { href: '/card-products/all', label: '全部原始报价' },
  { href: '/changes', label: '价格与库存异动' },
  { href: '/profit-calculator', label: '利润计算器' },
  { href: '/wholesale', label: '批发供需合作' },
  { href: '/commercial', label: '企业客户经营' },
  { href: '/community', label: '货源社区' },
] as const;

export function Header() {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(true);
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

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMenuOpen]);

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
      {isAnnouncementOpen && (
        <div className="border-b border-emerald-100 bg-emerald-50 text-emerald-950">
          <div className="mx-auto grid min-h-10 max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 text-xs sm:px-6 lg:px-8">
            <Link href="/opportunities/latest" className="flex min-w-0 items-center justify-center gap-2 font-medium hover:text-emerald-700">
              <span className="announcement-badge shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold">今日已更新</span>
              <span className="truncate">直接查看今天的 AI 账号商机日报</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
            <button type="button" onClick={() => setIsAnnouncementOpen(false)} aria-label="关闭公告" className="announcement-close rounded-full border border-emerald-200 bg-white p-1.5 text-emerald-800 hover:bg-emerald-100"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="打开主菜单" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 lg:hidden"><Menu className="h-5 w-5" /></button>
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="爱窝啦·货源雷达首页">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-700 bg-white font-mono text-[11px] font-black text-emerald-800">AI</span>
            <span className="text-lg font-black tracking-tight text-gray-950 sm:text-xl">爱窝啦<span className="ml-1 text-xs font-semibold tracking-[0.12em] text-gray-500 sm:text-sm">货源雷达</span></span>
          </Link>
          <nav className="mx-auto hidden min-w-0 items-center gap-1 rounded-full bg-gray-100 p-1 lg:flex" aria-label="主导航">
            {navItems.map((item) => {
              const active = item.href === '/'
                ? pathname === '/'
                : item.href === '/opportunities/latest'
                  ? pathname.startsWith('/opportunities') && pathname !== '/opportunities'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-950'}`}>{item.label}</Link>;
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link href="/wholesale" className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 hover:border-emerald-300 hover:text-emerald-800 xl:inline-flex"><Handshake className="h-4 w-4" />批发合作</Link>
            <ThemeToggle />
            <button type="button" onClick={openSubmission} className="hidden items-center gap-1.5 rounded-full border border-gray-900 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 sm:inline-flex"><Plus className="h-4 w-4" />提交渠道</button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-gray-950/45 lg:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMenuOpen(false); }}>
          <nav role="dialog" aria-modal="true" aria-label="移动端主菜单" className="h-full w-[min(88vw,22rem)] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4"><strong className="text-lg text-gray-950">爱窝啦·货源雷达</strong><button type="button" onClick={() => setIsMenuOpen(false)} aria-label="关闭主菜单" className="rounded-full border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-2 py-5">
              {navItems.map((item) => {
                const active = item.href === '/'
                  ? pathname === '/'
                  : item.href === '/opportunities/latest'
                    ? pathname.startsWith('/opportunities') && pathname !== '/opportunities'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} aria-current={active ? 'page' : undefined} className={`rounded-xl px-4 py-3 text-base font-semibold ${active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-800 hover:bg-gray-50'}`}>{item.label}</Link>;
              })}
            </div>
            <div className="border-t border-gray-200 pt-4"><p className="mb-2 px-4 text-xs font-semibold text-gray-400">更多工具</p><div className="grid gap-1">{moreItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-950">{item.label}</Link>)}</div></div>
            <button type="button" onClick={() => { setIsMenuOpen(false); openSubmission(); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />提交公开渠道</button>
          </nav>
        </div>
      )}

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
