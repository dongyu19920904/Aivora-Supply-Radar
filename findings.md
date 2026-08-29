# 爱窝啦 AI 货源雷达调研记录

## Requirements

- 在 `D:\GitHub` 保存详细部署实现方案。
- 按方案自主实现、测试、提交、SSH 推送、自动部署和线上验证。
- 保留全部目标功能和商品分类，不因竞争或实现难度删减。
- 综合 PriceAI、OpenPrice、AIDeal、withAI 的优点。
- 将现有账号商机日报作为新站核心栏目，同时保持 AI 日报最高稳定优先级。
- 不引入 Docker、n8n、Activepieces、Flowise。
- 所有构建和测试缓存留在 D 盘。

## Research Findings

- 2026-08-30 已创建独立 Supabase PostgreSQL 17 新加坡项目并应用 11 个 migration；匿名产品读取和目录聚合 RPC 均为 HTTP 200。
- V1 可验证基线为 48 商品、24 报价、1 商家；已幂等迁入 V2，保留 `source:legacy-v1` 标签。
- PriceAI 公开接口 `/api/explorer` 当前提供 45 个标准目录，详情接口 `/api/products/{slug}/offers` 支持分页；排除混合非 AI catch-all 后，首次抓取 44 类、5,463 条原始报价。
- PriceAI 数据按同商家+同商品名合并为 5,352 条，覆盖 378 来源；36 条缺身份、20 条非 HTTPS 共 56 条被拒绝，没有放宽单条校验。
- V2 数据审计为 13 平台、71 商品、379 来源、5,376 报价；5,352 来自 PriceAI、24 来自 V1，0 非 HTTPS、0 孤儿、0 重复唯一键。
- 既有 Cloudflare Token 可部署 Worker，但 R2 列表接口返回 403；首次预览在上传前停止。纯 dummy incremental cache 会让预渲染页面在线返回 404，因此预览改用 OpenNext 官方 static-assets incremental cache（只读 SSG/ISR 快照 + 动态实时 API）和独立 Wrangler 配置，保留生产 R2 配置不变。
- 最大商品 `chatgpt-plus` 有 1,088 条报价，证明原始单页默认 1,000 行会静默截断；详情页已改为首屏 50 条 SSR + 服务端搜索/价格筛选 + 分页加载。
- 真实数据 `next build` 只生成 21 个静态页面，商品/渠道详情按需渲染；可选账号商机/异动源超时只产生 warning 和 200 空态，不阻塞货源主体。
- 生产模式视觉矩阵 9/9 publishable，覆盖桌面/390px、日/夜、真实全量列表、1,088 条商品详情，无溢出、坏图和控制台错误。
- 前端原目录 `D:\GitHub\Hextra-AI-Insight-Daily`：`main` 比 `origin/main` 落后 1122 个提交，并有 3 组用户改动。
- 后端原目录 `D:\GitHub\CloudFlare-AI-Insight-Daily`：`main` 比 `origin/main` 超前 1、落后 117，并有 12 个修改文件。
- `ai-news-radar` 使用 `master`/`origin/master`，本地落后 255 个提交；其 AGENTS.md 要求优先公共 RSS/Atom/OPML、保持简单视图、禁止提交私有 feed 和秘密。
- PriceAI 线上当前展示 45 个标准商品、最低价、质保价、库存、渠道和分钟级更新时间。
- OpenPrice 仓库可访问；项目所有者已确认取得代码商业授权，V2 可移植其全部授权模块。授权源码基线核对为 `387d6b2b5a7ab0a42acc42da2117c9fd0cf290bf`。
- AIDeal 线上提供报价筛选、异动、有货、镜像导航、曝光和渠道提交，本轮未发现可验证公开源码。
- withAI 由 Flarum 驱动；Flarum 核心为 MIT，可独立部署，但目标站主题、内容和数据库不可视为 Flarum 源码。
- `BeterXie/ai_price_radar` 为 MIT，包含分类、同款指纹、历史、来源健康、提交、审核、SEO 和公开 API；原架构含 Docker/Python/PostgreSQL，需要移植而非原样部署。
- `limitcool/plantrack` 为 MIT，Next.js 16，包含 Cloudflare OpenNext 配置、官方价格比较、历史、中英文和日夜主题。
- Cloudflare 2026 年官方文档推荐新 Next.js Worker 项目使用 vinext；OpenNext 适合维护已有项目。
- 账号商机 Markdown 真源确认存在于前端 `origin/main`；最新核验样本为 `2026-08-27.md`，包含 frontmatter、章节、证据链接和结构化 `opportunity-replay` 注释。
- 账号商机工作流严格按 `Asia/Shanghai` 计算日期，并在无合格信号时允许质量跳过，因此新站需要“最近成功一期”回退，不能把缺日当系统故障。
- 当前 GitHub CLI 已登录 `dongyu19920904`，具有 `repo` 与 `workflow` 权限；Git 协议默认 HTTPS，但新仓库推送将显式使用 SSH。
- 本机没有进程级 Cloudflare Token，Wrangler OAuth 已失效；既有后端仓库 Actions 中存在 Cloudflare Account ID/API Token Secret 名称，可作为隔离部署代理。
- `supply.aivora.cn` 当前没有 DNS 记录；`aivora.cn` 权威 NS 为 DNSPod，因此不是现有 Cloudflare 账户中的可绑定 Zone。
- 已把四个参考仓库浅克隆到 `D:\GitHub\_references\Aivora-Supply-Radar`：PlanTrack、AI Price Radar、OpenPrice、Flarum Framework。参考目录继续保持只读隔离；OpenPrice 授权版将从固定提交导入 V2 worktree，不直接在参考副本开发。
- OpenPrice 当前源码包含 Next.js/OpenNext 前台、Supabase schema、商品/报价/渠道/官方价、完整管理后台、投稿反馈和 App Store 价格任务；当前公开 `scraper` 只有 4 个 Python 文件，不含完整的多发卡系统采集引擎。
- OpenPrice 当前公开报价接口存在全量读取路径，不能在 10,000-30,000 条数据规模下原样上线；V2 需要先改为服务端游标分页、聚合读模型和精确缓存失效。
- 原 `/api/offers/all` 会循环下载数据库全部报价再一次性发给浏览器；原商品目录也会循环读取全部报价后逐类过滤，两个路径都会随报价量线性放大。
- V2 已把公开报价改为 `status + updated_at + id` 稳定游标，单页硬上限 100；搜索、排除词、平台和类目在服务端处理，不再把几万条数据交给浏览器过滤。
- V2 已增加 `market_offers` 游标/类目聚合索引和 trigram 搜索索引，并用 `get_product_catalog_summary()` 在 PostgreSQL 聚合最低价、最高价、渠道数和更新时间。
- V2 Supabase URL、项目引用和数据库/应用密钥已分别写入当前仓库及既有部署代理仓库的 GitHub Variables/Secrets；值未输出、未写入 Git，Cloudflare 凭据仍只由既有部署代理使用。
- 商业授权解决了代码移植限制，但代码授权是否同时包含私有采集器、渠道目标配置和生产数据仍需在 Phase 0 资产清单中逐项记录。
- AI Price Radar 的 MIT seed 与目录服务验证了可移植规则：标准商品与原始报价分离、只对可比较且有货的正价格计算最低价、按交付形态和币种计算中位数、来源失败保留最近快照、同款使用稳定指纹分组。
- PlanTrack 的 MIT `data/platforms.json` 是版本化官方价格目录，包含官方 URL、价格、币种、计费口径、核验日期和历史；首发只移植与爱窝啦商品直接相关且能复核官方入口的条目，完整上游代码保存在参考目录。
- 正式部署与线上视觉审计已通过；首发 URL 为 `https://aivora-supply-radar.sabrinamisan090.workers.dev/`，当前健康数据为 48 商品、24 报价、最近账号商机 2026-08-28。

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| 新仓库名 `Aivora-Supply-Radar` | 与 AI 日报解耦，名称直接表达品牌和用途 |
| 目标域名 `supply.aivora.cn` | 与 `news.aivora.cn`、`www.aivora.cn` 构成清晰站群 |
| V1 使用 TypeScript + Cloudflare Worker + SQLite Durable Object | 作为现有生产和 V2 回滚基线保留 |
| V2 使用 OpenNext Worker + Supabase PostgreSQL + Queue/R2 collector | 最大化复用已授权前台/后台并支持数万报价、服务端分页和独立采集 |
| 前端采用 Workers 兼容 React/Next 路径 | 便于复用 PlanTrack 组件并保持 SEO/SSR/结构化数据 |
| 核心实体统一为 Product/Offer/Merchant/Snapshot/Opportunity/Report/Post | 防止把多个参考项目的数据库和分类机械拼接 |
| Flarum 作为独立可插拔社区 | 保留完整社区能力，同时不把 PHP 运行时塞入 Worker 核心链路 |
| Worker 原生 SSR + SQLite Durable Object 作为首发运行时 | 保留完整关系查询、事务、历史价和投稿能力；随 Worker 脚本部署，不依赖现有 Token 缺失的 D1 API scope |
| 账号商机同步向前回看 14 天 | 现有工作流允许质量跳过，最近成功一期比空白或误触发生成更稳定 |
| 标准商品与报价分表，原始标题永久保留 | 继承 MIT 项目中已经验证的目录边界，既能聚合又不丢货源细节 |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| 原日报仓库严重分叉且 dirty | 本任务原则上不在原目录写入；如必须修改则从最新远端建立独立 worktree |
| PriceAI 搜索索引仓库当前不可访问 | 不以不可验证代码为底座 |
| OpenPrice 公开许可原本限制商业竞品化 | 项目所有者已确认取得商业授权；V2 固定授权版本并保存私密授权证据，不再以公开许可作为功能限制 |
| 本机 Wrangler 未登录 | 使用既有后端仓库 Secrets 执行只负责新站的部署代理工作流 |
| 既有 Cloudflare Token 调用 D1 返回 code 10000 | 不申请或输出新 Token；按官方新项目路径改为 SQLite Durable Object，首次失败未创建资源或触发采集 |
| `aivora.cn` 由 DNSPod 托管，Workers Custom Domain 无法绑定 | 首发使用 workers.dev；正式子域采用 Pages 外部 CNAME，需先在 Pages 关联域名再由 DNSPod 增加记录 |
| Cloudflare 免费账户已有 5 个 Cron 触发器 | 新站定时同步由 GitHub Actions 调用受保护接口，保持 6 小时频率且不影响 AI 日报现有触发器 |
| Supabase CLI 2.116.0 Windows 包未发布 | 固定可用的 2.75.0 CLI，并从配置中移除该版本不支持的 pgdelta 实验块 |
| Windows PowerShell 5.1 直接返回 JSON 数组会聚合属性 | 先赋值再返回/枚举，避免把两个项目 ref 与状态拼在一起 |
| PriceAI offset 分页遇到实时排序漂移 | 每页重叠 20 条按 ID 去重；大目录最多允许 0.2% 瞬时缺口，小目录仍要求 100% |
| Node 强制 `Connection: close` 导致连接超时 | 单并发复用连接，并使用 D 盘逐目录检查点；成功验收后逐文件清理 |

