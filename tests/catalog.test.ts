import { describe, expect, it } from "vitest";
import {
  AIVORA_OFFERS,
  calculateMargin,
  classifyProduct,
  itemFingerprint,
  PRODUCT_CATALOG,
} from "../src/domain/catalog";

describe("standard product catalog", () => {
  it("keeps the complete launch catalog and verified shop offers", () => {
    expect(PRODUCT_CATALOG.length).toBeGreaterThanOrEqual(48);
    expect(AIVORA_OFFERS).toHaveLength(24);
    expect(new Set(PRODUCT_CATALOG.map((item) => item.slug)).size).toBe(PRODUCT_CATALOG.length);
  });

  it("prefers the longest matching alias", () => {
    expect(classifyProduct("ChatGPT Pro 20x 续费充值")?.slug).toBe("chatgpt-pro-20x");
    expect(classifyProduct("Claude Max 20x 月卡")?.slug).toBe("claude-max-20x");
    expect(classifyProduct("Google Gemini Pro 年卡成品号")?.slug).toBe("gemini-pro-account");
  });

  it("keeps source identity in fingerprints while normalizing prices", () => {
    expect(itemFingerprint("shop", "sku-1", "Plus 149 元")).toBe(
      itemFingerprint("shop", "sku-1", "Plus 159 元"),
    );
    expect(itemFingerprint("shop", "sku-1", "Plus 149 元")).not.toBe(
      itemFingerprint("shop", "sku-2", "Plus 149 元"),
    );
  });

  it("calculates profit after platform fees", () => {
    expect(calculateMargin(100, 150, 0.05)).toEqual({ profit: 42.5, marginRate: 28.33 });
    expect(calculateMargin(100, 0)).toEqual({ profit: -100, marginRate: 0 });
  });
});
