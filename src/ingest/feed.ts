import { classifyProduct, itemFingerprint } from "../domain/catalog";
import { fetchPublicResource, isSafePublicHttpsUrl } from "../security/url";
import { recordOfferSnapshotIfChanged, recordSourceRun } from "../services/database";

interface MerchantFeed {
  merchant?: { name?: string; site_url?: string };
  offers?: Array<{
    id?: string;
    name?: string;
    url?: string;
    image_url?: string;
    price?: number;
    high_price?: number;
    currency?: string;
    stock_status?: string;
    stock_count?: number;
    warranty?: string;
    delivery_type?: string;
  }>;
}

const STOCK_STATUSES = new Set(["in_stock", "out_of_stock", "unknown"]);

export async function syncMerchantFeeds(
  db: D1Database,
): Promise<{ sources: number; accepted: number }> {
  const merchants = await db
    .prepare(
      "SELECT id, slug, feed_url FROM merchants WHERE feed_url IS NOT NULL AND status IN ('healthy', 'approved', 'stale')",
    )
    .all<{ id: number; slug: string; feed_url: string }>();
  const products = await db
    .prepare("SELECT id, slug FROM products")
    .all<{ id: number; slug: string }>();
  const productIds = new Map(products.results.map((row) => [row.slug, row.id]));
  let totalAccepted = 0;
  for (const merchant of merchants.results) {
    const started = new Date();
    let discovered = 0;
    let accepted = 0;
    let rejected = 0;
    let errorCode: string | undefined;
    try {
      const response = await fetchPublicResource(merchant.feed_url, {
        acceptedTypes: ["application/json", "application/ld+json"],
        maxBytes: 2_000_000,
      });
      const feed = (await response.json()) as MerchantFeed;
      const offers = Array.isArray(feed.offers) ? feed.offers.slice(0, 500) : [];
      discovered = offers.length;
      for (const raw of offers) {
        if (
          !raw.id ||
          raw.id.length > 120 ||
          !raw.name ||
          raw.name.length > 300 ||
          !raw.url ||
          raw.url.length > 2_000 ||
          !isSafePublicHttpsUrl(raw.url) ||
          (raw.image_url !== undefined && !isSafePublicHttpsUrl(raw.image_url)) ||
          !Number.isFinite(raw.price) ||
          Number(raw.price) < 0 ||
          (raw.high_price !== undefined &&
            (!Number.isFinite(raw.high_price) || Number(raw.high_price) < Number(raw.price))) ||
          (raw.currency !== undefined && !/^[A-Z]{3}$/.test(raw.currency)) ||
          (raw.stock_status !== undefined && !STOCK_STATUSES.has(raw.stock_status)) ||
          (raw.warranty !== undefined && raw.warranty.length > 100) ||
          (raw.delivery_type !== undefined && raw.delivery_type.length > 100)
        ) {
          rejected += 1;
          continue;
        }
        const product = classifyProduct(raw.name);
        const productId = productIds.get(product?.slug ?? "other-product");
        if (!productId) {
          rejected += 1;
          continue;
        }
        const observedAt = new Date().toISOString();
        await db
          .prepare(
            `INSERT INTO offers
             (merchant_id, product_id, source_offer_id, original_name, source_url, image_url,
              price, high_price, currency, stock_status, stock_count, warranty, delivery_type,
              item_fingerprint, is_comparable, approved, active, observed_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(merchant_id, source_offer_id) DO UPDATE SET
               product_id = excluded.product_id,
               original_name = excluded.original_name,
               source_url = excluded.source_url,
               image_url = excluded.image_url,
               price = excluded.price,
               high_price = excluded.high_price,
               currency = excluded.currency,
               stock_status = excluded.stock_status,
               stock_count = excluded.stock_count,
               warranty = excluded.warranty,
               delivery_type = excluded.delivery_type,
               item_fingerprint = excluded.item_fingerprint,
               active = 1,
               observed_at = excluded.observed_at,
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            merchant.id,
            productId,
            raw.id,
            raw.name,
            raw.url,
            raw.image_url ?? null,
            raw.price,
            raw.high_price ?? null,
            raw.currency ?? "CNY",
            raw.stock_status ?? "unknown",
            raw.stock_count ?? null,
            raw.warranty ?? "unknown",
            raw.delivery_type ?? "unknown",
            itemFingerprint(merchant.slug, raw.id, raw.name),
            observedAt,
          )
          .run();
        const storedOffer = await db
          .prepare(
            "SELECT id, stock_count FROM offers WHERE merchant_id = ? AND source_offer_id = ?",
          )
          .bind(merchant.id, raw.id)
          .first<{ id: number; stock_count: number | null }>();
        if (storedOffer) {
          await recordOfferSnapshotIfChanged(db, {
            offerId: storedOffer.id,
            price: Number(raw.price),
            highPrice: Number.isFinite(raw.high_price) ? Number(raw.high_price) : null,
            currency: raw.currency ?? "CNY",
            stockStatus: raw.stock_status ?? "unknown",
            stockCount: raw.stock_count ?? null,
            observedAt,
          });
        }
        accepted += 1;
      }
      await db
        .prepare(
          "UPDATE merchants SET status = 'healthy', last_success_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP, last_error_code = NULL WHERE id = ?",
        )
        .bind(merchant.id)
        .run();
    } catch (error) {
      errorCode = error instanceof Error ? error.message.slice(0, 80) : "merchant_feed_failed";
      await db
        .prepare(
          "UPDATE merchants SET status = 'stale', last_checked_at = CURRENT_TIMESTAMP, last_error_code = ? WHERE id = ?",
        )
        .bind(errorCode, merchant.id)
        .run();
    }
    await recordSourceRun(db, {
      sourceKey: `merchant:${merchant.slug}`,
      runType: "json-feed",
      status: errorCode ? "failed" : "success",
      discovered,
      accepted,
      rejected,
      durationMs: Date.now() - started.getTime(),
      errorCode,
      startedAt: started.toISOString(),
      finishedAt: new Date().toISOString(),
    });
    totalAccepted += accepted;
  }
  return { sources: merchants.results.length, accepted: totalAccepted };
}
