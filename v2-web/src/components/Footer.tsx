import React from 'react';
import Link from 'next/link';
import { PROJECT_REPOSITORY_URL, STORE_NAME, STORE_URL } from '@/lib/site';

export const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-sm text-sm leading-6 text-gray-500">
            <strong className="mb-2 block text-lg text-gray-950">爱窝啦·货源雷达</strong>
            聚合公开 AI 账号货源、官方价格与商家经营信息。本站不收款、不担保，购买和售后以原平台规则为准。
          </div>
          <div className="grid grid-cols-2 gap-8"><div><strong className="text-sm text-gray-950">买家找货</strong><div className="mt-3 grid gap-2 text-sm text-gray-500"><Link href="/card-products" className="hover:text-emerald-700">订阅货源</Link><Link href="/card-products/all" className="hover:text-emerald-700">全部报价</Link><Link href="/official-prices" className="hover:text-emerald-700">官方价格</Link><Link href="/channels" className="hover:text-emerald-700">渠道商目录</Link></div></div><div><strong className="text-sm text-gray-950">商家经营</strong><div className="mt-3 grid gap-2 text-sm text-gray-500"><Link href="/opportunities" className="hover:text-emerald-700">经营日报</Link><Link href="/profit-calculator" className="hover:text-emerald-700">利润计算器</Link><Link href="/wholesale" className="hover:text-emerald-700">批发供需</Link><Link href="/commercial" className="hover:text-emerald-700">企业采购</Link></div></div></div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} 爱窝啦·货源雷达</span>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="项目信息"><Link href="/guide" className="hover:text-emerald-700">购买指南</Link><Link href="/methodology" className="hover:text-emerald-700">数据方法</Link><Link href="/about" className="hover:text-emerald-700">关于</Link><a href={PROJECT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700">开源代码</a><a href={STORE_URL} target="_blank" rel="noopener" className="font-semibold text-gray-500 hover:text-emerald-700">{STORE_NAME}</a></nav>
        </div>
      </div>
    </footer>
  );
};
