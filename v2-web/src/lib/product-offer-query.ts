import { OFFER_PAGE_DEFAULT_LIMIT, OFFER_PAGE_MAX_LIMIT, parseOfferQuery } from './offer-query';

export interface ProductOfferQueryParams {
  limit: number;
  offset: number;
  searchTerms: string[];
  excludedTerms: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minInventory: number | null;
  updatedWithinHours: number | null;
  availability: ProductOfferAvailability;
}

export type ProductOfferAvailability = 'all' | 'available' | 'unavailable';

function availability(value: string | null): ProductOfferAvailability {
  return value === 'available' || value === 'unavailable' ? value : 'all';
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function boundedPrice(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(parsed, 1_000_000_000);
}

function optionalBoundedInteger(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, min), max);
}

export function parseProductOfferQuery(searchParams: URLSearchParams): ProductOfferQueryParams {
  const common = parseOfferQuery(searchParams);
  const minPrice = boundedPrice(searchParams.get('min'));
  const maxPrice = boundedPrice(searchParams.get('max'));

  return {
    limit: boundedInteger(searchParams.get('limit'), OFFER_PAGE_DEFAULT_LIMIT, 1, OFFER_PAGE_MAX_LIMIT),
    offset: boundedInteger(searchParams.get('offset'), 0, 0, 10_000),
    searchTerms: common.searchTerms,
    excludedTerms: common.excludedTerms,
    minPrice,
    maxPrice: minPrice !== null && maxPrice !== null && maxPrice < minPrice ? minPrice : maxPrice,
    minInventory: optionalBoundedInteger(searchParams.get('inventory'), 1, 1_000_000),
    updatedWithinHours: optionalBoundedInteger(searchParams.get('hours'), 1, 720),
    availability: availability(searchParams.get('availability')),
  };
}
