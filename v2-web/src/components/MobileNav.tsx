"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/card-products', label: '货源' },
  { href: '/official-prices', label: '官方价' },
  { href: '/changes', label: '异动' },
  { href: '/opportunities', label: '商机' },
  { href: '/guide', label: '指南' },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
    >
      <div className="flex h-12 items-center justify-around">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full min-w-0 flex-1 items-center justify-center px-1 text-[12px] transition-colors ${
                active
                  ? 'bg-emerald-50/60 font-bold text-emerald-600'
                  : 'font-medium text-gray-500 hover:bg-gray-50/50 hover:text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
