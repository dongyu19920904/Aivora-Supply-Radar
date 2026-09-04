const INTERNAL_REPLAY_METADATA = /<!--\s*opportunity-replay\s*:[\s\S]*?-->\s*/gi;
const REPLAY_METADATA_CAPTURE = /<!--\s*opportunity-replay\s*:\s*(\{[^\n]*\})\s*-->/i;

export type AccountOpportunityMode = 'overview' | 'beginner' | 'experienced';

export interface AccountOpportunityReplayMetadata {
  decision: 'trial' | 'pause' | 'observe';
  leadProductSlug: string | null;
  leadProductName: string | null;
  referenceCost: number | null;
  verifiedSourceCount: number;
  verifiedSourceNames: string[];
  productUrl: string | null;
  calculatorUrl: string | null;
  sourceGeneratedAt: string | null;
  sourceObservedAt: string | null;
  copyDraft: string;
}

export interface AccountOpportunitySections {
  enhanced: boolean;
  today: string;
  overview: string;
  beginner: string;
  experienced: string;
  paused: string;
  evidence: string;
  closing: string;
  full: string;
}

function safeText(value: unknown, maxLength = 2_000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeSupplyUrl(value: unknown): string | null {
  try {
    const parsed = new URL(String(value || ''));
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'supply.aivora.cn') return null;
    if (!parsed.pathname.startsWith('/card-products/') && parsed.pathname !== '/profit-calculator') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function safeIsoDate(value: unknown): string | null {
  const text = safeText(value, 80);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}

export function parseAccountOpportunityReplayMetadata(markdown: string): AccountOpportunityReplayMetadata | null {
  const match = markdown.match(REPLAY_METADATA_CAPTURE);
  if (!match) return parseVisibleAccountOpportunityMetadata(markdown);
  try {
    const value = JSON.parse(match[1]) as Record<string, unknown>;
    if (value.businessModel !== 'supply-merchant-daily-v3') return null;
    const referenceCost = Number(value.referenceCost);
    const copy = safeText(value.copyDraft, 2_000);
    return {
      decision: value.decision === 'trial' || value.decision === 'observe' ? value.decision : 'pause',
      leadProductSlug: safeText(value.leadProductSlug, 100) || null,
      leadProductName: safeText(value.leadProductName, 160) || null,
      referenceCost: Number.isFinite(referenceCost) && referenceCost > 0 ? referenceCost : null,
      verifiedSourceCount: Math.max(0, Math.floor(Number(value.verifiedSourceCount) || 0)),
      verifiedSourceNames: [...new Set(
        (Array.isArray(value.verifiedSourceNames) ? value.verifiedSourceNames : [])
          .map((item) => safeText(item, 100))
          .filter(Boolean),
      )].slice(0, 6),
      productUrl: safeSupplyUrl(value.productUrl),
      calculatorUrl: safeSupplyUrl(value.calculatorUrl),
      sourceGeneratedAt: safeIsoDate(value.sourceGeneratedAt),
      sourceObservedAt: safeIsoDate(value.sourceObservedAt),
      copyDraft: copy.includes('付款前再次确认库存') ? copy : '',
    };
  } catch {
    return null;
  }
}

function parseVisibleAccountOpportunityMetadata(markdown: string): AccountOpportunityReplayMetadata | null {
  const sections = parseAccountOpportunitySections(markdown);
  if (!sections.enhanced) return null;
  const lead = sections.overview.match(
    /^###\s+\[([^\]]+)\]\((https:\/\/supply\.aivora\.cn\/card-products\/([a-z0-9-]+))\)/im,
  );
  const productUrl = safeSupplyUrl(lead?.[2]);
  const calculator = `${sections.overview}\n${sections.beginner}`.match(
    /https:\/\/supply\.aivora\.cn\/profit-calculator\?[^)\s]+/i,
  );
  const calculatorUrl = safeSupplyUrl(calculator?.[0]);
  const costMatch = sections.overview.match(/\*\*当前进货参考\*\*\s*¥\s*([\d.]+)/);
  const referenceCost = Number(costMatch?.[1]);
  const sourceMatch = sections.overview.match(/(\d+)\s*个不同货源站/);
  const verifiedSourceCount = Math.max(0, Math.floor(Number(sourceMatch?.[1]) || 0));
  const copyBlock = sections.beginner.match(/###\s+可复制商品说明草稿\s*\n+([\s\S]*)$/m)?.[1] || '';
  const copyDraft = safeText(
    copyBlock.split(/\r?\n/)
      .filter((line) => /^\s*>/.test(line))
      .map((line) => line.replace(/^\s*>\s?/, ''))
      .join('\n'),
    2_000,
  );
  const trial = Boolean(
    productUrl && calculatorUrl && Number.isFinite(referenceCost) && referenceCost > 0 &&
    verifiedSourceCount >= 2 && copyDraft.includes('付款前再次确认库存'),
  );
  return {
    decision: trial ? 'trial' : 'pause',
    leadProductSlug: trial ? lead?.[3] || null : null,
    leadProductName: trial ? safeText(lead?.[1], 160) || null : null,
    referenceCost: trial ? referenceCost : null,
    verifiedSourceCount: trial ? verifiedSourceCount : 0,
    verifiedSourceNames: [],
    productUrl: trial ? productUrl : null,
    calculatorUrl: trial ? calculatorUrl : null,
    sourceGeneratedAt: null,
    sourceObservedAt: null,
    copyDraft: trial ? copyDraft : '',
  };
}

function splitLevelTwoSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const matches = [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const start = (current.index || 0) + current[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    sections.set(current[1].trim(), markdown.slice(start, end).trim());
  }
  return sections;
}

export function parseAccountOpportunitySections(markdown: string): AccountOpportunitySections {
  const full = publicOpportunityMarkdown(markdown);
  const sections = splitLevelTwoSections(full);
  const enhanced = [
    '今天一句话',
    '一眼看懂',
    '新手今天照着做',
    '老商家今天看这三项',
    '今天暂停什么',
    '数据和判断依据',
    '收盘填写结果',
  ].every((heading) => sections.has(heading));
  if (!enhanced) {
    return { enhanced: false, today: '', overview: '', beginner: '', experienced: '', paused: '', evidence: '', closing: '', full };
  }
  return {
    enhanced: true,
    today: sections.get('今天一句话') || '',
    overview: sections.get('一眼看懂') || '',
    beginner: sections.get('新手今天照着做') || '',
    experienced: sections.get('老商家今天看这三项') || '',
    paused: sections.get('今天暂停什么') || '',
    evidence: sections.get('数据和判断依据') || '',
    closing: sections.get('收盘填写结果') || '',
    full,
  };
}

export function splitBeginnerSteps(markdown: string): { intro: string; steps: string[]; remainder: string } {
  const lines = markdown.split(/\r?\n/);
  const steps: string[] = [];
  const intro: string[] = [];
  const remainder: string[] = [];
  let foundStep = false;
  let finishedSteps = false;
  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s+(.+)$/);
    if (match && !finishedSteps) {
      foundStep = true;
      steps.push(match[1].trim());
      continue;
    }
    if (foundStep && line.trim() && !/^\s+/.test(line)) finishedSteps = true;
    (finishedSteps ? remainder : intro).push(line);
  }
  return { intro: intro.join('\n').trim(), steps: steps.slice(0, 6), remainder: remainder.join('\n').trim() };
}

export function publicOpportunityMarkdown(markdown: string): string {
  return markdown.replace(INTERNAL_REPLAY_METADATA, '').trim();
}
