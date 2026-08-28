import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Env, SubmissionInput } from "./domain/types";
import { syncAivoraCatalog } from "./ingest/aivora";
import { syncMerchantFeeds } from "./ingest/feed";
import { syncLatestOpportunity } from "./ingest/opportunity";
import { isAdminAuthorized, stableHash } from "./security/auth";
import { isSafePublicHttpsUrl } from "./security/url";
import {
  countRecentSubmissions,
  createSubmission,
  ensureSeed,
  getMerchant,
  getOpportunity,
  getOpportunityProducts,
  getPost,
  getProduct,
  healthSnapshot,
  listMerchants,
  listOfferHistoryForProduct,
  listOffersForMerchant,
  listOffersForProduct,
  listOfficialPrices,
  listOpportunities,
  listPlatforms,
  listPosts,
  listPriceChanges,
  listProductOpportunities,
  listProducts,
  listProductTypes,
  moderateSubmission,
} from "./services/database";
import { layout, SITE_CSS, SITE_JS } from "./ui/layout";
import {
  changesPage,
  communityPage,
  homePage,
  merchantDetailPage,
  merchantsPage,
  methodologyPage,
  notFoundPage,
  officialPricesPage,
  opportunitiesPage,
  opportunityDetailPage,
  postDetailPage,
  productDetailPage,
  productsPage,
  submitPage,
} from "./ui/pages";

type Bindings = { Bindings: Env };
const app = new Hono<Bindings>();

function siteUrl(env: Env): string {
  return env.SITE_URL || "https://supply.aivora.cn";
}

function html(
  c: Context<Bindings>,
  body: string,
  meta: Parameters<typeof layout>[0],
  status: ContentfulStatusCode = 200,
): Response {
  return c.html(layout(meta, body, siteUrl(c.env)), status);
}

function parseBoolean(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "in";
}

function submissionFromBody(body: Record<string, string | File>): SubmissionInput {
  const kind = String(body.kind ?? "") as SubmissionInput["kind"];
  const allowed = new Set<SubmissionInput["kind"]>([
    "merchant",
    "offer",
    "correction",
    "exposure",
    "post",
  ]);
  if (!allowed.has(kind)) throw new Error("invalid_submission_kind");
  const name = String(body.name ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const sourceUrl = String(body.sourceUrl ?? body.source_url ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (name.length < 2 || name.length > 100) throw new Error("invalid_submission_name");
  if (contact.length > 160) throw new Error("invalid_submission_contact");
  if (content.length < 20 || content.length > 8000) throw new Error("invalid_submission_content");
  if (sourceUrl && !isSafePublicHttpsUrl(sourceUrl)) throw new Error("invalid_submission_url");
  return { kind, name, contact, sourceUrl: sourceUrl || undefined, content };
}

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://www.aivora.cn data:; style-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests",
  );
  if (new URL(c.req.url).protocol === "https:")
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  await next();
});

