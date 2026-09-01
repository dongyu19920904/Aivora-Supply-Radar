import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/domain/types";
import { app } from "../src/index";

afterEach(() => vi.unstubAllGlobals());

function seededEmptyDatabase(): D1Database {
  const statement = {
    bind: () => statement,
    first: async () => ({ value: "2026-08-29-v1" }),
    all: async () => ({ results: [], success: true, meta: {} }),
    run: async () => ({ results: [], success: true, meta: {} }),
  };
  return {
    prepare: () => statement,
    batch: async () => [],
  } as unknown as D1Database;
}

describe("request isolation", () => {
  it("renders an empty-cache homepage without fetching remote opportunity data", async () => {
    const remoteFetch = vi.fn<typeof fetch>(() => {
      throw new Error("remote_fetch_must_not_run");
    });
    vi.stubGlobal("fetch", remoteFetch);
    const env: Env = {
      DB: seededEmptyDatabase(),
      SITE_URL: "https://supply.aivora.cn",
    };

    const [home, opportunities, latestOpportunity] = await Promise.all([
      app.fetch(new Request(`${env.SITE_URL}/`), env),
      app.fetch(new Request(`${env.SITE_URL}/opportunities`), env),
      app.fetch(new Request(`${env.SITE_URL}/opportunities/latest`), env),
    ]);

    expect(home.status).toBe(200);
    expect(opportunities.status).toBe(200);
    expect(latestOpportunity.status).toBe(302);
    expect(latestOpportunity.headers.get("location")).toBe("/opportunities");
    const homeHtml = await home.text();
    expect(homeHtml).toContain("爱窝啦 AI 货源雷达");
    expect(homeHtml).toContain('<link rel="canonical" href="https://supply.aivora.cn/">');
    expect(remoteFetch).not.toHaveBeenCalled();
  });
});
