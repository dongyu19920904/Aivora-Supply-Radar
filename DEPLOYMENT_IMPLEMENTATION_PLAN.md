# 爱窝啦 AI 货源雷达：部署与实施方案

版本：1.0

基线日期：2026-08-29（Asia/Shanghai）

项目目录：`D:\GitHub\Aivora-Supply-Radar`

目标域名：`https://supply.aivora.cn/`

## 1. 项目目标

建设一个面向 AI 账号买家、卖家和货源商的独立站，完整承载：

- 全品类货源目录、搜索和多条件筛选；
- 标准商品、原始商品、最低价、质保价、库存、渠道数和历史价格；
- 官方订阅/API 价格基准与卡网报价对比；
- 商家入驻、公开 Feed、报价提交、纠错、曝光和审核；
- 今日异动、补货/缺货、价格波动、利润计算和关注预警；
- 爱窝啦现有“AI 账号商机日报”及其与商品、价格、渠道的关联；
- 货源帖、商家动态、回复/纠错等社区能力；
- 日夜主题、约 390px 移动端、SEO、GEO、canonical、schema、sitemap 和 robots。

项目不删除目标网站已有的商品类型或主要功能，但按稳定依赖顺序分批上线。任何可选模块失败时，核心货源目录、比价页和既有 AI 日报必须继续可用。

## 2. 现状与不可破坏边界

### 2.1 现有日报真源

- 后端：`D:\GitHub\CloudFlare-AI-Insight-Daily`
- 前端：`D:\GitHub\Hextra-AI-Insight-Daily`
- 账号商机内容真源：`content/cn/account-opportunity/YYYY-MM/YYYY-MM-DD.md`
- 账号商机栏目首页：`content/cn/account-opportunity/_index.md`
- 生成工作流：`.github/workflows/ensure-daily-account-opportunity.yml`
- Worker：`cloudflare-ai-lnsight-daily.sabrinamisan090.workers.dev`

原仓库当前严重分叉并含用户改动。本项目不在原目录直接开发；如需要增加部署代理或稳定数据出口，必须从最新 `origin/main` 建立独立 worktree，只提交任务文件。

### 2.2 稳定边界

1. 新站使用独立 Worker、数据库、域名和代码仓库。
2. 新站只读同步账号商机 Markdown；同步失败显示最近成功一期，不回调生产生成入口。
3. 货源采集、社区、图片、曝光或提醒失败不影响核心目录，也不影响 AI 日报。
4. 生产定时采集使用锁、幂等快照和上次成功数据；不因单一来源失败清空报价。
5. 所有日期按 `Asia/Shanghai` 计算，并在数据库中同时保留 UTC 时间戳。

## 3. 源码复用策略

### 3.1 可直接复用

- `limitcool/plantrack`：MIT。借鉴官方价格表、变更时间线、日夜主题和高密度比较界面。
- `BeterXie/ai_price_radar`：MIT。移植标准商品、同款指纹、报价历史、来源健康、提交审核和公开 API 设计。
- `flarum/framework`：MIT。作为未来独立社区实现；首发 Worker 内置投稿/回复模型与 Flarum 适配接口。
- `dongyu19920904/ai-news-radar`：用户自有。只复用公开信息源和来源健康思路，不复制私有 feed。

所有直接复用的代码必须保留许可证和归属，集中记录在 `THIRD_PARTY_NOTICES.md`。

### 3.2 不直接合入

- OpenPrice：自定义许可证禁止未经书面授权运营同类商业比价/聚合服务。
- PriceAI：本轮发现的代码仓库当前不可访问，无法验证当前许可证和完整性。
- AIDeal：未发现可验证公开源码，浏览器构建产物不等于源代码。
- withAI：只复用 Flarum 上游，不复制其主题、扩展配置、帖子或数据库。

这些网站的公开功能可作为产品需求和交互参考，使用爱窝啦自己的数据模型与实现。

## 4. 技术架构

### 4.1 运行组件

```text
浏览器 / 搜索引擎
        │
        ▼
Cloudflare Worker（SSR HTML + JSON API + 静态资源）
        │
        ├── SQLite Durable Object：商品、报价、商家、快照、商机、投稿、审核
        ├── Cache API：目录页、详情页和远端只读内容缓存
        ├── Cron：账号商机同步、Feed 拉取、快照、来源健康
        └── 可选 Queue/R2：大规模采集与图片证据（后续启用）

独立账号商机同步器 ──只读──► GitHub raw/origin-main Markdown
商家公开 Feed/页面 ──适配器──► 标准化 Offer
官方价格数据 ────────版本化──► OfficialPrice
社区适配器 ──────────可选───► Flarum API
```

