import {
  AIVORA_OFFERS,
  itemFingerprint,
  OFFICIAL_PRICES,
  PRODUCT_CATALOG,
} from "../domain/catalog";
import type {
  OfferPublic,
  OpportunityDocument,
  OpportunityRow,
  ProductSummary,
  SubmissionInput,
} from "../domain/types";

const SEED_VERSION = "2026-08-29-v1";

export async function ensureSeed(db: D1Database): Promise<void> {
  const current = await db
    .prepare("SELECT value FROM settings WHERE key = 'seed_version'")
    .first<{ value: string }>();
  if (current?.value === SEED_VERSION) return;

  await db.batch(
    PRODUCT_CATALOG.map((product) =>
      db
        .prepare(
          `INSERT INTO products
           (slug, platform, name, subtitle, product_type, aliases_json, description, sort_order, is_visible, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
           ON CONFLICT(slug) DO UPDATE SET
             platform = excluded.platform,
             name = excluded.name,
             subtitle = excluded.subtitle,
             product_type = excluded.product_type,
             aliases_json = excluded.aliases_json,
             description = excluded.description,
             sort_order = excluded.sort_order,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          product.slug,
          product.platform,
          product.name,
          product.subtitle,
          product.productType,
          JSON.stringify(product.aliases),
          product.description,
          product.sortOrder,
        ),
    ),
  );

  await db
    .prepare(
      `INSERT INTO merchants
       (slug, name, site_url, source_type, status, source_score, last_success_at, last_checked_at, is_visible, updated_at)
       VALUES ('aivora', '爱窝啦·AI账号店', 'https://www.aivora.cn/', 'owned-sitemap', 'healthy', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         site_url = excluded.site_url,
         status = excluded.status,
         source_score = excluded.source_score,
         is_visible = 1,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .run();

  const merchant = await db
    .prepare("SELECT id FROM merchants WHERE slug = 'aivora'")
    .first<{ id: number }>();
  if (!merchant) throw new Error("seed_merchant_missing");

  const productRows = await db
    .prepare("SELECT id, slug FROM products")
    .all<{ id: number; slug: string }>();
  const productIds = new Map(productRows.results.map((row) => [row.slug, row.id]));
  const observedAt = new Date().toISOString();

  await db.batch(
    AIVORA_OFFERS.map((offer) => {
      const productId = productIds.get(offer.productSlug);
      if (!productId) throw new Error(`seed_product_missing:${offer.productSlug}`);
      const fingerprint = itemFingerprint("aivora", offer.sourceOfferId, offer.name);
      return db
        .prepare(
          `INSERT INTO offers
           (merchant_id, product_id, source_offer_id, original_name, source_url, image_url,
            price, high_price, currency, stock_status, warranty, delivery_type,
            item_fingerprint, is_comparable, approved, active, observed_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(merchant_id, source_offer_id) DO UPDATE SET
             product_id = excluded.product_id,
             original_name = excluded.original_name,
             source_url = excluded.source_url,
             image_url = excluded.image_url,
             price = excluded.price,
             high_price = excluded.high_price,
             currency = excluded.currency,
             stock_status = excluded.stock_status,
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
          offer.sourceOfferId,
          offer.name,
          offer.url,
          offer.imageUrl,
          offer.price,
          offer.highPrice ?? null,
          offer.currency,
          offer.stockStatus,
          offer.warranty,
          offer.deliveryType,
          fingerprint,
          observedAt,
        );
    }),
  );

  const offerRows = await db
    .prepare(
      "SELECT id, price, high_price, currency, stock_status, stock_count, observed_at FROM offers WHERE merchant_id = ?",
    )
    .bind(merchant.id)
    .all<{
      id: number;
      price: number | null;
      high_price: number | null;
      currency: string;
      stock_status: string;
      stock_count: number | null;
      observed_at: string;
    }>();

  if (offerRows.results.length > 0) {
    await db.batch(
      offerRows.results.map((offer) => {
        const fingerprint = `${offer.price ?? ""}|${offer.high_price ?? ""}|${offer.stock_status}|${offer.stock_count ?? ""}`;
        return db
          .prepare(
            `INSERT OR IGNORE INTO offer_snapshots
             (offer_id, price, high_price, currency, stock_status, stock_count, observed_at, fingerprint)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            offer.id,
            offer.price,
            offer.high_price,
            offer.currency,
            offer.stock_status,
            offer.stock_count,
            offer.observed_at,
            fingerprint,
          );
      }),
    );
  }

  await db.batch(
    OFFICIAL_PRICES.map((price) =>
      db
        .prepare(
          `INSERT INTO official_prices
           (slug, product_id, vendor, plan_name, region, price, currency, billing_period,
            quota_text, official_url, last_checked, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(slug) DO UPDATE SET
             product_id = excluded.product_id,
             vendor = excluded.vendor,
             plan_name = excluded.plan_name,
             region = excluded.region,
             price = excluded.price,
             currency = excluded.currency,
             billing_period = excluded.billing_period,
             quota_text = excluded.quota_text,
             official_url = excluded.official_url,
             last_checked = excluded.last_checked,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          price.slug,
          productIds.get(price.productSlug) ?? null,
          price.vendor,
          price.planName,
          price.region,
          price.price,
          price.currency,
          price.billingPeriod,
          price.quotaText,
          price.officialUrl,
          price.lastChecked,
        ),
    ),
  );

  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES ('seed_version', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(SEED_VERSION)
    .run();
}

export async function listProducts(
  db: D1Database,
  filters: { q?: string; platform?: string; type?: string; inStock?: boolean } = {},
): Promise<ProductSummary[]> {
  const where = ["p.is_visible = 1"];
  const binds: unknown[] = [];
  if (filters.q) {
    where.push(
      "(p.name LIKE ? OR p.subtitle LIKE ? OR p.platform LIKE ? OR p.aliases_json LIKE ?)",
    );
    const query = `%${filters.q.trim()}%`;
    binds.push(query, query, query, query);
  }
  if (filters.platform) {
    where.push("p.platform = ?");
    binds.push(filters.platform);
  }
  if (filters.type) {
    where.push("p.product_type = ?");
    binds.push(filters.type);
  }
  if (filters.inStock)
    where.push(
      "EXISTS (SELECT 1 FROM offers ox WHERE ox.product_id = p.id AND ox.active = 1 AND ox.approved = 1 AND ox.stock_status = 'in_stock' AND ox.price > 0)",
    );

  const result = await db
    .prepare(
      `SELECT p.id, p.slug, p.platform, p.name, p.subtitle, p.product_type, p.description,
        COUNT(o.id) AS offer_count,
        COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN o.merchant_id END) AS merchant_count,
        SUM(CASE WHEN o.stock_status = 'in_stock' THEN 1 ELSE 0 END) AS in_stock_count,
        MIN(CASE WHEN o.stock_status = 'in_stock' AND o.price > 0 AND o.is_comparable = 1 THEN o.price END) AS min_price,
        MIN(CASE WHEN o.stock_status = 'in_stock' AND o.price > 0 AND o.warranty NOT IN ('none', 'unknown') THEN o.price END) AS warranty_min_price,
        MAX(o.observed_at) AS last_observed_at
       FROM products p
       LEFT JOIN offers o ON o.product_id = p.id AND o.active = 1 AND o.approved = 1
       WHERE ${where.join(" AND ")}
       GROUP BY p.id
       ORDER BY CASE WHEN COUNT(o.id) > 0 THEN 0 ELSE 1 END, p.sort_order, p.id`,
    )
    .bind(...binds)
    .all<ProductSummary>();
  return result.results;
}

export async function getProduct(db: D1Database, slug: string): Promise<ProductSummary | null> {
  const products = await listProducts(db, { q: undefined });
  return products.find((product) => product.slug === slug) ?? null;
}

export async function listOffersForProduct(
  db: D1Database,
  productId: number,
): Promise<OfferPublic[]> {
  const result = await db
    .prepare(
      `SELECT o.id, m.slug AS merchant_slug, m.name AS merchant_name, m.source_score AS merchant_score,
        o.original_name, o.source_url, o.image_url, o.price, o.high_price, o.currency,
        o.stock_status, o.stock_count, o.warranty, o.delivery_type, o.item_fingerprint, o.observed_at
       FROM offers o
       JOIN merchants m ON m.id = o.merchant_id
       WHERE o.product_id = ? AND o.active = 1 AND o.approved = 1 AND m.is_visible = 1
       ORDER BY CASE WHEN o.stock_status = 'in_stock' THEN 0 ELSE 1 END,
         CASE WHEN o.price IS NULL THEN 1 ELSE 0 END, o.price, o.observed_at DESC`,
    )
    .bind(productId)
    .all<OfferPublic>();
  return result.results;
}

export async function recordOfferSnapshotIfChanged(
  db: D1Database,
  snapshot: {
    offerId: number;
    price: number | null;
    highPrice: number | null;
    currency: string;
    stockStatus: string;
    stockCount: number | null;
    observedAt: string;
  },
): Promise<boolean> {
  const fingerprint = `${snapshot.price ?? ""}|${snapshot.highPrice ?? ""}|${snapshot.stockStatus}|${snapshot.stockCount ?? ""}`;
  const latest = await db
    .prepare(
      "SELECT fingerprint FROM offer_snapshots WHERE offer_id = ? ORDER BY observed_at DESC, id DESC LIMIT 1",
    )
    .bind(snapshot.offerId)
    .first<{ fingerprint: string }>();
  if (latest?.fingerprint === fingerprint) return false;
  await db
    .prepare(
      `INSERT INTO offer_snapshots
       (offer_id, price, high_price, currency, stock_status, stock_count, observed_at, fingerprint)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      snapshot.offerId,
      snapshot.price,
      snapshot.highPrice,
      snapshot.currency,
      snapshot.stockStatus,
      snapshot.stockCount,
      snapshot.observedAt,
      fingerprint,
    )
    .run();
  return true;
}

export async function listOfferHistoryForProduct(
  db: D1Database,
  productId: number,
  limit = 100,
): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(
      `SELECT s.id, s.price, s.high_price, s.currency, s.stock_status, s.stock_count,
        s.observed_at, o.source_offer_id, o.original_name, m.slug AS merchant_slug,
        m.name AS merchant_name
       FROM offer_snapshots s
       JOIN offers o ON o.id = s.offer_id
       JOIN merchants m ON m.id = o.merchant_id
       WHERE o.product_id = ? AND o.approved = 1 AND m.is_visible = 1
       ORDER BY s.observed_at DESC, s.id DESC LIMIT ?`,
    )
    .bind(productId, Math.min(Math.max(limit, 1), 500))
    .all<Record<string, unknown>>();
  return result.results;
}

export async function listPlatforms(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare("SELECT DISTINCT platform FROM products WHERE is_visible = 1 ORDER BY platform")
    .all<{ platform: string }>();
  return result.results.map((row) => row.platform);
}

export async function listProductTypes(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(
      "SELECT DISTINCT product_type FROM products WHERE is_visible = 1 ORDER BY product_type",
    )
    .all<{ product_type: string }>();
  return result.results.map((row) => row.product_type);
}

export async function listMerchants(db: D1Database): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(
      `SELECT m.id, m.slug, m.name, m.site_url, m.status, m.source_score, m.last_success_at, m.last_checked_at,
        COUNT(o.id) AS offer_count,
        SUM(CASE WHEN o.stock_status = 'in_stock' THEN 1 ELSE 0 END) AS in_stock_count,
        COUNT(DISTINCT o.product_id) AS product_count
       FROM merchants m
       LEFT JOIN offers o ON o.merchant_id = m.id AND o.active = 1 AND o.approved = 1
       WHERE m.is_visible = 1
       GROUP BY m.id
       ORDER BY m.source_score DESC, m.name`,
    )
    .all<Record<string, unknown>>();
  return result.results;
}

export async function getMerchant(
  db: D1Database,
  slug: string,
): Promise<Record<string, unknown> | null> {
  return db
    .prepare(
      `SELECT m.id, m.slug, m.name, m.site_url, m.status, m.source_score, m.last_success_at,
        m.last_checked_at, m.last_error_code,
        COUNT(o.id) AS offer_count,
        SUM(CASE WHEN o.stock_status = 'in_stock' THEN 1 ELSE 0 END) AS in_stock_count,
        COUNT(DISTINCT o.product_id) AS product_count
       FROM merchants m
       LEFT JOIN offers o ON o.merchant_id = m.id AND o.active = 1 AND o.approved = 1
       WHERE m.slug = ? AND m.is_visible = 1 GROUP BY m.id`,
    )
    .bind(slug)
    .first<Record<string, unknown>>();
}

export async function listOffersForMerchant(
  db: D1Database,
  merchantId: number,
): Promise<Array<OfferPublic & { product_slug: string; product_name: string }>> {
  const result = await db
    .prepare(
      `SELECT o.id, m.slug AS merchant_slug, m.name AS merchant_name, m.source_score AS merchant_score,
        p.slug AS product_slug, p.name AS product_name, o.original_name, o.source_url, o.image_url,
        o.price, o.high_price, o.currency, o.stock_status, o.stock_count, o.warranty,
        o.delivery_type, o.item_fingerprint, o.observed_at
       FROM offers o
       JOIN merchants m ON m.id = o.merchant_id
       JOIN products p ON p.id = o.product_id
       WHERE o.merchant_id = ? AND o.active = 1 AND o.approved = 1 AND p.is_visible = 1
       ORDER BY CASE WHEN o.stock_status = 'in_stock' THEN 0 ELSE 1 END, p.sort_order, o.price`,
    )
    .bind(merchantId)
    .all<OfferPublic & { product_slug: string; product_name: string }>();
  return result.results;
}

export async function listOfficialPrices(db: D1Database): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(
      `SELECT op.*, p.slug AS product_slug, p.name AS product_name
       FROM official_prices op
       LEFT JOIN products p ON p.id = op.product_id
       ORDER BY CASE WHEN op.price IS NULL THEN 1 ELSE 0 END, op.vendor, op.plan_name`,
    )
    .all<Record<string, unknown>>();
  return result.results;
}

export async function listPriceChanges(
  db: D1Database,
  limit = 50,
): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(
      `WITH ranked AS (
         SELECT s.*, ROW_NUMBER() OVER (PARTITION BY s.offer_id ORDER BY s.observed_at DESC, s.id DESC) AS rn
         FROM offer_snapshots s
       )
       SELECT o.original_name, o.source_url, p.slug AS product_slug, p.name AS product_name,
         m.name AS merchant_name, latest.price AS current_price, previous.price AS previous_price,
         latest.stock_status AS current_stock, previous.stock_status AS previous_stock,
         latest.observed_at
       FROM ranked latest
       JOIN ranked previous ON previous.offer_id = latest.offer_id AND previous.rn = 2
       JOIN offers o ON o.id = latest.offer_id
       JOIN products p ON p.id = o.product_id
       JOIN merchants m ON m.id = o.merchant_id
       WHERE latest.rn = 1 AND (
         COALESCE(latest.price, -1) != COALESCE(previous.price, -1)
         OR latest.stock_status != previous.stock_status
       )
       ORDER BY latest.observed_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<Record<string, unknown>>();
  return result.results;
}

export async function upsertOpportunity(
  db: D1Database,
  document: OpportunityDocument,
  productMatches: Array<{ productId: number; reason: string }>,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO opportunities
       (report_date, title, description, body_markdown, source_url, published_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(report_date) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         body_markdown = excluded.body_markdown,
         source_url = excluded.source_url,
         published_at = excluded.published_at,
         synced_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      document.reportDate,
      document.title,
      document.description,
      document.bodyMarkdown,
      document.sourceUrl,
      document.publishedAt,
    )
    .run();
  const opportunity = await db
    .prepare("SELECT id FROM opportunities WHERE report_date = ?")
    .bind(document.reportDate)
    .first<{ id: number }>();
  if (!opportunity) throw new Error("opportunity_upsert_missing");
  await db
    .prepare("DELETE FROM opportunity_products WHERE opportunity_id = ?")
    .bind(opportunity.id)
    .run();
  if (productMatches.length > 0) {
    await db.batch(
      productMatches.map((match) =>
        db
          .prepare(
            "INSERT OR IGNORE INTO opportunity_products (opportunity_id, product_id, match_reason) VALUES (?, ?, ?)",
          )
          .bind(opportunity.id, match.productId, match.reason),
      ),
    );
  }
}

export async function listOpportunities(db: D1Database, limit = 30): Promise<OpportunityRow[]> {
  const result = await db
    .prepare("SELECT * FROM opportunities ORDER BY report_date DESC LIMIT ?")
    .bind(limit)
    .all<OpportunityRow>();
  return result.results;
}

export async function getOpportunity(db: D1Database, date: string): Promise<OpportunityRow | null> {
  return db
    .prepare("SELECT * FROM opportunities WHERE report_date = ?")
    .bind(date)
    .first<OpportunityRow>();
}

export async function getOpportunityProducts(
  db: D1Database,
  opportunityId: number,
): Promise<ProductSummary[]> {
  const result = await db
    .prepare(
      `SELECT p.id, p.slug, p.platform, p.name, p.subtitle, p.product_type, p.description,
        0 AS offer_count, 0 AS merchant_count, 0 AS in_stock_count,
        NULL AS min_price, NULL AS warranty_min_price, NULL AS last_observed_at
       FROM opportunity_products op JOIN products p ON p.id = op.product_id
       WHERE op.opportunity_id = ? ORDER BY p.sort_order`,
    )
    .bind(opportunityId)
    .all<ProductSummary>();
  return result.results;
}

export async function listProductOpportunities(
  db: D1Database,
  productId: number,
  limit = 10,
): Promise<OpportunityRow[]> {
  const result = await db
    .prepare(
      `SELECT o.* FROM opportunity_products op
       JOIN opportunities o ON o.id = op.opportunity_id
       WHERE op.product_id = ? ORDER BY o.report_date DESC LIMIT ?`,
    )
    .bind(productId, limit)
    .all<OpportunityRow>();
  return result.results;
}

export async function listPosts(db: D1Database, limit = 30): Promise<Record<string, unknown>[]> {
  const result = await db
    .prepare(
      "SELECT id, title, body_markdown, author_name, source_url, created_at, updated_at FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ?",
    )
    .bind(limit)
    .all<Record<string, unknown>>();
  return result.results;
}

export async function getPost(db: D1Database, id: number): Promise<Record<string, unknown> | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return db
    .prepare(
      "SELECT id, title, body_markdown, author_name, source_url, created_at, updated_at FROM posts WHERE id = ? AND status = 'published'",
    )
    .bind(id)
    .first<Record<string, unknown>>();
}

export async function createSubmission(
  db: D1Database,
  input: SubmissionInput,
  reporterHash: string,
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO submissions (kind, name, contact, source_url, content, status, reporter_hash)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .bind(
      input.kind,
      input.name,
      input.contact ?? "",
      input.sourceUrl ?? null,
      input.content,
      reporterHash,
    )
    .run();
  return Number(result.meta.last_row_id);
}

export async function countRecentSubmissions(
  db: D1Database,
  reporterHash: string,
): Promise<number> {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM submissions WHERE reporter_hash = ? AND created_at >= datetime('now', '-1 hour')",
    )
    .bind(reporterHash)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function moderateSubmission(
  db: D1Database,
  id: number,
  action: "approve" | "reject",
  note: string,
): Promise<boolean> {
  const submission = await db
    .prepare("SELECT * FROM submissions WHERE id = ?")
    .bind(id)
    .first<Record<string, unknown>>();
  if (!submission) return false;
  await db
    .prepare(
      "UPDATE submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ? WHERE id = ?",
    )
    .bind(action === "approve" ? "approved" : "rejected", note, id)
    .run();
  if (action === "approve" && submission.kind === "post") {
    await db
      .prepare(
        `INSERT OR IGNORE INTO posts (submission_id, title, body_markdown, author_name, source_url, status)
         VALUES (?, ?, ?, ?, ?, 'published')`,
      )
      .bind(
        id,
        String(submission.name),
        String(submission.content),
        String(submission.name),
        submission.source_url ?? null,
      )
      .run();
  }
  return true;
}

export async function recordSourceRun(
  db: D1Database,
  run: {
    sourceKey: string;
    runType: string;
    status: string;
    discovered: number;
    accepted: number;
    rejected: number;
    durationMs: number;
    errorCode?: string;
    startedAt: string;
    finishedAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO source_runs
       (source_key, run_type, status, discovered_count, accepted_count, rejected_count,
        duration_ms, error_code, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      run.sourceKey,
      run.runType,
      run.status,
      run.discovered,
      run.accepted,
      run.rejected,
      run.durationMs,
      run.errorCode ?? null,
      run.startedAt,
      run.finishedAt,
    )
    .run();
}

export async function healthSnapshot(db: D1Database): Promise<Record<string, unknown>> {
  const [products, offers, merchants, opportunity, sourceRun] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS count FROM products WHERE is_visible = 1")
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM offers WHERE active = 1 AND approved = 1")
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM merchants WHERE is_visible = 1")
      .first<{ count: number }>(),
    db
      .prepare("SELECT report_date, synced_at FROM opportunities ORDER BY report_date DESC LIMIT 1")
      .first<Record<string, unknown>>(),
    db
      .prepare("SELECT source_key, status, finished_at FROM source_runs ORDER BY id DESC LIMIT 1")
      .first<Record<string, unknown>>(),
  ]);
  return {
    status: "ok",
    database: "ok",
    products: products?.count ?? 0,
    offers: offers?.count ?? 0,
    merchants: merchants?.count ?? 0,
    latestOpportunity: opportunity ?? null,
    latestSourceRun: sourceRun ?? null,
    checkedAt: new Date().toISOString(),
  };
}
