import { describe, expect, it, vi } from "vitest";

// The Pages advanced-mode entrypoint is intentionally deployed as JavaScript.
// @ts-expect-error The deployment artifact has no separate TypeScript declaration.
import edge from "../pages-edge/public/_worker.js";

describe("Pages custom-domain edge", () => {
  it("forwards the original request through the Worker service binding", async () => {
    const request = new Request("https://supply.aivora.cn/products?category=account", {
      headers: { "x-request-id": "domain-smoke" },
    });
    const fetch = vi.fn(async (forwarded: Request) =>
      Response.json({ url: forwarded.url, requestId: forwarded.headers.get("x-request-id") }),
    );

    const response = await edge.fetch(request, { RADAR_SERVICE: { fetch } });

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(request);
    await expect(response.json()).resolves.toEqual({
      url: "https://supply.aivora.cn/products?category=account",
      requestId: "domain-smoke",
    });
  });

  it("fails closed when the service binding is missing", async () => {
    const response = await edge.fetch(new Request("https://supply.aivora.cn/"), {});

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toBe("Supply Radar upstream is unavailable");
  });

  it("retries transient upstream CPU failures before returning a successful page", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("error code: 1101", { status: 500 }))
      .mockResolvedValueOnce(
        new Response("<html>ready</html>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );

    const response = await edge.fetch(new Request("https://supply.aivora.cn/opportunities"), {
      RADAR_SERVICE: { fetch },
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-aivora-edge-cache")).toBe("BYPASS");
    await expect(response.text()).resolves.toContain("ready");
  });

  it("serves a fresh public cache entry without invoking SSR", async () => {
    const cached = new Response("<html>cached</html>", {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-aivora-edge-stored-at": String(Date.now()),
      },
    });
    const match = vi.fn(async (_request: Request) => cached);
    const fetch = vi.fn();

    const response = await edge.fetch(new Request("https://supply.aivora.cn/card-products"), {
      RADAR_SERVICE: { fetch },
      EDGE_CACHE: { match, put: vi.fn() },
    });

    expect(match).toHaveBeenCalledOnce();
    const matchedRequest = match.mock.calls[0]?.[0] as Request;
    expect(new URL(matchedRequest.url).searchParams.get("__aivora_edge_cache_v")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get("x-aivora-edge-cache")).toBe("HIT");
    await expect(response.text()).resolves.toContain("cached");
  });

  it("serves a stale page when every SSR retry exceeds the CPU budget", async () => {
    const cached = new Response("<html>last-known-good</html>", {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-aivora-edge-stored-at": String(Date.now() - 10 * 60 * 1000),
      },
    });
    const fetch = vi.fn(async () => new Response("error code: 1101", { status: 500 }));

    const response = await edge.fetch(new Request("https://supply.aivora.cn/opportunities"), {
      RADAR_SERVICE: { fetch },
      EDGE_CACHE: { match: vi.fn(async () => cached), put: vi.fn() },
    });

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-aivora-edge-cache")).toBe("STALE");
    expect(response.headers.get("warning")).toContain("Response is stale");
    await expect(response.text()).resolves.toContain("last-known-good");
  });

  it("uses the legacy service only after V2 retries fail on a public page", async () => {
    const v2Fetch = vi.fn(async () => new Response("error code: 1101", { status: 500 }));
    const legacyFetch = vi.fn(
      async () =>
        new Response("<html>legacy report</html>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    );

    const response = await edge.fetch(
      new Request("https://supply.aivora.cn/opportunities/2026-09-01"),
      {
        RADAR_SERVICE: { fetch: v2Fetch },
        LEGACY_SERVICE: { fetch: legacyFetch },
      },
    );

    expect(v2Fetch).toHaveBeenCalledTimes(4);
    expect(legacyFetch).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-aivora-edge-cache")).toBe("LEGACY");
  });

  it("does not retry a mutating request", async () => {
    const fetch = vi.fn(async () => new Response("error code: 1101", { status: 500 }));

    const response = await edge.fetch(
      new Request("https://supply.aivora.cn/api/admin/offers", {
        method: "POST",
        body: "{}",
      }),
      { RADAR_SERVICE: { fetch } },
    );

    expect(fetch).toHaveBeenCalledOnce();
    expect(response.status).toBe(503);
    expect(response.headers.get("x-aivora-edge-cache")).toBe("UNAVAILABLE");
  });

  it("never forwards failed V2 API reads to the incompatible legacy API", async () => {
    const v2Fetch = vi.fn(async () => new Response("error code: 1101", { status: 500 }));
    const legacyFetch = vi.fn();

    const response = await edge.fetch(
      new Request("https://supply.aivora.cn/api/products/chatgpt-plus/offers"),
      {
        RADAR_SERVICE: { fetch: v2Fetch },
        LEGACY_SERVICE: { fetch: legacyFetch },
      },
    );

    expect(v2Fetch).toHaveBeenCalledTimes(4);
    expect(legacyFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
  });
});