app.get("/assets/site.css", (c) =>
  c.text(SITE_CSS, 200, {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);
app.get("/assets/site.js", (c) =>
  c.text(SITE_JS, 200, {
    "Content-Type": "text/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);
app.get("/favicon.svg", (c) =>
  c.body(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#f5b700"/><path d="M16 48 28 15h9l12 33h-9l-2-7H26l-2 7zm13-15h7l-3-11z" fill="#17120a"/></svg>',
    200,
    { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  ),
);

app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/assets/") || c.req.path === "/favicon.svg") return next();
  await ensureSeed(c.env.DB);
  return next();
});

app.get("/", async (c) => {
  const [products, changes] = await Promise.all([
    listProducts(c.env.DB),
    listPriceChanges(c.env.DB, 12),
  ]);
  let opportunities = await listOpportunities(c.env.DB, 1);
  if (!opportunities.length) {
    try {
      await syncLatestOpportunity(c.env.DB, c.env.SOURCE_REPO);
      opportunities = await listOpportunities(c.env.DB, 1);
    } catch {
      opportunities = [];
    }
  }
  c.header("Cache-Control", "public, max-age=120, s-maxage=300, stale-while-revalidate=600");
  return html(c, homePage({ products, opportunity: opportunities[0] ?? null, changes }), {
    title: "爱窝啦 AI 货源雷达",
    description:
      "聚合 AI 账号、订阅、API 与数字服务公开报价，把价格、库存和账号商机变成卖家每天可执行的经营动作。",
    path: "/",
  });
});

app.get("/products", async (c) => {
  const filters = {
    q: c.req.query("q"),
    platform: c.req.query("platform"),
    type: c.req.query("type"),
    inStock: parseBoolean(c.req.query("stock")),
  };
  const [products, platforms, types] = await Promise.all([
    listProducts(c.env.DB, filters),
    listPlatforms(c.env.DB),
    listProductTypes(c.env.DB),
  ]);
  c.header("Cache-Control", "public, max-age=60, s-maxage=180");
  return html(c, productsPage({ products, platforms, types, filters }), {
    title: "全部 AI 货源",
    description:
      "查看 AI 账号、订阅、API、邮箱、接码、社媒、虚拟卡与其他数字服务的标准商品和公开报价。",
    path: "/products",
  });
});

app.get("/products/:slug", async (c) => {
  const product = await getProduct(c.env.DB, c.req.param("slug"));
  if (!product)
    return html(
      c,
      notFoundPage(),
      {
        title: "商品未找到",
        description: "该标准商品不存在或暂未公开。",
        path: c.req.path,
        noindex: true,
      },
      404,
    );
  const [offers, related, history] = await Promise.all([
    listOffersForProduct(c.env.DB, product.id),
    listProductOpportunities(c.env.DB, product.id),
    listOfferHistoryForProduct(c.env.DB, product.id),
  ]);
  const available = offers.filter(
    (offer) => offer.stock_status === "in_stock" && Number(offer.price) > 0,
  );
  const prices = available.map((offer) => Number(offer.price));
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: new URL(`/products/${product.slug}`, siteUrl(c.env)).toString(),
    category: product.product_type,
  };
  if (prices.length > 0) {
    schema.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "CNY",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: "https://schema.org/InStock",
    };
  }
  c.header("Cache-Control", "public, max-age=120, s-maxage=300");
  return html(c, productDetailPage(product, offers, related, history), {
    title: `${product.name}货源与价格`,
    description: `${product.name}公开报价、库存、商家、价格区间、利润试算与相关账号商机。`,
    path: c.req.path,
    type: "product",
    schema: [
      schema,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "全部货源",
            item: new URL("/products", siteUrl(c.env)).toString(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: new URL(c.req.path, siteUrl(c.env)).toString(),
          },
        ],
      },
    ],
  });
});

app.get("/official-prices", async (c) =>
  html(c, officialPricesPage(await listOfficialPrices(c.env.DB)), {
    title: "AI 官方订阅与 API 价格",
    description:
      "查看 ChatGPT、Claude、Gemini、Grok、Cursor 等官方价格基准、计费方式、额度说明和最后核验日期。",
    path: c.req.path,
  }),
);

app.get("/merchants", async (c) =>
  html(c, merchantsPage(await listMerchants(c.env.DB)), {
    title: "AI 货源商家与渠道",
    description: "按公开报价、来源完整度和更新状态查看 AI 账号与数字服务货源渠道。",
    path: c.req.path,
  }),
);

app.get("/merchants/:slug", async (c) => {
  const merchant = await getMerchant(c.env.DB, c.req.param("slug"));
  if (!merchant)
    return html(
      c,
      notFoundPage(),
      {
        title: "渠道未找到",
        description: "该公开渠道不存在或已隐藏。",
        path: c.req.path,
        noindex: true,
      },
      404,
    );
  const offers = await listOffersForMerchant(c.env.DB, Number(merchant.id));
  return html(c, merchantDetailPage(merchant, offers), {
    title: `${String(merchant.name)}公开货源`,
    description: `${String(merchant.name)}的公开商品、报价、库存、更新时间和原始来源证据。`,
    path: c.req.path,
    schema: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: merchant.name,
      url: merchant.site_url,
    },
  });
});

app.get("/changes", async (c) =>
  html(c, changesPage(await listPriceChanges(c.env.DB)), {
    title: "AI 货源价格与库存异动",
    description: "查看连续快照确认的 AI 账号、订阅、API 和数字服务价格及库存变化。",
    path: c.req.path,
  }),
);

app.get("/opportunities", async (c) => {
  let opportunities = await listOpportunities(c.env.DB);
  if (!opportunities.length) {
    try {
      await syncLatestOpportunity(c.env.DB, c.env.SOURCE_REPO);
      opportunities = await listOpportunities(c.env.DB);
    } catch {
      opportunities = [];
    }
  }
  return html(c, opportunitiesPage(opportunities), {
    title: "AI 账号商机日报",
    description: "把海外 AI 账号、订阅、API、支付、额度与平台政策变化关联到货源、价格和卖家行动。",
    path: c.req.path,
  });
});

app.get("/opportunities/:date", async (c) => {
  const opportunity = await getOpportunity(c.env.DB, c.req.param("date"));
  if (!opportunity)
    return html(
      c,
      notFoundPage(),
      {
        title: "商机日报未找到",
        description: "该日期没有达到发布门槛的账号商机日报。",
        path: c.req.path,
        noindex: true,
      },
      404,
    );
  const products = await getOpportunityProducts(c.env.DB, opportunity.id);
  return html(c, opportunityDetailPage(opportunity, products), {
    title: opportunity.title,
    description: opportunity.description,
    path: c.req.path,
    type: "article",
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opportunity.title,
      description: opportunity.description,
      datePublished: opportunity.published_at,
      dateModified: opportunity.synced_at,
      author: { "@type": "Organization", name: "爱窝啦·AI账号店" },
      mainEntityOfPage: new URL(c.req.path, siteUrl(c.env)).toString(),
    },
  });
});

