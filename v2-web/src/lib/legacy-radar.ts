import { getCloudflareContext } from '@opennextjs/cloudflare';

const DEFAULT_LEGACY_API_URL = 'https://aivora-supply-radar.sabrinamisan090.workers.dev';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS = 100;

type LegacyRadarService = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

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

function legacyApiBase(): string {
  const candidate = process.env.LEGACY_RADAR_API_URL || DEFAULT_LEGACY_API_URL;
  const url = new URL(candidate);
  const localDevelopment = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localDevelopment) {
    throw new Error('legacy_radar_api_must_use_https');
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
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

async function fetchPayload(path: string): Promise<unknown> {
  const url = `${legacyApiBase()}${path}`;
  const requestInit: RequestInit = {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(7_000),
  };

  let service: LegacyRadarService | undefined;
  try {
    service = ((await getCloudflareContext({ async: true })).env as unknown as { LEGACY_RADAR_SERVICE?: LegacyRadarService })
      .LEGACY_RADAR_SERVICE;
  } catch {
    // Next.js development and Node tests do not have a Cloudflare context.
  }

  let response: Response;
  if (service && typeof service.fetch === 'function') {
    response = await service.fetch(url, requestInit);
  } else {
    response = await fetch(url, { ...requestInit, next: { revalidate: 300 } });
  }

  if (!response.ok) throw new Error(`legacy_radar_http_${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('legacy_radar_content_type');
  }

  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error('legacy_radar_response_too_large');

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_RESPONSE_BYTES) throw new Error('legacy_radar_response_too_large');
  return JSON.parse(new TextDecoder().decode(body));
}

function parseOpportunity(value: unknown): AccountOpportunity | null {
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
    synced_at: text(value.synced_at, 40),
  };
}

function parseChange(value: unknown): PriceChange | null {
  if (!isRecord(value)) return null;
  const sourceUrl = text(value.source_url, 2_048);
  if (!sourceUrl.startsWith('https://')) return null;

  return {
    product_slug: text(value.product_slug, 160),
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
    const payload = await fetchPayload('/api/v1/opportunities');
    if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
    return payload.data.slice(0, MAX_ITEMS).map(parseOpportunity).filter(Boolean) as AccountOpportunity[];
  } catch (error) {
    console.warn('Account opportunity feed unavailable:', error instanceof Error ? error.message : 'unknown');
    return [];
  }
}

export async function getAccountOpportunity(reportDate: string): Promise<AccountOpportunity | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  try {
    const payload = await fetchPayload(`/api/v1/opportunities/${encodeURIComponent(reportDate)}`);
    return isRecord(payload) ? parseOpportunity(payload.data) : null;
  } catch (error) {
    console.warn('Account opportunity detail unavailable:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

export async function listPriceChanges(): Promise<PriceChange[]> {
  try {
    const payload = await fetchPayload('/api/v1/changes');
    if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
    return payload.data.slice(0, MAX_ITEMS).map(parseChange).filter(Boolean) as PriceChange[];
  } catch (error) {
    console.warn('Price change feed unavailable:', error instanceof Error ? error.message : 'unknown');
    return [];
  }
}
