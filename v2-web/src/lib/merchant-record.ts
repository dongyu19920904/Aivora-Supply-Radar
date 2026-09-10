export const recordFields = {
  task: '今天完成的任务或材料', result: '实际结果与仍缺的条件', next: '下一步及停止条件',
  enquiries: '真实询问人数（未知留空）', orders: '实际完成订单数（未知留空）',
  revenue: '实际收入（元）', purchase: '采购支出（元）', fees: '手续费（元）', refunds: '退款补发损失（元，不与采购重复计入）', service: '售后成本（元）', acquisition: '获客支出（元）', fixed: '分摊固定费用（元）',
} as const;
export type MerchantRecord = Record<keyof typeof recordFields, string>;
export const emptyMerchantRecord = (): MerchantRecord => Object.fromEntries(Object.keys(recordFields).map((key) => [key, ''])) as MerchantRecord;
export function parseMerchantRecord(value: unknown): MerchantRecord {
  const record = emptyMerchantRecord();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return record;
  for (const key of Object.keys(record) as (keyof MerchantRecord)[]) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry === 'string') record[key] = entry.slice(0, 2000);
  }
  return record;
}
export function recordedContribution(record: MerchantRecord): number | null {
  const keys = ['revenue', 'purchase', 'fees', 'refunds', 'service', 'acquisition', 'fixed'] as const;
  if (keys.some((key) => record[key].trim() === '' || !Number.isFinite(Number(record[key])) || Number(record[key]) < 0)) return null;
  return Math.round((Number(record.revenue) - keys.slice(1).reduce((sum, key) => sum + Number(record[key]), 0)) * 100) / 100;
}
