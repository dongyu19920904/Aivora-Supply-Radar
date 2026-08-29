"use client";

import Link from 'next/link';
import { Newspaper, Plus } from 'lucide-react';
import { SubmitChannelButton } from '@/components/SubmitChannelButton';

export default function ContactButtons() {
  return (
    <div className="flex w-full shrink-0 gap-3 sm:mt-0 sm:w-auto">
      <SubmitChannelButton className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:flex-none">
        <Plus className="h-4 w-4" />
        提交渠道
      </SubmitChannelButton>
      <Link href="/opportunities" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:flex-none">
        <Newspaper className="h-4 w-4" />
        账号商机
      </Link>
    </div>
  );
}