## Resources

- https://priceai.cc/channels
- https://closeman.asia/
- https://withai.homes/
- https://github.com/bytedoger/awesome-OpenPrice
- https://github.com/BeterXie/ai_price_radar
- https://github.com/limitcool/plantrack
- https://github.com/flarum/framework
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- `D:\GitHub\CloudFlare-AI-Insight-Daily`
- `D:\GitHub\Hextra-AI-Insight-Daily`
- `D:\GitHub\ai-news-radar`
- `D:\GitHub\Aivora-Supply-Radar\DEPLOYMENT_IMPLEMENTATION_PLAN.md`
- `D:\GitHub\_references\Aivora-Supply-Radar\plantrack`
- `D:\GitHub\_references\Aivora-Supply-Radar\ai_price_radar`
- `D:\GitHub\_references\Aivora-Supply-Radar\awesome-OpenPrice`
- `D:\GitHub\_references\Aivora-Supply-Radar\flarum-framework`

## Visual/Browser Findings

- PriceAI 以标准商品卡片和明细表同时展示全量目录，移动端信息密度高但仍可筛选。
- AIDeal 把比价、镜像导航和曝光放在同页，适合快速查价，但缺少卖家利润和商机闭环。
- withAI 的货源帖子和日报帖子混在社区时间流中，互动性强但结构化检索和价格历史不足。
- 新站应使用结构化目录承接搜索和成交，用社区承接供需与反馈，用账号商机解释为什么现在值得卖。