app.get("/community", async (c) =>
  html(c, communityPage(await listPosts(c.env.DB)), {
    title: "AI 货源社区",
    description: "发布和查看经过审核的 AI 账号货源上新、补货、合作、纠错与经营动态。",
    path: c.req.path,
  }),
);

app.get("/posts/:id", async (c) => {
  const post = await getPost(c.env.DB, Number(c.req.param("id")));
  if (!post)
    return html(
      c,
      notFoundPage(),
      {
        title: "货源帖未找到",
        description: "该帖子不存在或尚未通过审核。",
        path: c.req.path,
        noindex: true,
      },
      404,
    );
  return html(c, postDetailPage(post), {
    title: String(post.title),
    description: String(post.body_markdown)
      .replace(/[#*_`[\]()]/g, " ")
      .slice(0, 150),
    path: c.req.path,
    type: "article",
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      datePublished: post.created_at,
      dateModified: post.updated_at,
      author: { "@type": "Person", name: post.author_name },
    },
  });
});

app.get("/submit", (c) =>
  html(c, submitPage(c.req.query("kind") ?? "merchant"), {
    title: "提交货源、商家、纠错或曝光",
    description: "向爱窝啦 AI 货源雷达提交公开渠道、商品报价、纠错、曝光线索或货源帖。",
    path: c.req.path,
    noindex: true,
  }),
);

app.post("/submit", async (c) => {
  try {
    const input = submissionFromBody((await c.req.parseBody()) as Record<string, string | File>);
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const reporterHash = await stableHash(`${ip}|${new Date().toISOString().slice(0, 13)}`);
    if ((await countRecentSubmissions(c.env.DB, reporterHash)) >= 5)
      return c.text("提交过于频繁，请稍后再试。", 429);
    const id = await createSubmission(c.env.DB, input, reporterHash);
    c.header("Cache-Control", "no-store");
    return html(
      c,
      submitPage(input.kind, id),
      {
        title: "提交成功",
        description: "内容已进入审核队列。",
        path: "/submit/success",
        noindex: true,
      },
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_submission";
    return c.text(`提交内容无效：${message}`, 400);
  }
});

app.get("/methodology", (c) =>
  html(c, methodologyPage(), {
    title: "货源数据方法与更新边界",
    description: "了解标准商品、最低价、历史快照、账号商机同步、商家来源分和失败回退方法。",
    path: c.req.path,
  }),
);

app.get("/api/v1/products", async (c) =>
  c.json({
    data: await listProducts(c.env.DB, {
      q: c.req.query("q"),
      platform: c.req.query("platform"),
      type: c.req.query("type"),
      inStock: parseBoolean(c.req.query("in_stock")),
    }),
  }),
);
app.get("/api/v1/products/:slug", async (c) => {
  const product = await getProduct(c.env.DB, c.req.param("slug"));
  if (!product) return c.json({ error: "not_found" }, 404);
  return c.json({ data: { ...product, offers: await listOffersForProduct(c.env.DB, product.id) } });
});
app.get("/api/v1/products/:slug/offers", async (c) => {
  const product = await getProduct(c.env.DB, c.req.param("slug"));
  return product
    ? c.json({ data: await listOffersForProduct(c.env.DB, product.id) })
    : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/products/:slug/history", async (c) => {
  const product = await getProduct(c.env.DB, c.req.param("slug"));
  return product
    ? c.json({ data: await listOfferHistoryForProduct(c.env.DB, product.id) })
    : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/merchants", async (c) => c.json({ data: await listMerchants(c.env.DB) }));
app.get("/api/v1/merchants/:slug", async (c) => {
  const merchant = await getMerchant(c.env.DB, c.req.param("slug"));
  return merchant
    ? c.json({
        data: { ...merchant, offers: await listOffersForMerchant(c.env.DB, Number(merchant.id)) },
      })
    : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/changes", async (c) => c.json({ data: await listPriceChanges(c.env.DB) }));
app.get("/api/v1/opportunities", async (c) => c.json({ data: await listOpportunities(c.env.DB) }));
app.get("/api/v1/opportunities/:date", async (c) => {
  const result = await getOpportunity(c.env.DB, c.req.param("date"));
  return result ? c.json({ data: result }) : c.json({ error: "not_found" }, 404);
});
app.get("/api/v1/health", async (c) => {
  c.header("Cache-Control", "no-store");
  return c.json(await healthSnapshot(c.env.DB));
});
app.post("/api/v1/submissions", async (c) => {
  try {
    const input = submissionFromBody((await c.req.json()) as Record<string, string | File>);
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const reporterHash = await stableHash(`${ip}|${new Date().toISOString().slice(0, 13)}`);
    if ((await countRecentSubmissions(c.env.DB, reporterHash)) >= 5)
      return c.json({ error: "rate_limited" }, 429);
    const id = await createSubmission(c.env.DB, input, reporterHash);
    return c.json({ success: true, id, status: "pending" }, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_submission" }, 400);
  }
});

app.post("/api/v1/admin/sync/opportunities", async (c) => {
  if (!(await isAdminAuthorized(c.req.header("Authorization"), c.env.ADMIN_API_KEY)))
    return c.json({ error: "unauthorized" }, 401);
  return c.json(await syncLatestOpportunity(c.env.DB, c.env.SOURCE_REPO, c.req.query("date")));
});
app.post("/api/v1/admin/sync/aivora", async (c) => {
  if (!(await isAdminAuthorized(c.req.header("Authorization"), c.env.ADMIN_API_KEY)))
    return c.json({ error: "unauthorized" }, 401);
  return c.json(await syncAivoraCatalog(c.env.DB));
});
app.post("/api/v1/admin/sync/feeds", async (c) => {
  if (!(await isAdminAuthorized(c.req.header("Authorization"), c.env.ADMIN_API_KEY)))
    return c.json({ error: "unauthorized" }, 401);
  return c.json(await syncMerchantFeeds(c.env.DB));
});
app.post("/api/v1/admin/submissions/:id/:action", async (c) => {
  if (!(await isAdminAuthorized(c.req.header("Authorization"), c.env.ADMIN_API_KEY)))
    return c.json({ error: "unauthorized" }, 401);
  const action = c.req.param("action");
  if (action !== "approve" && action !== "reject") return c.json({ error: "invalid_action" }, 400);
  const id = Number(c.req.param("id"));
  const body = (await c.req.json().catch(() => ({}))) as { note?: string };
  const success = await moderateSubmission(c.env.DB, id, action, body.note?.slice(0, 500) ?? "");
  return success ? c.json({ success: true }) : c.json({ error: "not_found" }, 404);
});

app.get("/robots.txt", (c) =>
  c.text(
    `User-agent: *\nAllow: /\nDisallow: /api/v1/admin/\nDisallow: /submit\nSitemap: ${siteUrl(c.env)}/sitemap.xml\n`,
    200,
    { "Content-Type": "text/plain; charset=utf-8" },
  ),
);
app.get("/sitemap.xml", async (c) => {
  const [products, opportunities, merchants, posts] = await Promise.all([
    listProducts(c.env.DB),
    listOpportunities(c.env.DB, 100),
    listMerchants(c.env.DB),
    listPosts(c.env.DB, 100),
  ]);
  const paths = [
    "/",
    "/products",
    "/official-prices",
    "/changes",
    "/opportunities",
    "/merchants",
    "/community",
    "/methodology",
    ...products.map((product) => `/products/${product.slug}`),
    ...opportunities.map((item) => `/opportunities/${item.report_date}`),
    ...merchants.map((merchant) => `/merchants/${String(merchant.slug)}`),
    ...posts.map((post) => `/posts/${String(post.id)}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, siteUrl(c.env)).toString()}</loc></url>`).join("")}</urlset>`;
  return c.body(xml, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
});

app.notFound((c) =>
  html(
    c,
    notFoundPage(),
    { title: "页面未找到", description: "请求的页面不存在。", path: c.req.path, noindex: true },
    404,
  ),
);
app.onError((error, c) => {
  console.error("request_failed", {
    path: c.req.path,
    type: error.name,
    message: error.message.slice(0, 120),
  });
  if (c.req.path.startsWith("/api/")) return c.json({ error: "internal_error" }, 500);
  return html(
    c,
    '<section class="section"><div class="shell"><div class="panel empty"><h1>暂时无法加载</h1><p>系统保留了上次成功数据，请稍后重试。</p><a class="button" href="/">返回首页</a></div></div></section>',
    {
      title: "暂时无法加载",
      description: "系统暂时无法处理请求。",
      path: c.req.path,
      noindex: true,
    },
    500,
  );
});

async function scheduledRun(env: Env): Promise<void> {
  await ensureSeed(env.DB);
  const tasks = [
    syncLatestOpportunity(env.DB, env.SOURCE_REPO),
    syncAivoraCatalog(env.DB),
    syncMerchantFeeds(env.DB),
  ];
  await Promise.allSettled(tasks);
}

export default {
  fetch: app.fetch,
  scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(scheduledRun(env));
  },
};

export { app, scheduledRun, submissionFromBody };
