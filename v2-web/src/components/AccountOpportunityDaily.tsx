'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Clipboard, Eye, ListChecks, Store } from 'lucide-react';

import {
  type AccountOpportunityMode,
  type AccountOpportunityReplayMetadata,
  type AccountOpportunitySections,
  splitBeginnerSteps,
} from '@/lib/opportunity-markdown';

const modes: Array<{ id: AccountOpportunityMode; label: string; hint: string; icon: typeof Eye }> = [
  { id: 'overview', label: '一眼看懂', hint: '只看今天能不能做', icon: Eye },
  { id: 'beginner', label: '新手照做', hint: '最多六步完成试卖', icon: ListChecks },
  { id: 'experienced', label: '老手看盘', hint: '先处理库存和价格变化', icon: Store },
];

interface AccountOpportunityDailyProps {
  reportDate: string;
  sections: AccountOpportunitySections;
  metadata: AccountOpportunityReplayMetadata | null;
}

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}

function InlineMarkdown({ children }: { children: string }) {
  return <ReactMarkdown components={{ p: ({ children: content }) => <span>{content}</span> }}>{children}</ReactMarkdown>;
}

export function AccountOpportunityDaily({ reportDate, sections, metadata }: AccountOpportunityDailyProps) {
  const [mode, setMode] = useState<AccountOpportunityMode>('overview');
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [copied, setCopied] = useState(false);
  const beginner = useMemo(() => splitBeginnerSteps(sections.beginner), [sections.beginner]);
  const storageKey = `aivora-account-daily-progress:${reportDate}`;

  useEffect(() => {
    let saved: unknown = [];
    try {
      saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    } catch {}
    const timer = window.setTimeout(() => {
      setCompleted(beginner.steps.map((_, index) => Array.isArray(saved) && saved[index] === true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [beginner.steps, storageKey]);

  if (!sections.enhanced) {
    return (
      <>
        <div className="prose prose-gray max-w-none break-words p-6 prose-a:break-all prose-a:text-blue-700 prose-headings:scroll-mt-24 prose-strong:text-gray-950 dark:prose-invert dark:prose-a:text-blue-400 dark:prose-strong:text-zinc-100 sm:p-9">
          <Markdown>{sections.full}</Markdown>
        </div>
        <section className="border-t border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" data-opportunity-related-supply>
          历史日报保留原版正文。打开实时商机台核对当前价格和库存后再接单。
        </section>
      </>
    );
  }

  const toggleStep = (index: number) => {
    const next = beginner.steps.map((_, stepIndex) => stepIndex === index ? !completed[stepIndex] : Boolean(completed[stepIndex]));
    setCompleted(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Browser privacy settings may disable local storage. The checklist still works for this page view.
    }
  };

  const copyDescription = async () => {
    if (!metadata?.copyDraft) return;
    try {
      await navigator.clipboard.writeText(metadata.copyDraft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const finished = completed.filter(Boolean).length;

  return (
    <div className="prose prose-gray max-w-none break-words p-6 prose-a:break-all prose-a:text-blue-700 prose-headings:scroll-mt-24 prose-strong:text-gray-950 dark:prose-invert dark:prose-a:text-blue-400 dark:prose-strong:text-zinc-100 sm:p-9">
      <nav className="not-prose grid gap-2 sm:grid-cols-3" aria-label="选择日报阅读方式" data-account-reading-modes>
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-reading-mode={item.id}
              aria-pressed={active}
              onClick={() => setMode(item.id)}
              className={`flex min-h-20 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span><strong className="block text-sm">{item.label}</strong><small className="mt-1 block text-xs opacity-75">{item.hint}</small></span>
            </button>
          );
        })}
      </nav>

      <section className="mt-8" aria-live="polite" data-active-reading-mode={mode}>
        {mode === 'overview' && <><h2>一眼看懂</h2><Markdown>{sections.overview}</Markdown></>}
        {mode === 'beginner' && (
          <>
            <div className="not-prose flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4 dark:border-zinc-700">
              <div><h2 className="m-0 text-2xl font-bold text-gray-950 dark:text-white">新手今天照着做</h2><p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">进度只保存在当前浏览器，不会上传经营数据。</p></div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">已完成 {finished}/{beginner.steps.length}</span>
            </div>
            {beginner.intro && <Markdown>{beginner.intro}</Markdown>}
            <ol className="not-prose mt-5 grid list-none gap-3 p-0" data-beginner-checklist>
              {beginner.steps.map((step, index) => (
                <li key={`${index}-${step.slice(0, 20)}`}>
                  <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${completed[index] ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>
                    <input type="checkbox" checked={Boolean(completed[index])} onChange={() => toggleStep(index)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />
                    <div className="min-w-0 text-sm leading-6 text-gray-800 dark:text-zinc-100"><strong className="mr-1">第 {index + 1} 步</strong><span className="prose-a:break-all"><InlineMarkdown>{step}</InlineMarkdown></span></div>
                  </label>
                </li>
              ))}
            </ol>
            {beginner.remainder && <div className="mt-6"><Markdown>{beginner.remainder}</Markdown></div>}
            {metadata?.copyDraft && (
              <button type="button" onClick={copyDescription} className="not-prose mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto dark:bg-white dark:text-gray-950 dark:hover:bg-zinc-200">
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? '已复制，发布前请补全待填写项' : '复制商品说明草稿'}
              </button>
            )}
          </>
        )}
        {mode === 'experienced' && <><h2>老商家今天看这三项</h2><Markdown>{sections.experienced}</Markdown></>}
      </section>

      <section className="mt-10 border-t border-red-100 pt-7 dark:border-red-950"><h2>今天暂停什么</h2><Markdown>{sections.paused}</Markdown></section>

      <section className="not-prose mt-8" data-opportunity-related-supply>
        <details className="rounded-xl border border-gray-200 bg-gray-50 p-4 open:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:open:bg-zinc-950">
          <summary className="cursor-pointer font-semibold text-gray-950 dark:text-white">展开数据、时间和判断依据</summary>
          <div className="prose prose-sm mt-4 max-w-none break-words prose-a:break-all prose-a:text-blue-700 dark:prose-invert dark:prose-a:text-blue-400"><Markdown>{sections.evidence}</Markdown></div>
        </details>
      </section>

      <section className="mt-10 border-t border-gray-200 pt-7 dark:border-zinc-700"><h2>收盘填写结果</h2><Markdown>{sections.closing}</Markdown></section>

      <noscript>
        <div className="mt-10 border-t border-gray-200 pt-8">
          <p><strong>浏览器未启用 JavaScript，下面显示完整日报。</strong></p>
          <Markdown>{sections.full}</Markdown>
        </div>
      </noscript>
    </div>
  );
}
