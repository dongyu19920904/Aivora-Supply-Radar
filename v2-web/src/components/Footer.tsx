import React from 'react';
import Link from 'next/link';
import { PROJECT_REPOSITORY_URL, STORE_NAME, STORE_URL } from '@/lib/site';

export const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-gray-300 bg-white pb-24 pt-6 md:pb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="text-xs leading-5 text-gray-500">
            <strong className="block text-sm text-gray-950">爱窝啦·货源雷达</strong>
            &copy; {new Date().getFullYear()} · 公开信息聚合，不参与第三方交易
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-600">
            <Link href="/about" className="hover:text-emerald-600 transition-colors">
              关于
            </Link>
            <Link href="/channels" className="hover:text-emerald-600 transition-colors">
              渠道商
            </Link>
            <Link href="/changes" className="hover:text-emerald-600 transition-colors">
              今日异动
            </Link>
            <Link href="/opportunities" className="hover:text-emerald-600 transition-colors">
              账号商机
            </Link>
            <Link href="/profit-calculator" className="hover:text-amber-700 transition-colors">
              利润计算器
            </Link>
            <Link href="/community" className="hover:text-emerald-600 transition-colors">
              社区
            </Link>
            <Link href="/guide" className="hover:text-emerald-600 transition-colors">
              指南
            </Link>
            <Link href="/methodology" className="hover:text-emerald-600 transition-colors">
              数据方法
            </Link>
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener"
              className="hover:text-emerald-600 transition-colors"
            >
              {STORE_NAME}
            </a>
            <a href={PROJECT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">开源代码</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
