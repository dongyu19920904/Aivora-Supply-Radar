export interface Env {
  DB: D1Database;
  SITE_URL?: string;
  SOURCE_REPO?: string;
  ADMIN_API_KEY?: string;
}

export interface ProductSeed {
  slug: string;
  platform: string;
  name: string;
  subtitle: string;
  productType: string;
  aliases: string[];
  description: string;
  sortOrder: number;
}

export interface OfferSeed {
  sourceOfferId: string;
  productSlug: string;
  name: string;
  url: string;
  imageUrl: string;
  price: number;
  highPrice?: number;
  currency: string;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  warranty: string;
  deliveryType: string;
}

export interface OfficialPriceSeed {
  slug: string;
  productSlug: string;
  vendor: string;
  planName: string;
  region: string;
  price: number | null;
  currency: string;
  billingPeriod: string;
  quotaText: string;
  officialUrl: string;
  lastChecked: string;
}

export interface ProductSummary {
  id: number;
  slug: string;
  platform: string;
  name: string;
  subtitle: string;
  product_type: string;
  description: string;
  offer_count: number;
  merchant_count: number;
  in_stock_count: number;
  min_price: number | null;
  warranty_min_price: number | null;
  last_observed_at: string | null;
}

export interface OfferPublic {
  id: number;
  merchant_slug: string;
  merchant_name: string;
  merchant_score: number;
  original_name: string;
  source_url: string;
  image_url: string | null;
  price: number | null;
  high_price: number | null;
  currency: string;
  stock_status: string;
  stock_count: number | null;
  warranty: string;
  delivery_type: string;
  item_fingerprint: string;
  observed_at: string;
}

export interface OpportunityDocument {
  reportDate: string;
  title: string;
  description: string;
  bodyMarkdown: string;
  sourceUrl: string;
  publishedAt: string;
}

export interface OpportunityRow {
  id: number;
  report_date: string;
  title: string;
  description: string;
  body_markdown: string;
  source_url: string;
  published_at: string;
  synced_at: string;
}

export interface SubmissionInput {
  kind: "merchant" | "offer" | "correction" | "exposure" | "post";
  name: string;
  contact?: string;
  sourceUrl?: string;
  content: string;
}
