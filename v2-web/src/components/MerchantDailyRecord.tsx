'use client';

import { useEffect, useState } from 'react';
import { emptyMerchantRecord, parseMerchantRecord, recordFields, recordedContribution, type MerchantRecord } from '@/lib/merchant-record';

export function MerchantDailyRecord({ reportDate }: { reportDate: string }) {
  const [record, setRecord] = useState(emptyMerchantRecord);
  const [message, setMessage] = useState('');
  const key = `aivora-merchant-record:${reportDate}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setRecord(parseMerchantRecord(JSON.parse(localStorage.getItem(key) || 'null'))); }
      catch { setMessage('浏览器未允许本地存储，可以填写后导出。'); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(record)); setMessage('已保存在当前浏览器，未上传。'); }
    catch { setMessage('本地保存失败，请导出留存。'); }
  };
  const exportRecord = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ reportDate, ...record }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `merchant-record-${reportDate}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const clear = () => {
    if (!window.confirm('删除本浏览器中当天的经营记录？已导出的文件不受影响。')) return;
    try { localStorage.removeItem(key); setRecord(emptyMerchantRecord()); setMessage('当天本地记录已删除。'); }
    catch { setMessage('删除失败，浏览器未允许访问存储。'); }
  };
  const contribution = recordedContribution(record);
  return <div id="merchant-record" data-merchant-record className="not-prose scroll-mt-24 rounded-xl border border-gray-200 p-4 dark:border-zinc-700">
    <p className="mb-4 text-sm text-gray-600 dark:text-zinc-300">只记真实结果，不填写客户姓名、密码或卡密。未知留空，确实没有的费用填写 0。</p>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {(Object.keys(recordFields) as (keyof MerchantRecord)[]).map((field, index) => <label key={field} className={`min-w-0 text-sm text-gray-800 dark:text-zinc-100 ${index < 3 ? 'sm:col-span-2' : ''}`}>
        <span className="mb-1 block">{recordFields[field]}</span>
        {index < 3 ? <textarea maxLength={2000} value={record[field]} onChange={(e) => setRecord({ ...record, [field]: e.target.value })} className="min-h-20 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-900" />
          : <input type="number" min="0" step={index < 5 ? '1' : '0.01'} value={record[field]} onChange={(e) => setRecord({ ...record, [field]: e.target.value })} className="w-full min-w-0 rounded-lg border border-gray-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-900" />}
      </label>)}
    </div>
    <p className="mt-4 text-sm text-gray-700 dark:text-zinc-200">{contribution === null ? '费用尚未填全，不计算收益。' : `已填写收支的结余：¥${contribution.toFixed(2)}。未计入的税费等仍需另行核对。`}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={save} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">保存本地记录</button>
      <button type="button" onClick={exportRecord} className="rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-zinc-600">导出记录</button>
      <button type="button" onClick={clear} className="rounded-lg border border-red-300 px-4 py-3 text-sm text-red-700 dark:text-red-300">删除当天记录</button>
    </div>
    <p role="status" className="mt-3 text-sm text-gray-600 dark:text-zinc-300">{message}</p>
  </div>;
}
