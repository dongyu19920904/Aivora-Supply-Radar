import type { OfferPublic, OpportunityRow, ProductSummary } from "../domain/types";
import { escapeHtml, formatDate, formatPrice, renderMarkdown } from "./html";

function productCard(product: ProductSummary): string {
  return `<article class="card product-card">
    <span class="platform">${escapeHtml(product.platform)} · ${escapeHtml(product.product_type)}</span>
    <h3><a href="/products/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h3>
    <p>${escapeHtml(product.subtitle)}</p>
    <div class="price-row"><div><span class="muted">有货最低</span><div class="price">${formatPrice(product.min_price)}</div></div><span class="stock">${product.in_stock_count} 条有货 · ${product.merchant_count} 家</span></div>
  </article>`;
}

export function homePage(data: {
  products: ProductSummary[];
  opportunity: OpportunityRow | null;
  changes: Record<string, unknown>[];
}): string {
  const withOffers = data.products.filter((product) => product.offer_count > 0);
  const platformCount = new Set(data.products.map((product) => product.platform)).size;
  const offerCount = data.products.reduce((sum, product) => sum + Number(product.offer_count), 0);
  return `<section class="hero"><div class="shell">
    <span class="eyebrow">● 公开报价 · 商家货源 · 每日商机</span>
    <h1>从“哪里便宜”到<br><mark>今天卖什么</mark></h1>
    <p>统一查看 AI 账号、订阅、API、邮箱、社媒、支付与辅助服务货源，把价格、库存和爱窝啦账号商机变成每天能执行的经营动作。</p>
    <div class="actions"><a class="button primary" href="/products">查看全部货源</a><a class="button" href="/opportunities">读账号商机日报</a><a class="button" href="/submit">提交渠道</a></div>
  </div></section>
  <div class="shell stats">
    <div class="stat"><strong>${data.products.length}</strong><span>标准商品</span></div>
    <div class="stat"><strong>${offerCount}</strong><span>当前公开报价</span></div>
    <div class="stat"><strong>${platformCount}</strong><span>平台与品类</span></div>
    <div class="stat"><strong>${data.changes.length}</strong><span>已确认异动</span></div>
  </div>
  <section class="section"><div class="shell"><div class="section-head"><div><h2>今天先看什么</h2><p>有真实报价的标准商品优先展示，空目录仍保留等待渠道补充。</p></div><a href="/products">完整目录 →</a></div><div class="grid">${withOffers.slice(0, 9).map(productCard).join("")}</div></div></section>
  <section class="section tight"><div class="shell"><div class="section-head"><div><h2>最新账号商机</h2><p>读取现有日报成品，不新增大模型调用。</p></div><a href="/opportunities">全部日报 →</a></div>${data.opportunity ? `<article class="card signal"><time>${escapeHtml(data.opportunity.report_date)}</time><h3><a href="/opportunities/${escapeHtml(data.opportunity.report_date)}">${escapeHtml(data.opportunity.title)}</a></h3><p>${escapeHtml(data.opportunity.description)}</p><a class="button" href="/opportunities/${escapeHtml(data.opportunity.report_date)}">看今天该做什么</a></article>` : '<div class="card empty">正在等待首次只读同步；核心货源目录不受影响。</div>'}</div></section>`;
}

