const CACHE_FRESH_SECONDS = 5 * 60;
const CACHE_STALE_SECONDS = 24 * 60 * 60;
const CACHE_VERSION = "release-development";
const MAX_UPSTREAM_ATTEMPTS = 4;
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504]);

function isIdempotent(request) {
  return request.method === "GET" || request.method === "HEAD";
}

function isPublicRequest(request) {
  return (
    request.method === "GET" &&
    !request.headers.has("authorization") &&
    !request.headers.has("cookie")
  );
}

function hasLegacyPage(request) {
  const path = new URL(request.url).pathname;
  return (
    path === "/" ||
    path === "/changes" ||
    path === "/opportunities" ||
    /^\/opportunities\/\d{4}-\d{2}-\d{2}$/.test(path) ||
    path === "/official-prices" ||
    path === "/community" ||
    path === "/submit" ||
    path === "/sitemap.xml" ||
    path === "/robots.txt"
  );
}

function isCacheableResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return (
    response.ok &&
    !response.headers.has("set-cookie") &&
    (contentType.includes("text/html") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      contentType.includes("text/plain"))
  );
}

function getDefaultCache(env) {
  return env.EDGE_CACHE || globalThis.caches?.default || null;
}

function cacheKey(request) {
  const url = new URL(request.url);
  url.searchParams.set("__aivora_edge_cache_v", CACHE_VERSION);
  return new Request(url, { method: "GET" });
}

function cacheAgeSeconds(response) {
  const storedAt = Number(response.headers.get("x-aivora-edge-stored-at"));
  if (!Number.isFinite(storedAt) || storedAt <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - storedAt) / 1000);
}

function clientResponse(response, state, warning) {
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";
  headers.delete("x-aivora-edge-stored-at");
  headers.set("x-aivora-edge-cache", state);
  headers.set("x-aivora-edge-release", CACHE_VERSION);
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/xml") ||
    contentType.includes("text/xml") ||
    contentType.includes("text/plain")
  ) {
    headers.set("cache-control", "private, no-store, no-cache, max-age=0, must-revalidate");
    headers.set("cloudflare-cdn-cache-control", "no-store");
  }
  if (warning) headers.set("warning", warning);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function putCache(cache, request, response, context) {
  const headers = new Headers(response.headers);
  headers.set("x-aivora-edge-stored-at", String(Date.now()));
  headers.set("cache-control", `public, max-age=${CACHE_STALE_SECONDS}`);
  const stored = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  const write = cache.put(request, stored).catch(() => undefined);
  if (context?.waitUntil) context.waitUntil(write);
  else await write;
}

async function fetchWithRetry(request, service) {
  const attempts = isIdempotent(request) ? MAX_UPSTREAM_ATTEMPTS : 1;
  let lastResponse = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await service.fetch(attempt === 0 ? request : request.clone());
      lastResponse = response;
      if (!TRANSIENT_STATUSES.has(response.status)) return response;
    } catch {
      lastResponse = null;
    }
  }
  return lastResponse;
}

function unavailableResponse() {
  return new Response(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>货源雷达正在刷新</title><style>body{margin:0;background:#f7f7f4;color:#18181b;font:16px/1.7 system-ui,sans-serif}.box{max-width:560px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e4e4e7;border-radius:18px;box-shadow:0 18px 55px #18181b14}h1{font-size:24px;margin:0 0 12px}a{display:inline-block;margin-top:12px;padding:10px 18px;border-radius:10px;background:#facc15;color:#18181b;text-decoration:none;font-weight:700}</style></head><body><main class="box"><h1>货源雷达正在刷新</h1><p>边缘节点暂时未能完成数据加载。请稍后重试，已发布的数据不会丢失。</p><a href="">重新加载</a></main></body></html>`,
    {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": "3",
        "x-aivora-edge-cache": "UNAVAILABLE",
      },
    },
  );
}

const edge = {
  async fetch(request, env, context) {
    if (!env.RADAR_SERVICE || typeof env.RADAR_SERVICE.fetch !== "function") {
      return new Response("Supply Radar upstream is unavailable", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const cache = isPublicRequest(request) ? getDefaultCache(env) : null;
    const key = cache ? cacheKey(request) : null;
    let cached = null;
    if (cache && key) {
      cached = await cache.match(key).catch(() => null);
      if (cached && cacheAgeSeconds(cached) <= CACHE_FRESH_SECONDS) {
        return clientResponse(cached, "HIT");
      }
    }

    const response = await fetchWithRetry(request, env.RADAR_SERVICE);
    if (response && !TRANSIENT_STATUSES.has(response.status)) {
      if (cache && key && isCacheableResponse(response)) {
        await putCache(cache, key, response, context);
      }
      return clientResponse(response, cache ? "MISS" : "BYPASS");
    }

    if (cached && cacheAgeSeconds(cached) <= CACHE_STALE_SECONDS) {
      return clientResponse(cached, "STALE", '110 - "Response is stale"');
    }

    if (
      isPublicRequest(request) &&
      hasLegacyPage(request) &&
      env.LEGACY_SERVICE &&
      typeof env.LEGACY_SERVICE.fetch === "function"
    ) {
      const fallback = await env.LEGACY_SERVICE.fetch(request.clone()).catch(() => null);
      if (fallback?.ok) {
        return clientResponse(fallback, "LEGACY", '111 - "Revalidation failed"');
      }
    }

    return unavailableResponse();
  },
};

export default edge;
