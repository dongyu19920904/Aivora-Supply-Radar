"use client";

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Tags, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const pathname = usePathname();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleOpenModal = () => setIsSubmitModalOpen(true);
    window.addEventListener('open-submit-modal', handleOpenModal);
    return () => window.removeEventListener('open-submit-modal', handleOpenModal);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      // @ts-ignore - submitChannel is imported dynamically to avoid server component errors in client component if possible, but actually we can just import it at top
      const { submitChannel } = await import('@/app/actions');
      const res = await submitChannel(formData);
      if (res.success) {
        alert('提交成功，我们将尽快审核后收录！');
        setIsSubmitModalOpen(false);
      } else {
        alert(res.error || '提交失败');
      }
    });
  };

  return (
    <>
      {isBannerVisible && (
          <div className="bg-[#12B7F5] text-white px-4 pr-10 sm:pr-12 py-2 text-sm font-medium text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1 relative z-30 transition-all">
            <span>货源、官方价、价格异动与账号商机日报已经合并到同一套决策链路。</span>
            <Link
              href="/opportunities"
              className="underline underline-offset-2 hover:text-white/80 transition-colors cursor-pointer shrink-0"
            >
              查看今日商机
            </Link>
            <button 
              onClick={() => setIsBannerVisible(false)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-1"
              title="关闭公告"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
                <Tags className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">
                爱窝啦<span className="text-emerald-500">·货源雷达</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
              <Link 
                href="/card-products"
                className={`transition-colors ${pathname.startsWith('/card-products') ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                货源市场
              </Link>
              <Link
                href="/channels"
                className={`transition-colors ${pathname.startsWith('/channels') ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                渠道商
              </Link>
              <Link
                href="/official-prices"
                className={`transition-colors ${pathname.startsWith('/official-prices') ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                官方价格
              </Link>
              <Link
                href="/changes"
                className={`transition-colors ${pathname === '/changes' ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                今日异动
              </Link>
              <Link
                href="/opportunities"
                className={`transition-colors ${pathname.startsWith('/opportunities') ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                账号商机
              </Link>
              <Link
                href="/guide"
                className={`transition-colors ${pathname.startsWith('/guide') ? 'text-emerald-600' : 'hover:text-gray-900'}`}
              >
                指南
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <ThemeToggle />
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">提交渠道</span>
                <span className="inline sm:hidden">提交</span>
              </button>
            </div>
          </div>
          </div>
        </header>

      {/* Submit Channel Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">提交渠道收录</h3>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 bg-emerald-50/80 rounded-xl p-3.5 text-sm text-emerald-800 border border-emerald-100/50 flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-1.5">
                💡 提交前建议阅读以下指南：
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 ml-6">
                <Link 
                  href="/guide/getting-started" 
                  onClick={() => setIsSubmitModalOpen(false)} 
                  className="flex items-center gap-1 hover:text-emerald-900 underline underline-offset-2 transition-colors"
                >
                  如何被正确收录？
                </Link>
                <Link 
                  href="/guide/best-practices" 
                  onClick={() => setIsSubmitModalOpen(false)} 
                  className="flex items-center gap-1 hover:text-emerald-900 underline underline-offset-2 transition-colors"
                >
                  如何获取更多流量？
                </Link>
              </div>
            </div>
            <form 
              className="space-y-4" 
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  渠道名称
                </label>
                <input 
                  type="text" 
                  name="site_name"
                  className="w-full rounded-lg bg-gray-100 border-0 px-4 py-2.5 text-gray-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-600 outline-none transition-colors" 
                  placeholder="例如：Netflix 优质合租" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  渠道链接 <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="url" 
                  name="site_url"
                  className="w-full rounded-lg bg-gray-100 border-0 px-4 py-2.5 text-gray-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-600 outline-none transition-colors" 
                  placeholder="https://" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系方式
                </label>
                <input 
                  type="text" 
                  name="contact"
                  className="w-full rounded-lg bg-gray-100 border-0 px-4 py-2.5 text-gray-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-600 outline-none transition-colors" 
                  placeholder="Telegram / 微信 / 邮箱" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea 
                  name="remarks"
                  className="w-full rounded-lg bg-gray-100 border-0 px-4 py-2.5 text-gray-900 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-600 outline-none transition-colors min-h-[100px] resize-none" 
                  placeholder="填写其他说明信息或推荐理由..."
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? '提交中...' : '确认提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
