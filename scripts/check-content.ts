import { AIVORA_OFFERS, OFFICIAL_PRICES, PRODUCT_CATALOG } from "../src/domain/catalog";
import { isSafePublicHttpsUrl } from "../src/security/url";

const failures: string[] = [];
const productSlugs = new Set<string>();
const offerIds = new Set<string>();

for (const product of PRODUCT_CATALOG) {
  if (productSlugs.has(product.slug)) failures.push(`duplicate_product:${product.slug}`);
  productSlugs.add(product.slug);
  if (!/^[a-z0-9-]+$/.test(product.slug)) failures.push(`invalid_product_slug:${product.slug}`);
  if (product.aliases.length === 0) failures.push(`missing_aliases:${product.slug}`);
}

for (const offer of AIVORA_OFFERS) {
  if (offerIds.has(offer.sourceOfferId)) failures.push(`duplicate_offer:${offer.sourceOfferId}`);
  offerIds.add(offer.sourceOfferId);
  if (!productSlugs.has(offer.productSlug)) failures.push(`orphan_offer:${offer.sourceOfferId}`);
  if (
    !isSafePublicHttpsUrl(offer.url) ||
    !offer.url.startsWith("https://www.aivora.cn/products/")
  ) {
    failures.push(`invalid_offer_url:${offer.sourceOfferId}`);
  }
  if (!isSafePublicHttpsUrl(offer.imageUrl))
    failures.push(`invalid_image_url:${offer.sourceOfferId}`);
  if (offer.highPrice !== undefined && offer.highPrice < offer.price) {
    failures.push(`inverted_price_range:${offer.sourceOfferId}`);
  }
}

for (const price of OFFICIAL_PRICES) {
  if (!productSlugs.has(price.productSlug)) failures.push(`orphan_official_price:${price.slug}`);
  if (!isSafePublicHttpsUrl(price.officialUrl)) failures.push(`invalid_official_url:${price.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(price.lastChecked))
    failures.push(`invalid_checked_date:${price.slug}`);
}

console.log(
  JSON.stringify(
    {
      status: failures.length === 0 ? "publishable" : "blocked",
      products: productSlugs.size,
      offers: offerIds.size,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length > 0) process.exitCode = 1;
