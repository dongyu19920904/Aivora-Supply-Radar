import { AIVORA_OFFERS, OFFICIAL_PRICES, PRODUCT_CATALOG } from "../src/domain/catalog";
import { isSafePublicHttpsUrl } from "../src/security/url";

const productSlugs = new Set(PRODUCT_CATALOG.map((product) => product.slug));
const failures: string[] = [];

for (const offer of AIVORA_OFFERS) {
  if (!productSlugs.has(offer.productSlug)) failures.push(`unknown_product:${offer.sourceOfferId}`);
  if (!isSafePublicHttpsUrl(offer.url)) failures.push(`unsafe_offer_url:${offer.sourceOfferId}`);
  if (!isSafePublicHttpsUrl(offer.imageUrl))
    failures.push(`unsafe_image_url:${offer.sourceOfferId}`);
  if (!Number.isFinite(offer.price) || offer.price < 0)
    failures.push(`invalid_price:${offer.sourceOfferId}`);
}

for (const official of OFFICIAL_PRICES) {
  if (!productSlugs.has(official.productSlug))
    failures.push(`unknown_official_product:${official.slug}`);
  if (!isSafePublicHttpsUrl(official.officialUrl))
    failures.push(`unsafe_official_url:${official.slug}`);
}

const result = {
  status: failures.length === 0 ? "publishable" : "blocked",
  products: PRODUCT_CATALOG.length,
  offers: AIVORA_OFFERS.length,
  officialPrices: OFFICIAL_PRICES.length,
  failures,
};

console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) process.exitCode = 1;
