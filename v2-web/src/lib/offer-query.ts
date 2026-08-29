export const OFFER_PAGE_DEFAULT_LIMIT = 50;
export const OFFER_PAGE_MAX_LIMIT = 100;

export const PUBLIC_OFFER_STATUSES = ['in_stock', 'out_of_stock', 'offline'] as const;

export type PublicOfferStatus = (typeof PUBLIC_OFFER_STATUSES)[number];

export interface OfferCursor {
  status: PublicOfferStatus;
  updatedAt: string;
  id: string;
}

export interface OfferQueryParams {
  limit: number;
  cursor: OfferCursor | null;
  searchTerms: string[];
  excludedTerms: string[];
  platform: string;
  category: string;
  status: PublicOfferStatus | '';
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNSAFE_FILTER_CHARACTERS = /[%_*,()\\\u0000-\u001f\u007f]/g;

function clampLimit(value: string | null): number {
  if (!value) return OFFER_PAGE_DEFAULT_LIMIT;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return OFFER_PAGE_DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), OFFER_PAGE_MAX_LIMIT);
}

function normalizeFilter(value: string | null, maxLength = 80): string {
  return (value || '')
    .replace(UNSAFE_FILTER_CHARACTERS, '')
    .trim()
    .slice(0, maxLength);
}

function parseSearch(value: string | null): Pick<OfferQueryParams, 'searchTerms' | 'excludedTerms'> {
  const tokens = (value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

  const searchTerms: string[] = [];
  const excludedTerms: string[] = [];

  for (const token of tokens) {
    const isExcluded = token.startsWith('-') && token.length > 1;
    const normalized = normalizeFilter(isExcluded ? token.slice(1) : token, 40).toLowerCase();
    if (!normalized) continue;

    const destination = isExcluded ? excludedTerms : searchTerms;
    if (!destination.includes(normalized)) destination.push(normalized);
  }

  return { searchTerms, excludedTerms };
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

export function encodeOfferCursor(cursor: OfferCursor): string {
  return encodeBase64Url(JSON.stringify({ s: cursor.status, t: cursor.updatedAt, i: cursor.id }));
}

export function decodeOfferCursor(value: string | null): OfferCursor | null {
  if (!value || value.length > 512) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as Record<string, unknown>;
    const status = typeof parsed.s === 'string' ? parsed.s : '';
    const updatedAt = typeof parsed.t === 'string' ? parsed.t : '';
    const id = typeof parsed.i === 'string' ? parsed.i : '';
    const date = new Date(updatedAt);

    if (!PUBLIC_OFFER_STATUSES.includes(status as PublicOfferStatus)) return null;
    if (!UUID_PATTERN.test(id)) return null;
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== updatedAt) return null;

    return { status: status as PublicOfferStatus, updatedAt, id };
  } catch {
    return null;
  }
}

export function parseOfferQuery(searchParams: URLSearchParams): OfferQueryParams {
  const requestedStatus = (searchParams.get('status') || '').trim().slice(0, 20);
  const status = PUBLIC_OFFER_STATUSES.includes(requestedStatus as PublicOfferStatus)
    ? requestedStatus as PublicOfferStatus
    : '';

  return {
    limit: clampLimit(searchParams.get('limit')),
    cursor: decodeOfferCursor(searchParams.get('cursor')),
    ...parseSearch(searchParams.get('q')),
    platform: normalizeFilter(searchParams.get('platform')),
    category: normalizeFilter(searchParams.get('category')),
    status,
  };
}
