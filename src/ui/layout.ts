import { escapeHtml } from "./html";

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "product";
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

const NAVIGATION = [
  ["/products", "全部货源"],
  ["/official-prices", "官方价格"],
  ["/changes", "今日异动"],
  ["/opportunities/latest", "账号商机日报"],
  ["/merchants", "商家渠道"],
  ["/community", "货源社区"],
  ["/submit", "提交货源"],
];

export function layout(meta: PageMeta, body: string, siteUrl = "https://supply.aivora.cn"): string {
  const canonical = new URL(meta.path, siteUrl).toString();
  const title = meta.title.includes("爱窝啦") ? meta.title : `${meta.title}｜爱窝啦 AI 货源雷达`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "爱窝啦 AI 货源雷达",
      alternateName: "爱窝啦·AI账号店货源与商机",
      url: siteUrl,
      inLanguage: "zh-CN",
      publisher: {
        "@type": "Organization",
        name: "爱窝啦·AI账号店",
        url: "https://www.aivora.cn/",
      },
    },
    ...(Array.isArray(meta.schema) ? meta.schema : meta.schema ? [meta.schema] : []),
  ];
  return `<!doctype html>
<html lang="zh-CN" data-theme="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <meta name="robots" content="${meta.noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="爱窝啦 AI 货源雷达">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:type" content="${meta.type ?? "website"}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f4b400" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css?v=1">
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>
  <script>try{document.documentElement.dataset.theme=localStorage.getItem('aivora-theme')||'auto'}catch(e){}</script>
</head>
<body>
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="爱窝啦 AI 货源雷达首页">
        <span class="brand-mark">A</span>
        <span><strong>爱窝啦</strong><small>AI 货源雷达</small></span>
      </a>
      <nav class="desktop-nav" aria-label="主导航">${NAVIGATION.map(([href, label]) => `<a href="${href}"${meta.path.startsWith(href ?? "") ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="切换日夜模式">◐</button>
    </div>
    <nav class="mobile-nav" aria-label="移动端主导航">${NAVIGATION.slice(0, 6)
      .map(([href, label]) => `<a href="${href}">${label}</a>`)
      .join("")}</nav>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div><strong>爱窝啦 AI 货源雷达</strong><p>把公开货源、价格异动和账号商机连成卖家每天可执行的经营信息。</p></div>
      <div><a href="/methodology">数据方法</a><a href="/api/v1/health">系统状态</a><a href="/sitemap.xml">站点地图</a></div>
      <div><a href="https://www.aivora.cn/" rel="home">爱窝啦·AI账号店</a><span>报价以来源页面当日显示为准</span></div>
    </div>
  </footer>
  <script src="/assets/site.js?v=1" defer></script>
</body>
</html>`;
}

export const SITE_CSS = `
:root{color-scheme:light;--bg:#f7f5ef;--surface:#fffdf8;--surface-2:#f1eee4;--text:#171717;--muted:#69665f;--line:#ded8ca;--brand:#f5b700;--brand-strong:#8a6200;--blue:#006bd6;--green:#137a50;--red:#b7362c;--shadow:0 14px 40px rgba(48,39,21,.08);--radius:18px;font-family:Inter,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif}
html[data-theme="dark"]{color-scheme:dark;--bg:#0f1115;--surface:#171a20;--surface-2:#20242c;--text:#f6f3ea;--muted:#aaa69c;--line:#343945;--brand:#ffd447;--brand-strong:#ffe58a;--blue:#64adff;--green:#5dd39e;--red:#ff8178;--shadow:0 18px 50px rgba(0,0,0,.32)}
@media(prefers-color-scheme:dark){html[data-theme="auto"]{color-scheme:dark;--bg:#0f1115;--surface:#171a20;--surface-2:#20242c;--text:#f6f3ea;--muted:#aaa69c;--line:#343945;--brand:#ffd447;--brand-strong:#ffe58a;--blue:#64adff;--green:#5dd39e;--red:#ff8178;--shadow:0 18px 50px rgba(0,0,0,.32)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);line-height:1.65}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}img{max-width:100%;height:auto}.shell{width:min(1180px,calc(100% - 32px));margin:auto}.skip-link{position:fixed;left:10px;top:-80px;background:var(--brand);color:#111;padding:8px 12px;z-index:100}.skip-link:focus{top:10px}.site-header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}.header-inner{min-height:68px;display:flex;align-items:center;gap:22px}.brand{display:flex;align-items:center;gap:10px;color:var(--text);min-width:max-content}.brand:hover{text-decoration:none}.brand-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:var(--brand);color:#15120a;font-weight:900}.brand span:last-child{display:grid;line-height:1.1}.brand small{font-size:12px;color:var(--muted);margin-top:4px}.desktop-nav{display:flex;gap:6px;flex:1;justify-content:center}.desktop-nav a,.mobile-nav a{color:var(--muted);padding:8px 10px;border-radius:10px;font-size:14px}.desktop-nav a[aria-current="page"],.desktop-nav a:hover{background:var(--surface-2);color:var(--text);text-decoration:none}.theme-toggle{width:38px;height:38px;border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:12px;cursor:pointer}.mobile-nav{display:none;overflow:auto;padding:4px 16px 10px;white-space:nowrap}.hero{padding:72px 0 46px;background:radial-gradient(circle at 75% 20%,color-mix(in srgb,var(--brand) 23%,transparent),transparent 34%)}.eyebrow{display:inline-flex;gap:8px;align-items:center;padding:5px 10px;border:1px solid color-mix(in srgb,var(--brand) 55%,var(--line));border-radius:999px;color:var(--brand-strong);font-weight:700;font-size:13px;background:color-mix(in srgb,var(--brand) 10%,var(--surface))}.hero h1{font-size:clamp(38px,7vw,76px);line-height:1.03;letter-spacing:-.045em;margin:18px 0;max-width:920px}.hero h1 mark{background:none;color:var(--brand-strong)}.hero p{font-size:clamp(17px,2vw,21px);color:var(--muted);max-width:760px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.button{display:inline-flex;justify-content:center;align-items:center;min-height:44px;padding:0 18px;border-radius:12px;border:1px solid var(--line);font-weight:750;color:var(--text);background:var(--surface);cursor:pointer}.button.primary{background:var(--brand);border-color:var(--brand);color:#17120a}.button:hover{text-decoration:none;transform:translateY(-1px)}.section{padding:50px 0}.section.tight{padding:30px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.section-head h1,.section-head h2{margin:0;font-size:clamp(28px,4vw,42px);line-height:1.15}.section-head p{margin:6px 0 0;color:var(--muted)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:-18px;position:relative}.stat,.card,.panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.stat{padding:20px}.stat strong{display:block;font-size:30px;line-height:1.1}.stat span{color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.product-card{padding:20px;display:flex;flex-direction:column;min-height:230px;position:relative;overflow:hidden}.product-card:before{content:"";position:absolute;right:-24px;top:-32px;width:100px;height:100px;border-radius:50%;background:color-mix(in srgb,var(--brand) 20%,transparent)}.product-card .platform,.pill{display:inline-flex;align-items:center;width:max-content;padding:3px 8px;border-radius:999px;background:var(--surface-2);color:var(--muted);font-size:12px}.product-card h3{font-size:20px;line-height:1.25;margin:16px 0 6px}.product-card p{color:var(--muted);margin:0 0 18px}.price-row{margin-top:auto;display:flex;align-items:end;justify-content:space-between;gap:10px}.price{font-weight:900;font-size:22px;color:var(--brand-strong)}.stock{color:var(--green);font-size:13px}.muted{color:var(--muted)}.signal{border-left:5px solid var(--brand);padding:24px}.signal h3{margin-top:0}.signal time{color:var(--muted);font-size:13px}.filter-bar{padding:18px;margin-bottom:18px}.filters{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px}.filters input,.filters select,.form-grid input,.form-grid select,.form-grid textarea{width:100%;min-height:44px;border:1px solid var(--line);border-radius:11px;background:var(--bg);color:var(--text);padding:9px 12px;font:inherit}.filters label,.form-grid label{font-size:12px;color:var(--muted)}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)}table{border-collapse:collapse;width:100%;min-width:820px}th,td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;color:var(--muted);background:var(--surface-2);position:sticky;top:0}td strong{display:block}.status{font-weight:700;color:var(--green)}.status.stale{color:var(--brand-strong)}.detail-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.8fr);gap:20px}.panel{padding:24px}.panel h2:first-child,.panel h3:first-child{margin-top:0}.offer-list{display:grid;gap:12px}.offer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface-2)}.offer h3{margin:0 0 4px;font-size:16px}.offer p{margin:0;color:var(--muted);font-size:13px}.offer-price{text-align:right}.offer-price strong{font-size:20px}.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.calc-result{margin-top:12px;padding:14px;background:var(--surface-2);border-radius:12px}.prose{max-width:820px}.prose h2,.prose h3,.prose h4{line-height:1.25;margin:30px 0 10px}.prose p,.prose li{color:color-mix(in srgb,var(--text) 88%,var(--muted))}.prose code{background:var(--surface-2);padding:2px 5px;border-radius:5px}.prose a{font-weight:650}.form-grid{display:grid;gap:14px}.form-grid textarea{min-height:150px;resize:vertical}.notice{padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--muted)}.empty{padding:42px;text-align:center;color:var(--muted)}.site-footer{margin-top:50px;border-top:1px solid var(--line);padding:36px 0;color:var(--muted)}.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:30px}.footer-grid div{display:flex;flex-direction:column;align-items:flex-start;gap:5px}.footer-grid p{margin:0}.footer-grid a{color:var(--muted)}
@media(max-width:900px){.desktop-nav{display:none}.mobile-nav{display:flex}.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-grid{grid-template-columns:1fr}.filters{grid-template-columns:1fr 1fr}.footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.shell{width:min(100% - 22px,1180px)}.hero{padding:42px 0 34px}.hero h1{font-size:42px}.stats{gap:9px}.stat{padding:15px}.stat strong{font-size:24px}.grid{grid-template-columns:1fr}.section{padding:36px 0}.filters{grid-template-columns:1fr}.section-head{align-items:start;flex-direction:column}.panel{padding:18px}.offer{grid-template-columns:1fr}.offer-price{text-align:left}.footer-grid{grid-template-columns:1fr}.mobile-nav a{padding:7px 9px}.calc-grid{grid-template-columns:1fr}.product-card{min-height:210px}}
.offer{grid-template-columns:auto minmax(0,1fr) auto;gap:14px}.offer-media{width:96px;height:96px;border-radius:12px;overflow:hidden;background:var(--surface);border:1px solid var(--line)}.offer-media img{width:100%;height:100%;object-fit:cover;display:block}.stack-panel,.history-panel{margin-top:16px}.calc-grid label{font-size:12px;color:var(--muted)}.calc-grid input{width:100%;min-height:44px;border:1px solid var(--line);border-radius:11px;background:var(--bg);color:var(--text);padding:9px 12px;font:inherit}.calc-grid .calc-result{grid-column:1/-1}
@media(max-width:600px){.offer{grid-template-columns:72px minmax(0,1fr)}.offer-media{width:72px;height:72px}.offer-price{text-align:left;grid-column:2}}
`;

export const SITE_JS = `
(()=>{const root=document.documentElement;const button=document.querySelector('[data-theme-toggle]');const order=['auto','light','dark'];button?.addEventListener('click',()=>{const current=root.dataset.theme||'auto';const next=order[(order.indexOf(current)+1)%order.length];root.dataset.theme=next;try{localStorage.setItem('aivora-theme',next)}catch(e){}});document.querySelectorAll('[data-margin-calculator]').forEach((box)=>{const update=()=>{const cost=Number(box.querySelector('[name=cost]')?.value||0);const sell=Number(box.querySelector('[name=sell]')?.value||0);const fee=Number(box.querySelector('[name=fee]')?.value||0)/100;const profit=sell-cost-sell*fee;const margin=sell>0?profit/sell*100:0;const out=box.querySelector('[data-result]');if(out)out.textContent='预计毛利 ¥'+profit.toFixed(2)+' · 毛利率 '+margin.toFixed(1)+'%'};box.addEventListener('input',update);update()});})();
`;
