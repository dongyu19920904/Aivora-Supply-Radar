// Keep the label vocabulary compatible with the daily generator. A label is
// title-derived grouping, never proof of fulfilment or an original-page check.
export function offerSpecification(title: string): string | null {
  const text = title.toLowerCase().slice(0, 500);
  // Mixed durations/seat types cannot be compared as a single monthly recharge.
  if (/\d+\s*[-~至到]\s*\d+\s*(?:天|日|月)|\d+\s*(?:天|日)|试用|体验|trial/.test(text)) return null;
  const shared = /共享|合租|拼车|车位|合用/.test(text);
  const recharge = /代充|充值|卡充|卡密|cdk|recharge/.test(text);
  if (shared && recharge) return null;
  const shape = shared ? '共享账号' : recharge
    ? /卡密|卡充|卡冲|卡付|cdk/.test(text) ? '卡密充值' : '代充'
    : /独享|个人/.test(text) ? '独享账号'
      : /账号|账户|成品|account/.test(text) ? '账号' : '标准商品';
  const months = [...text.matchAll(/(?:^|\D)(\d{1,2})\s*(?:个?月|months?)(?=\D|$)/g)].map((m) => Number(m[1]));
  if (/(?:一年|1\s*年|year)/.test(text)) months.push(12);
  if (/一个月|单月|月卡|月费|monthly/.test(text)) months.push(1);
  const durations = [...new Set(months)];
  if (durations.length !== 1 || durations[0] < 1 || durations[0] > 24) return null;
  const regions = [
    [/菲区|菲律宾|philippine/, '菲律宾'], [/美区|美国|usa|united states/, '美国'],
    [/日区|日本|japan/, '日本'], [/港区|香港|hong kong/, '香港'],
    [/土区|土耳其|turkey/, '土耳其'],
  ] as const;
  const matched = regions.filter(([pattern]) => pattern.test(text)).map(([, name]) => name);
  if (matched.length > 1 || (recharge && matched.length === 0)) return null;
  return [shape, `${durations[0]}个月`, ...matched].join(' · ');
}

export function parseSpecification(value: unknown): string {
  if (typeof value !== 'string') return '';
  return /^(卡密充值|代充|共享账号|独享账号|账号|试用|标准商品) · ([1-9]|1\d|2[0-4])个月(?: · (菲律宾|美国|日本|香港|土耳其))?$/.test(value) ? value : '';
}

export interface SpecOffer { product_title: string; status: string; price: number | string | null }
export function specificationGroups(rows: SpecOffer[]): string[] {
  return [...new Set(rows.map((row) => offerSpecification(row.product_title)).filter((label): label is string => label !== null))].sort();
}

// Read every page before filtering. Fail closed when the bounded read is not
// complete, rather than presenting a cheapest-50 sample as the whole market.
export async function collectOfferPool<T>(read: (offset: number, limit: number) => Promise<{ rows: T[]; total: number }>): Promise<T[]> {
  const result: T[] = [];
  let expected: number | null = null;
  for (let offset = 0; offset < 5_000; offset += 500) {
    const page = await read(offset, 500);
    if (expected !== null && expected !== page.total) throw new Error('offer_pool_changed');
    expected = page.total;
    if (expected > 5_000) throw new Error('offer_pool_limit');
    result.push(...page.rows);
    if (result.length === expected) return result;
    if (page.rows.length !== 500) throw new Error('offer_pool_incomplete');
  }
  throw new Error('offer_pool_incomplete');
}
