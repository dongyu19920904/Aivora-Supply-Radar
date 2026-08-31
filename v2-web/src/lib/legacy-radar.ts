import { supabase } from './supabase';
import { resolveCanonicalProductSlug } from './product-canonicalization';

const MAX_ITEMS = 100;

export interface AccountOpportunity {
  id: number;
  report_date: string;
  title: string;
  description: string;
  body_markdown: string;
  source_url: string;
  source_sha: string | null;
  published_at: string;
  synced_at: string;
}

export interface PriceChange {
  product_slug: string;
  product_name: string;
  merchant_name: string;
  source_url: string;
  previous_price: number | null;
  current_price: number | null;
  previous_stock: string | null;
  current_stock: string | null;
  observed_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown, maxLength = 20_000): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseAccountOpportunityRow(value: unknown): AccountOpportunity | null {
  if (!isRecord(value)) return null;
  const reportDate = text(value.report_date, 10);
  const sourceUrl = text(value.source_url, 2_048);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !sourceUrl.startsWith('https://')) return null;

  return {
    id: typeof value.id === 'number' ? value.id : 0,
    report_date: reportDate,
    title: text(value.title, 200),
    description: text(value.description, 600),
    body_markdown: text(value.body_markdown, 120_000),
    source_url: sourceUrl,
    source_sha: typeof value.source_sha === 'string' ? value.source_sha.slice(0, 80) : null,
    published_at: text(value.published_at, 40),
    synced_at: text(value.source_synced_at ?? value.synced_at, 40),
  };
}

export function parsePriceChangeRow(value: unknown): PriceChange | null {
  if (!isRecord(value)) return null;
  const sourceUrl = text(value.source_url, 2_048);
  if (!sourceUrl.startsWith('https://')) return null;

  return {
    product_slug: resolveCanonicalProductSlug(text(value.product_slug, 160)),
    product_name: text(value.product_name, 240),
    merchant_name: text(value.merchant_name, 240),
    source_url: sourceUrl,
    previous_price: numberOrNull(value.previous_price),
    current_price: numberOrNull(value.current_price),
    previous_stock: value.previous_stock === null ? null : text(value.previous_stock, 80),
    current_stock: value.current_stock === null ? null : text(value.current_stock, 80),
    observed_at: text(value.observed_at, 40),
  };
}

export async function listAccountOpportunities(): Promise<AccountOpportunity[]> {
  try {
    const { data, error } = await supabase
      .from('account_opportunities')
      .select('report_date,title,description,body_markdown,source_url,source_sha,published_at,source_synced_at')
      .order('report_date', { ascending: false })
      .limit(MAX_ITEMS);
    if (error) throw error;
    return (data || []).map(parseAccountOpportunityRow).filter(Boolean) as AccountOpportunity[];
  } catch (error) {
    console.warn('Account opportunity feed unavailable:', error instanceof Error ? error.message : 'unknown');
    return [];
  }
}

export async function getAccountOpportunity(reportDate: string): Promise<AccountOpportunity | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  try {
    const { data, error } = await supabase
      .from('account_opportunities')
      .select('report_date,title,description,body_markdown,source_url,source_sha,published_at,source_synced_at')
      .eq('report_date', reportDate)
      .maybeSingle();
    if (error) throw error;
    return parseAccountOpportunityRow(data);
  } catch (error) {
    console.warn('Account opportunity detail unavailable:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

export async function listPriceChanges(): Promise<PriceChange[]> {
  try {
    const { data, error } = await supabase
      .from('market_price_changes')
      .select('product_slug,product_name,merchant_name,source_url,previous_price,current_price,previous_stock,current_stock,observed_at')
      .order('observed_at', { ascending: false })
      .limit(MAX_ITEMS);
    if (error) throw error;
    return (data || []).map(parsePriceChangeRow).filter(Boolean) as PriceChange[];
  } catch (error) {
    console.warn('Price change feed unavailable:', error instanceof Error ? error.message : 'unknown');
    return [];
  }
}
