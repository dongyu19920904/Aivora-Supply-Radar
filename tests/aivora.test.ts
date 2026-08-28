import { describe, expect, it } from "vitest";
import { extractSitemapProductUrls, parseAivoraProductJsonLd } from "../src/ingest/aivora";

describe("Aivora public catalog adapter", () => {
  it("reads the shop Product JSON-LD contract", () => {
    const html = `<script id="aivora-route-jsonld" type="application/ld+json">${JSON.stringify({
      name: "ChatGPT Plus｜充值续费【月卡】",
      sku: "2",
      url: "https://www.aivora.cn/products/plus",
      image: ["https://www.aivora.cn/uploads/plus.webp"],
      offers: { price: "149", priceCurrency: "CNY", availability: "https://schema.org/InStock" },
    })}</script>`;
    const product = parseAivoraProductJsonLd(html);
    expect(product?.sku).toBe("2");
    expect(product?.offers?.price).toBe("149");
  });

  it("accepts only Aivora product URLs from the sitemap", () => {
    const xml = `<urlset><url><loc>https://www.aivora.cn/products/plus</loc></url><url><loc>https://evil.example/products/no</loc></url></urlset>`;
    expect(extractSitemapProductUrls(xml)).toEqual(["https://www.aivora.cn/products/plus"]);
  });

  it("rejects malformed JSON-LD", () => {
    expect(
      parseAivoraProductJsonLd(
        '<script id="aivora-route-jsonld" type="application/ld+json">{</script>',
      ),
    ).toBeNull();
  });
});
