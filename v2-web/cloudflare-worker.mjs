import openNextWorker from './.open-next/worker.js';

export {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from './.open-next/worker.js';

const PUBLIC_HTML_ROUTES = [
  '/about',
  '/blog',
  '/card-products',
  '/changes',
  '/channels',
  '/community',
  '/guide',
  '/methodology',
  '/official-prices',
  '/opportunities',
  '/submit',
];
const EDGE_CACHE_SECONDS = 300;

function failureResponse(request, error) {
  const requestUrl = new URL(request.url);
  console.error('Aivora public request failed:', {
    pathname: requestUrl.pathname,
    method: request.method,
    message: error instanceof Error ? error.message : String(error),
  });

  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) {
    return Response.json(
      { error: 'supply_service_temporarily_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' } },
    );
  }

  return new Response(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>货源数据暂时不可用｜爱窝啦·货源雷达</title><style>body{margin:0;background:#f7f8f5;color:#202723;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:560px;border:1px solid #dfe5df;border-radius:18px;background:#fff;padding:32px;box-shadow:0 12px 40px rgba(31,41,35,.07)}h1{font-size:28px;margin:0 0 12px}p{line-height:1.8;color:#5f6862}a{display:inline-flex;margin-top:8px;border-radius:999px;background:#26332d;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700}</style></head><body><main class="wrap"><section class="card"><h1>货源数据正在重新连接</h1><p>当前页面的一次实时读取没有完成。商品、报价和账号商家经营日报彼此隔离，不会发布未经确认的数据。请稍后重试，或先返回货源首页。</p><a href="/">返回货源首页</a></section></main></body></html>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-store',
        'Retry-After': '30',
        'X-Robots-Tag': 'noindex, follow',
        'x-aivora-edge-cache': 'BYPASS; reason=worker-error',
      },
    },
  );
}

function isPublicHtmlPath(pathname) {
  if (pathname === '/') return true;
  return PUBLIC_HTML_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function hasAdminSession(request) {
  const cookie = request.headers.get('cookie') || '';
  return /(?:^|;\s*)(?:admin_session|admin_auth)=/i.test(cookie);
}

function isFullDocumentRequest(request) {
  const accept = request.headers.get('accept') || '';
  return (
    request.method === 'GET' &&
    accept.includes('text/html') &&
    !request.headers.has('rsc') &&
    !request.headers.has('next-action') &&
    !request.headers.has('next-router-state-tree') &&
    !request.headers.has('next-router-prefetch') &&
    request.headers.get('purpose') !== 'prefetch' &&
    request.headers.get('sec-purpose') !== 'prefetch'
  );
}

function cacheBypassReason(request, url) {
  if (!isFullDocumentRequest(request)) return 'non-document';
  if (!isPublicHtmlPath(url.pathname)) return 'private-route';
  if (url.search) return 'query-string';
  if (hasAdminSession(request)) return 'admin-session';
  return null;
}

function withCacheStatus(response, status) {
  const result = new Response(response.body, response);
  result.headers.set('x-aivora-edge-cache', status);
  return result;
}

function isCacheableHtml(response) {
  const contentType = response.headers.get('content-type') || '';
  const cacheControl = response.headers.get('cache-control') || '';
  return (
    response.status === 200 &&
    contentType.includes('text/html') &&
    !response.headers.has('set-cookie') &&
    !/(?:private|no-store)/i.test(cacheControl)
  );
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const bypassReason = cacheBypassReason(request, url);
      if (bypassReason) {
        const response = await openNextWorker.fetch(request, env, ctx);
        return withCacheStatus(response, `BYPASS; reason=${bypassReason}`);
      }

    // Use a normalized key so incidental browser headers and cookies do not
    // fragment the public HTML cache. Requests with admin cookies never reach
    // this branch.
      const cacheKey = new Request(url.toString(), {
        method: 'GET',
        headers: { accept: 'text/html' },
      });
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return withCacheStatus(cached, 'HIT');

      const response = await openNextWorker.fetch(request, env, ctx);
      if (!isCacheableHtml(response)) return withCacheStatus(response, 'BYPASS; reason=response');

      const cacheResponse = new Response(response.body, response);
      cacheResponse.headers.set(
        'Cache-Control',
        `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=60`,
      );
      cacheResponse.headers.delete('set-cookie');
      ctx.waitUntil(cache.put(cacheKey, cacheResponse.clone()));

      return withCacheStatus(cacheResponse, 'MISS');
    } catch (error) {
      return failureResponse(request, error);
    }
  },
};
