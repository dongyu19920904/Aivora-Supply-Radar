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
});
