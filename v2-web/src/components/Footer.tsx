import React from 'react';
import Link from 'next/link';
import { PROJECT_REPOSITORY_URL, STORE_NAME, STORE_URL } from '@/lib/site';

export const Footer = () => {
  return (
    <footer className="w-full pt-8 pb-24 md:pb-8 mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 爱窝啦·货源雷达
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-600">
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
            <Link href="/community" className="hover:text-emerald-600 transition-colors">
              社区
            </Link>
            <Link href="/blog" className="hover:text-emerald-600 transition-colors">
              博客
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
            <a 
              href={PROJECT_REPOSITORY_URL}
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-emerald-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
