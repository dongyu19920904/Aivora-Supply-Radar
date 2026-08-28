import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminAuthorized, secureEqual, stableHash } from "../src/security/auth";
import { fetchPublicResource, isSafePublicHttpsUrl } from "../src/security/url";

afterEach(() => vi.unstubAllGlobals());

describe("public source and admin boundaries", () => {
  it("blocks local, private, credentialed and non-HTTPS URLs", () => {
    for (const url of [
      "http://example.com/feed.json",
      "https://localhost/feed.json",
      "https://127.0.0.1/feed.json",
      "https://10.2.3.4/feed.json",
      "https://user:pass@example.com/feed.json",
      "https://service.internal/feed.json",
    ]) {
      expect(isSafePublicHttpsUrl(url)).toBe(false);
    }
    expect(isSafePublicHttpsUrl("https://www.aivora.cn/sitemap.xml")).toBe(true);
  });

  it("hashes deterministically and rejects missing admin secrets", async () => {
    expect(await stableHash("same")).toBe(await stableHash("same"));
    expect(await secureEqual("alpha", "alpha")).toBe(true);
    expect(await secureEqual("alpha", "beta")).toBe(false);
    expect(await isAdminAuthorized("Bearer secret", undefined)).toBe(false);
    expect(await isAdminAuthorized("Bearer secret", "secret")).toBe(true);
  });

  it("follows only revalidated HTTPS redirects", async () => {
    const mockedFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 301,
          headers: { location: "https://merchant.example/catalog/" },
        }),
      )
      .mockResolvedValueOnce(
        new Response('{"ok":true}', {
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", mockedFetch);
    const response = await fetchPublicResource("https://merchant.example/catalog", {
      acceptedTypes: ["application/json"],
    });
    expect(await response.json()).toEqual({ ok: true });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("blocks unsafe redirect targets and oversized streamed bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } }),
        ),
    );
    await expect(fetchPublicResource("https://merchant.example/feed")).rejects.toThrow(
      "unsafe_source_redirect",
    );

    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("123456", { headers: { "content-type": "text/plain" } })),
    );
    await expect(
      fetchPublicResource("https://merchant.example/feed", { maxBytes: 5 }),
    ).rejects.toThrow("source_too_large");
  });
});
