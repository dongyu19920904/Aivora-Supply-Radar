import { classifyProduct, itemFingerprint } from "../domain/catalog";
import { fetchPublicResource } from "../security/url";
import { recordOfferSnapshotIfChanged, recordSourceRun } from "../services/database";

interface ProductJsonLd {
  name: string;
  sku: string;
  url: string;
  image?: string[];
  offers?: {
    price?: string;
    lowPrice?: string;
    highPrice?: string;
    priceCurrency?: string;
    availability?: string;
  };
}

export function parseAivoraProductJsonLd(html: string): ProductJsonLd | null {
  const match = html.match(
    /<script id="aivora-route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  );
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1]) as ProductJsonLd;
    if (!parsed.name || !parsed.sku || !parsed.url || !parsed.offers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function extractSitemapProductUrls(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>(https:\/\/www\.aivora\.cn\/products\/[^<]+)<\/loc>/g))
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .slice(0, 100);
}

function stockStatus(availability = ""): string {
  if (/InStock$/i.test(availability)) return "in_stock";
  if (/OutOfStock$/i.test(availability)) return "out_of_stock";
  return "unknown";
}

export async function syncAivoraCatalog(db: D1Database): Promise<{
  status: string;
  discovered: number;
  accepted: number;
  rejected: number;
}> {
  const started = new Date();
  let discovered = 0;
  let accepted = 0;
  let rejected = 0;
  let errorCode: string | undefined;
  try {
    const sitemapResponse = await fetchPublicResource("https://www.aivora.cn/sitemap.xml", {
      acceptedTypes: ["application/xml", "text/xml"],
      maxBytes: 1_000_000,
    });
    const urls = extractSitemapProductUrls(await sitemapResponse.text());
    discovered = urls.length;
    const merchant = await db
      .prepare("SELECT id FROM merchants WHERE slug = 'aivora'")
      .first<{ id: number }>();
    if (!merchant) throw new Error("aivora_merchant_missing");
    const products = await db
      .prepare("SELECT id, slug FROM products")
      .all<{ id: number; slug: string }>();
    const productIds = new Map(products.results.map((row) => [row.slug, row.id]));

    for (let offset = 0; offset < urls.length; offset += 5) {
      const batch = urls.slice(offset, offset + 5);
      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            const response = await fetchPublicResource(url, {
              acceptedTypes: ["text/html"],
              maxBytes: 1_500_000,
            });
            return parseAivoraProductJsonLd(await response.text());
          } catch {
            return null;
          }
        }),
      );
      for (const item of results) {
        if (!item) {
          rejected += 1;
          continue;
        }
        const classification = classifyProduct(item.name);
        const productId = productIds.get(classification?.slug ?? "other-product");
        const lowPrice = Number(item.offers?.price ?? item.offers?.lowPrice ?? NaN);
        const highPrice = Number(item.offers?.highPrice ?? NaN);
        if (!productId || !Number.isFinite(lowPrice) || lowPrice < 0) {
          rejected += 1;
          continue;
        }
        const observedAt = new Date().toISOString();
        const fingerprint = itemFingerprint("aivora", item.sku, item.name);
        await db
          .prepare(
            `INSERT INTO offers
             (merchant_id, product_id, source_offer_id, original_name, source_url, image_url,
              price, high_price, currency, stock_status, warranty, delivery_type, item_fingerprint,
              is_comparable, approved, active, observed_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'store-terms', 'store', ?, 1, 1, 1, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(merchant_id, source_offer_id) DO UPDATE SET
               product_id = excluded.product_id,
               original_name = excluded.original_name,
               source_url = excluded.source_url,
               image_url = excluded.image_url,
               price = excluded.price,
               high_price = excluded.high_price,
               currency = excluded.currency,
               stock_status = excluded.stock_status,
               item_fingerprint = excluded.item_fingerprint,
               active = 1,
               observed_at = excluded.observed_at,
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            merchant.id,
            productId,
            item.sku,
            item.name,
            item.url,
            item.image?.[0] ?? null,
            lowPrice,
            Number.isFinite(highPrice) ? highPrice : null,
            item.offers?.priceCurrency ?? "CNY",
            stockStatus(item.offers?.availability),
            fingerprint,
            observedAt,
          )
          .run();
        const offer = await db
          .prepare(
            "SELECT id, stock_count FROM offers WHERE merchant_id = ? AND source_offer_id = ?",
          )
          .bind(merchant.id, item.sku)
          .first<{ id: number; stock_count: number | null }>();
        if (offer) {
          await recordOfferSnapshotIfChanged(db, {
            offerId: offer.id,
            price: lowPrice,
            highPrice: Number.isFinite(highPrice) ? highPrice : null,
            currency: item.offers?.priceCurrency ?? "CNY",
            stockStatus: stockStatus(item.offers?.availability),
            stockCount: offer.stock_count,
            observedAt,
          });
        }
        accepted += 1;
      }
    }
    await db
      .prepare(
        "UPDATE merchants SET status = ?, last_success_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP, last_error_code = NULL WHERE id = ?",
      )
      .bind(accepted > 0 ? "healthy" : "stale", merchant.id)
      .run();
  } catch (error) {
    errorCode = error instanceof Error ? error.message.slice(0, 80) : "aivora_sync_failed";
  }

  const status = errorCode ? "failed" : accepted > 0 ? "success" : "stale";
  await recordSourceRun(db, {
    sourceKey: "aivora-shop",
    runType: "sitemap-jsonld",
    status,
    discovered,
    accepted,
    rejected,
    durationMs: Date.now() - started.getTime(),
    errorCode,
    startedAt: started.toISOString(),
    finishedAt: new Date().toISOString(),
  });
  return { status, discovered, accepted, rejected };
}