export function productsPage(data: {
  products: ProductSummary[];
  platforms: string[];
  types: string[];
  filters: Record<string, string | boolean | undefined>;
}): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>全部货源</h1><p>标准商品用于比较，原始商品名和来源链接始终保留。</p></div><span class="pill">${data.products.length} 个结果</span></div>
    <div class="card filter-bar"><form class="filters" method="get"><label>搜索<input name="q" value="${escapeHtml(data.filters.q ?? "")}" placeholder="商品、平台或关键词"></label><label>平台<select name="platform"><option value="">全部平台</option>${data.platforms.map((value) => `<option${data.filters.platform === value ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label><label>类型<select name="type"><option value="">全部类型</option>${data.types.map((value) => `<option${data.filters.type === value ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label><label><span>库存</span><select name="stock"><option value="">全部</option><option value="in"${data.filters.inStock ? " selected" : ""}>仅看有货</option></select></label><button class="button primary" type="submit">筛选</button></form></div>
    ${data.products.length ? `<div class="grid">${data.products.map(productCard).join("")}</div>` : '<div class="card empty">没有符合条件的标准商品。</div>'}
  </div></section>`;
}

export function productDetailPage(
  product: ProductSummary,
  offers: OfferPublic[],
  related: OpportunityRow[],
  history: Record<string, unknown>[],
): string {
  const aggregate = offers.filter(
    (offer) => offer.stock_status === "in_stock" && Number(offer.price) > 0,
  );
  return `<section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">${escapeHtml(product.platform)} · ${escapeHtml(product.product_type)}</span><h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(product.subtitle)}</p></div><div class="price">${formatPrice(product.min_price)}</div></div>
    <div class="detail-grid"><div class="panel"><h2>公开报价</h2><p class="muted">按有货、正价格和更新时间排序。最终价格与售后以来源页为准。</p><div class="offer-list">${offers.length ? offers.map((offer) => `<article class="offer">${offer.image_url ? `<a class="offer-media" href="${escapeHtml(offer.source_url)}" target="_blank" rel="noopener nofollow"><img src="${escapeHtml(offer.image_url)}" alt="${escapeHtml(offer.original_name)}商品图" loading="lazy" width="96" height="96"></a>` : ""}<div><h3>${escapeHtml(offer.original_name)}</h3><p>${escapeHtml(offer.merchant_name)} · 渠道分 ${offer.merchant_score} · ${escapeHtml(offer.delivery_type)} · 更新 ${formatDate(offer.observed_at)}</p><a href="${escapeHtml(offer.source_url)}" target="_blank" rel="noopener nofollow">查看来源证据</a></div><div class="offer-price"><strong>${formatPrice(offer.price, offer.currency)}</strong>${offer.high_price ? `<div class="muted">最高规格 ${formatPrice(offer.high_price, offer.currency)}</div>` : ""}<div class="status${offer.stock_status === "in_stock" ? "" : " stale"}">${offer.stock_status === "in_stock" ? "有货" : escapeHtml(offer.stock_status)}</div></div></article>`).join("") : '<div class="empty">目录已建立，正在等待可核验渠道报价。</div>'}</div></div>
      <aside><div class="panel"><h2>卖家利润试算</h2><div class="calc-grid" data-margin-calculator><label>拿货成本<input type="number" min="0" step="0.01" name="cost" value="${aggregate[0]?.price ?? 0}"></label><label>零售价<input type="number" min="0" step="0.01" name="sell" value="${aggregate[0]?.high_price ?? Math.ceil(Number(aggregate[0]?.price ?? 0) * 1.25)}"></label><label>平台费率 %<input type="number" min="0" max="100" step="0.1" name="fee" value="0"></label><div class="calc-result" data-result></div></div></div>
      <div class="panel stack-panel"><h2>关联商机</h2>${related.length ? related.map((item) => `<p><a href="/opportunities/${item.report_date}">${escapeHtml(item.title)}</a><br><span class="muted">${item.report_date}</span></p>`).join("") : '<p class="muted">暂无直接关联商机。</p>'}</div></aside>
    </div>
    <div class="panel history-panel"><h2>报价快照</h2><p class="muted">首次采集只建立基线；同一报价后续价格或库存变化才新增记录。</p>${history.length ? `<div class="table-wrap"><table><thead><tr><th>观察时间</th><th>商家 / 原始商品</th><th>价格</th><th>库存</th></tr></thead><tbody>${history.map((item) => `<tr><td>${formatDate(item.observed_at)}</td><td><strong>${escapeHtml(item.merchant_name)}</strong>${escapeHtml(item.original_name)}</td><td>${formatPrice(item.price, String(item.currency))}${item.high_price ? ` – ${formatPrice(item.high_price, String(item.currency))}` : ""}</td><td>${escapeHtml(item.stock_status)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">等待首次快照。</div>'}</div>
  </div></section>`;
}

export function merchantsPage(merchants: Record<string, unknown>[]): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>商家与渠道</h1><p>渠道分只反映来源完整度、更新成功率和公开证据，不构成交易担保。</p></div><a class="button primary" href="/submit?kind=merchant">申请收录</a></div><div class="grid">${merchants.map((merchant) => `<article class="card product-card"><span class="platform">来源分 ${escapeHtml(merchant.source_score)}</span><h3><a href="/merchants/${escapeHtml(merchant.slug)}">${escapeHtml(merchant.name)}</a></h3><p>${escapeHtml(merchant.product_count)} 个标准商品 · ${escapeHtml(merchant.in_stock_count)} 条有货 · ${escapeHtml(merchant.offer_count)} 条报价</p><div class="price-row"><span class="status${merchant.status === "healthy" ? "" : " stale"}">${escapeHtml(merchant.status)}</span><a href="${escapeHtml(merchant.site_url)}" target="_blank" rel="noopener nofollow">访问渠道</a></div></article>`).join("")}</div></div></section>`;
}

export function merchantDetailPage(
  merchant: Record<string, unknown>,
  offers: Array<OfferPublic & { product_slug: string; product_name: string }>,
): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">来源分 ${escapeHtml(merchant.source_score)} · ${escapeHtml(merchant.status)}</span><h1>${escapeHtml(merchant.name)}</h1><p>${escapeHtml(merchant.product_count)} 个标准商品 · ${escapeHtml(merchant.in_stock_count)} 条有货 · 最近检查 ${formatDate(merchant.last_checked_at)}</p></div><a class="button" href="${escapeHtml(merchant.site_url)}" target="_blank" rel="noopener nofollow">访问商家原站</a></div><div class="panel"><h2>公开商品</h2><div class="offer-list">${offers.length ? offers.map((offer) => `<article class="offer">${offer.image_url ? `<a class="offer-media" href="${escapeHtml(offer.source_url)}" target="_blank" rel="noopener nofollow"><img src="${escapeHtml(offer.image_url)}" alt="${escapeHtml(offer.original_name)}商品图" loading="lazy" width="96" height="96"></a>` : ""}<div><h3><a href="/products/${escapeHtml(offer.product_slug)}">${escapeHtml(offer.product_name)}</a></h3><p>${escapeHtml(offer.original_name)} · 更新 ${formatDate(offer.observed_at)}</p><a href="${escapeHtml(offer.source_url)}" target="_blank" rel="noopener nofollow">来源证据</a></div><div class="offer-price"><strong>${formatPrice(offer.price, offer.currency)}</strong><div class="status${offer.stock_status === "in_stock" ? "" : " stale"}">${escapeHtml(offer.stock_status)}</div></div></article>`).join("") : '<div class="empty">该渠道暂时没有可公开报价。</div>'}</div></div></div></section>`;
}

export function officialPricesPage(prices: Record<string, unknown>[]): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>官方价格基准</h1><p>官方订阅和渠道商品不是同一种交付，分栏展示避免错误混比。</p></div><span class="pill">显示最后核验日期</span></div><div class="table-wrap"><table><thead><tr><th>平台 / 套餐</th><th>官方价格</th><th>计费</th><th>额度说明</th><th>核验</th><th>来源</th></tr></thead><tbody>${prices.map((price) => `<tr><td><strong>${escapeHtml(price.plan_name)}</strong>${escapeHtml(price.vendor)}</td><td>${formatPrice(price.price, String(price.currency))}</td><td>${escapeHtml(price.billing_period)}</td><td>${escapeHtml(price.quota_text)}</td><td>${escapeHtml(price.last_checked)}</td><td><a href="${escapeHtml(price.official_url)}" target="_blank" rel="noopener">官方页面</a></td></tr>`).join("")}</tbody></table></div></div></section>`;
}

export function changesPage(changes: Record<string, unknown>[]): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>今日异动</h1><p>只有连续快照中确认的价格或库存变化才会进入这里。</p></div></div>${changes.length ? `<div class="table-wrap"><table><thead><tr><th>商品</th><th>商家</th><th>上次</th><th>当前</th><th>库存变化</th><th>时间</th></tr></thead><tbody>${changes.map((change) => `<tr><td><strong><a href="/products/${escapeHtml(change.product_slug)}">${escapeHtml(change.product_name)}</a></strong><a href="${escapeHtml(change.source_url)}" target="_blank" rel="noopener nofollow">原始商品</a></td><td>${escapeHtml(change.merchant_name)}</td><td>${formatPrice(change.previous_price)}</td><td>${formatPrice(change.current_price)}</td><td>${escapeHtml(change.previous_stock)} → ${escapeHtml(change.current_stock)}</td><td>${formatDate(change.observed_at)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="card empty">暂无已确认异动。首次快照不会伪装成涨跌；下一次价格或库存真实变化后自动出现。</div>'}</div></section>`;
}

export function opportunitiesPage(opportunities: OpportunityRow[]): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>AI 账号商机日报</h1><p>核验海外 AI 账号、订阅、API、支付、额度与平台政策变化，并关联到可售商品。</p></div></div><div class="offer-list">${opportunities.length ? opportunities.map((item) => `<article class="card signal"><time>${escapeHtml(item.report_date)}</time><h3><a href="/opportunities/${item.report_date}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></article>`).join("") : '<div class="card empty">还没有同步到合格日报；目录和报价继续正常提供。</div>'}</div></div></section>`;
}

export function opportunityDetailPage(
  opportunity: OpportunityRow,
  products: ProductSummary[],
): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">${escapeHtml(opportunity.report_date)} · 账号商机</span><h1>${escapeHtml(opportunity.title)}</h1><p>${escapeHtml(opportunity.description)}</p></div><a href="${escapeHtml(opportunity.source_url)}" target="_blank" rel="noopener">查看日报原页</a></div><div class="detail-grid"><article class="panel prose">${renderMarkdown(opportunity.body_markdown)}</article><aside><div class="panel"><h2>关联商品</h2>${products.length ? products.map((product) => `<p><a href="/products/${product.slug}">${escapeHtml(product.name)}</a><br><span class="muted">${escapeHtml(product.subtitle)}</span></p>`).join("") : '<p class="muted">本期没有达到自动关联门槛的标准商品。</p>'}</div></aside></div></div></section>`;
}

export function communityPage(posts: Record<string, unknown>[]): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>货源社区</h1><p>商家上新、补货、合作和纠错先审核再公开，避免广告淹没结构化行情。</p></div><a class="button primary" href="/submit?kind=post">发布货源帖</a></div>${posts.length ? `<div class="offer-list">${posts.map((post) => `<article class="card signal"><time>${formatDate(post.created_at)}</time><h3><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></h3><div class="prose">${renderMarkdown(String(post.body_markdown))}</div></article>`).join("")}</div>` : '<div class="card empty">社区入口已开放，第一批货源帖将在审核后显示。</div>'}</div></section>`;
}

export function postDetailPage(post: Record<string, unknown>): string {
  return `<section class="section"><div class="shell"><div class="section-head"><div><span class="eyebrow">审核后公开 · ${formatDate(post.created_at)}</span><h1>${escapeHtml(post.title)}</h1><p>发布者：${escapeHtml(post.author_name)}</p></div>${post.source_url ? `<a href="${escapeHtml(post.source_url)}" target="_blank" rel="ugc noopener nofollow">查看提交来源</a>` : ""}</div><article class="panel prose">${renderMarkdown(String(post.body_markdown))}</article></div></section>`;
}

export function submitPage(kind = "merchant", successId?: number): string {
  if (successId)
    return `<section class="section"><div class="shell"><div class="panel"><span class="eyebrow">已收到</span><h1>提交成功</h1><p>编号 #${successId} 已进入审核队列。审核通过前不会公开。</p><a class="button primary" href="/">返回首页</a></div></div></section>`;
  const options = [
    ["merchant", "商家入驻"],
    ["offer", "商品报价"],
    ["correction", "纠错"],
    ["exposure", "曝光线索"],
    ["post", "货源帖"],
  ];
  return `<section class="section"><div class="shell"><div class="section-head"><div><h1>提交货源与反馈</h1><p>提供公开来源和可核验证据。所有内容默认待审核。</p></div></div><div class="detail-grid"><form class="panel form-grid" method="post" action="/submit"><label>提交类型<select name="kind">${options.map(([value, label]) => `<option value="${value}"${kind === value ? " selected" : ""}>${label}</option>`).join("")}</select></label><label>商家名 / 标题<input name="name" minlength="2" maxlength="100" required></label><label>公开来源 URL<input name="sourceUrl" type="url" placeholder="https://"></label><label>联系方式（仅审核使用）<input name="contact" maxlength="160"></label><label>内容与证据<textarea name="content" minlength="20" maxlength="8000" required></textarea></label><button class="button primary" type="submit">提交审核</button></form><aside class="panel"><h2>接入建议</h2><p>商家优先提供 HTTPS JSON Feed；字段包括商品 ID、原始名称、商品链接、价格、币种、库存、质保和更新时间。</p><div class="notice">不提交卡密、账号密码、访问令牌、订单、支付信息或客户身份数据。</div></aside></div></div></section>`;
}

export function methodologyPage(): string {
  return `<section class="section"><div class="shell prose"><span class="eyebrow">方法与边界</span><h1>我们怎样整理货源</h1><h2>标准商品不覆盖原始商品</h2><p>标准商品用于跨商家搜索和比较；原始标题、来源 URL、观察时间和交付说明始终保留。分类置信度不足的内容进入“其他商品”或待审核，不会硬塞进热门 SKU。</p><h2>最低价怎样计算</h2><p>仅使用已审核、仍在售、有货、价格大于零且可比较的报价。套餐区间显示最低和最高规格，不把区间最低价当作所有规格价格。</p><h2>异动怎样确认</h2><p>首次采集只建立基线，不产生涨跌。相同商品后续快照的价格或库存状态变化，才会进入异动页。</p><h2>账号商机怎样接入</h2><p>只读消费 AI 日报仓库已发布的账号商机 Markdown；当天因质量门槛没有产出时显示最近成功一期，不调用生产生成或修复接口。</p><h2>渠道分是什么</h2><p>渠道分反映来源完整度、更新成功率和公开证据，不是信誉担保。采购或接单前请回到来源页核对交付、退款和售后。</p></div></section>`;
}

export function notFoundPage(): string {
  return `<section class="section"><div class="shell"><div class="panel empty"><h1>页面没有找到</h1><p>商品可能改名、暂时隐藏或链接输入有误。</p><a class="button primary" href="/products">返回全部货源</a></div></div></section>`;
}