### 4.2 为什么采用 Worker 原生 SSR

- 不引入 Docker、常驻服务器或额外流程编排平台；
- 与用户现有 Cloudflare 运维方式一致；
- SSR 可以为商品详情提供稳定 canonical、Product/Offer/Article schema；
- SQLite Durable Object 提供关系查询、事务和强一致性，且随 Worker 脚本迁移创建；
- 采集和展示可在同一 TypeScript 代码库内共享分类与校验逻辑；
- 避免新站依赖 Next/OpenNext 适配器变化，同时保留未来迁移 React/Vinext 的空间。

### 4.3 仓库结构

```text
Aivora-Supply-Radar/
├─ src/
│  ├─ index.ts                 Worker 入口、路由和错误边界
│  ├─ domain/                  商品、报价、商家、商机模型
│  ├─ services/                查询、利润、异动、来源健康
│  ├─ ingest/                  Feed、HTML、账号商机适配器
│  ├─ security/                管理鉴权、限流、URL 安全
│  ├─ ui/                      SSR 页面、CSS 和渐进增强 JS
│  └─ services/storage-schema.ts  SQLite 初始化结构与版本
├─ scripts/                    dry-run、内容和视觉检查
├─ tests/                      单元与数据契约测试
├─ .github/workflows/          CI
├─ wrangler.jsonc
└─ THIRD_PARTY_NOTICES.md
```

## 5. 统一数据模型

### 5.1 核心表

- `products`：标准商品；平台、类型、交付形态、别名、slug、显示状态。
- `merchants`：商家；名称、站点、Feed、状态、来源类型、最后成功时间。
- `offers`：当前报价；原始标题、价格、币种、库存、质保、来源 URL、抓取时间。
- `offer_snapshots`：历史报价；只在价格、库存或状态变化时追加。
- `official_prices`：官方订阅/API 基准；地区、周期、额度、来源、核验时间。
- `source_runs`：每次采集的数量、耗时、状态和错误摘要。
- `opportunities`：账号商机；日期、标题、摘要、正文、原始页面、关联商品。
- `submissions`：商家入驻、商品、纠错、曝光和社区帖子统一审核队列。
- `posts` / `replies`：首发轻量社区数据；后续可同步到 Flarum。
- `settings`：最近成功同步日期、功能开关和公开站点配置。

### 5.2 关键约束

- 报价唯一键：`merchant_id + source_offer_id`；没有稳定 ID 时使用规范化 URL/标题指纹。
- 历史快照只在可比较字段变化时创建，重复采集不重复写入。
- 最低价只从 `active + approved + in_stock + price > 0` 报价计算。
- 原始标题和来源 URL 永久保留，标准分类不会覆盖原始信息。
- 来源失败时保留上次成功快照并标记过期，不将旧数据误报为实时。
- 商品与机会采用多对多关联，允许一条商机影响多个 SKU。

## 6. 页面和 API

### 6.1 页面

- `/`：今日行情、异动、核心商品、最新账号商机和卖家动作。
- `/products`：全部商品、搜索、平台/类型/交付/价格/库存筛选。
- `/products/:slug`：报价矩阵、历史、官方价、利润、关联商机和商家动态。
- `/official-prices`：官方订阅与 API 基准。
- `/merchants`、`/merchants/:slug`：商家目录、来源健康和在售商品。
- `/changes`：今日/7天价格、库存和渠道异动。
- `/opportunities`、`/opportunities/:date`：账号商机日报。
- `/community`、`/posts/:id`：货源帖和反馈。
- `/submit`：商家、Feed、报价、纠错、曝光、帖子的统一提交页。
- `/methodology`：分类、更新时间、最低价和可信度方法。

### 6.2 公开 API

- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/products/:slug/offers`
- `GET /api/v1/products/:slug/history`
- `GET /api/v1/merchants`
- `GET /api/v1/merchants/:slug`
- `GET /api/v1/changes`
- `GET /api/v1/opportunities`
- `GET /api/v1/opportunities/:date`
- `GET /api/v1/health`
- `POST /api/v1/submissions`

### 6.3 管理 API

- `POST /api/v1/admin/sync/opportunities`
- `POST /api/v1/admin/sync/feeds`
- `POST /api/v1/admin/submissions/:id/approve`
- `POST /api/v1/admin/submissions/:id/reject`

管理接口使用 Cloudflare Secret `ADMIN_API_KEY`，不写入代码、日志或客户端。

## 7. 采集与账号商机同步

### 7.1 商家数据

优先级：

1. 商家主动提交的 HTTPS JSON Feed/JSON-LD；
2. 公开商品页中的结构化数据；
3. 服务器可直接获取的静态 HTML；
4. 需要浏览器执行的来源进入待接入队列，不阻塞发布。

每个适配器必须实现：`discover → fetch → parse → normalize → validate → snapshot`，并限制单次条数、响应大小、超时、重试和每主机频率。

### 7.2 账号商机

1. 按上海日期计算目标日期。
2. 从 GitHub raw 路径读取当天 Markdown；不存在则向前查找最近 14 天。
3. 解析 frontmatter、章节、证据链接和 replay 注释。
4. 通过实体名、平台和商品别名关联 SKU。
5. 在事务中写入 `opportunities` 和关联表。
6. 同步失败时保留最近成功一期，并在健康接口报告 `stale`。
7. 绝不调用生产生成或 repair 接口。

## 8. 安全与失败隔离

- 远端 URL 只允许 `https`，阻止 localhost、私网、链路本地和重定向到私网，防止 SSRF。
- Feed 响应限制体积、Content-Type 和超时；不执行远端脚本。
- 投稿正文长度、链接数量和速率受限；默认 `pending`，不直接公开。
- 管理接口只接受 `Authorization: Bearer`，使用恒定时间比较。
- CSP、HSTS、nosniff、Referrer-Policy、Permissions-Policy 和 frame 限制统一设置。
- 用户输入在服务端 HTML 转义；Markdown 只允许受控子集。
- 定时任务逐模块 `try/catch`；账号商机、Feed、历史快照分别记录结果。
- 生产日志只包含计数、来源域名、耗时和错误类别，不记录密钥或敏感内容。

## 9. SEO/GEO 与品牌

- 统一品牌：`爱窝啦·AI账号店`。
- 主站：`https://www.aivora.cn/`；普通页面 0–1 个主站链接。
- 每个公开页有 canonical、title、description、OG、发布日期和更新时间。
- 商品详情输出 Product + AggregateOffer；商机输出 Article；层级输出 BreadcrumbList。
- 动态 `/sitemap.xml` 只包含可见商品、商家、商机和方法页。
- `/robots.txt` 允许公开内容，禁止管理 API 和内部 dry-run 路径。
- 不在页面加入隐藏 LLM 指令、关键词堆砌或虚构评价。

## 10. 测试策略

### 10.1 单元和契约测试

- 商品别名分类与错误分类回归；
- 同款指纹和商家内去重；
- 最低价、质保价和利润计算；
- 上海日期、UTC 跨日和月目录；
- Markdown/frontmatter 账号商机解析；
- 来源失败保留 last-good；
- SSRF、HTML 转义、管理鉴权和投稿限流；
- JSON API 契约和状态码。

### 10.2 构建和 dry-run

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run dry-run:seed`
- `npm run dry-run:opportunity -- --date YYYY-MM-DD`
- `npm run check:content`

所有命令通过 `Invoke-WithProjectCache.ps1`，临时目录由包装器清理。

### 10.3 浏览器和线上验证

- 桌面 1440px 与移动 390px；
- 日间与夜间；
- 首页、目录、详情、商机、提交和错误页；
- 无横向溢出、字体跳变、断图和空白关键区域；
- canonical、schema、sitemap、robots 和缓存头；
- 关键外链状态与内容类型；
- `/api/v1/health` 的数据库、商机和采集状态。

## 11. GitHub 与 Cloudflare 发布

### 11.1 GitHub

1. 在本地初始化 `main`，开发分支使用 `codex/initial-supply-radar`。
2. 创建私有或公开仓库 `dongyu19920904/Aivora-Supply-Radar`；首发默认公开，便于站点和源码审计。
3. origin 使用 SSH：`git@github.com:dongyu19920904/Aivora-Supply-Radar.git`。
4. CI 在 PR/push 运行 lint、类型、测试、构建和内容检查。
5. 只提交源码、迁移、种子和文档；不提交 `.dev.vars`、密钥、数据库或抓取缓存。

### 11.2 Cloudflare 资源

- Worker：`aivora-supply-radar`
- SQLite Durable Object：`SupplyRadarStore`，固定命名实例 `primary`
- 可选 R2：`aivora-supply-radar-assets`
- 可选 Queue：`aivora-supply-radar-ingest`
- Cron：每日多次轻量 Feed 同步；账号商机在日报生成后同步；每天生成清理和健康快照。
- Custom Domain：`supply.aivora.cn`

本机 Wrangler OAuth 当前失效，但既有日报后端仓库保存了 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 两个 Actions Secret。优先方案：

1. 在日报后端最新 `origin/main` 的独立 worktree 增加仅负责部署新仓库固定 SHA 的 `deploy-supply-radar.yml`。
2. 工作流使用后端仓库现有 Secret，checkout 新仓库指定 SHA，生成临时 Wrangler 配置并部署；`new_sqlite_classes` 随 Worker 版本创建 SQLite Durable Object。
3. 部署代理每 15 分钟只读解析新仓库 `main` 的精确 SHA，并以 GitHub Actions 缓存记录已成功发布的 SHA；也支持手动指定 SHA。这样不需要把跨仓库 GitHub Token 写入新项目。
4. 代理在固定 SHA 上重新运行完整测试，设置独立 `ADMIN_API_KEY` Worker Secret，并用单独管理工作流执行投稿审核或手动同步；Secret 不进入源码或日志。
5. 新站稳定后，可把 Cloudflare Secret 迁移到新仓库并删除部署代理。

该代理只承担发布，不参与 AI 日报定时任务和运行时，因此部署失败不会影响日报生产。

## 12. 自动部署步骤

1. CI 通过并生成待部署 SHA。
2. 部署代理从公开仓库 `main` 解析 40 位 SHA，或接收人工指定的不可变 SHA。
3. `npm ci`、lint、类型、测试和构建复跑。
4. 生成只注入 Account ID、不含 Secret 的临时 Wrangler 配置。
5. `wrangler deploy` 创建/升级 Worker 与 SQLite Durable Object，记录版本和部署 URL。
6. 写入独立 `ADMIN_API_KEY` Worker Secret，等待自定义域健康接口就绪。
7. 首发仅调用一次受保护的组合同步；账号商机、单个 Feed 失败按来源隔离，爱窝啦自有商品同步必须成功。
8. 复查 `supply.aivora.cn` 健康、内容和移动端；成功后按 SHA 写部署标记。
9. 线上验证失败则停止并保留失败证据；必要时回滚上一成功 Worker 版本。

## 13. 回滚

- 代码回滚：重新部署上一成功 Git SHA，不使用 `reset --hard`。
- 数据回滚：SQLite schema 只做向前兼容；破坏性变更先建新表、回填、切读，再延迟删除旧表，并使用 Durable Object 时间点恢复作为灾备。
- 内容回滚：报价使用 `last_good_snapshot`，来源异常只标记过期。
- 域名回滚：Custom Domain 可切回上一 Worker 版本。
- 日报无需回滚：新站不修改其生成链路。

## 14. 成本和调用量控制

- SSR 页面使用 Cache API，商品列表和商机页短时缓存，详情按更新时间失效。
- Feed 采用条件请求、按域名节流和变化写入，避免无变化重复快照。
- SQLite 查询使用覆盖索引和分页，首页不扫描完整历史；单实例串行写入避免同一报价并发快照冲突。
- 首发不使用大模型生成；账号商机直接消费现有成品，避免新增 Anthropic 调用。
- 浏览器渲染、R2 图片代理和 Queue 只在数据量证明需要后启用。

## 15. 分阶段验收

### M1：可部署核心站

- 首页、全部商品、详情、商家、异动、商机、提交、方法页可用；
- SQLite Durable Object、schema 初始化、seed、健康接口、sitemap、robots 完成；
- CI、预览、正式 Worker 和域名可验证。

### M2：真实数据和经营闭环

- 至少一个自有/授权 Feed 和官方价格数据稳定同步；
- 账号商机能关联 SKU；
- 利润计算、异动和来源健康可用；
- 商家提交可审核后发布。

### M3：社区和规模化

- 轻量社区上线，或接入独立 Flarum；
- 用户关注和通知；
- 更多来源适配器、Queue/R2 和运营后台。

本轮执行先完成 M1 和 M2 的安全可上线范围，并为 M3 保留已经测试的数据契约和适配接口，不以牺牲 AI 日报稳定性换取一次性功能堆叠。
