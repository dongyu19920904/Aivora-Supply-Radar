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

- 前端原目录 `D:\GitHub\Hextra-AI-Insight-Daily`：`main` 比 `origin/main` 落后 1122 个提交，并有 3 组用户改动。
- 后端原目录 `D:\GitHub\CloudFlare-AI-Insight-Daily`：`main` 比 `origin/main` 超前 1、落后 117，并有 12 个修改文件。
- `ai-news-radar` 使用 `master`/`origin/master`，本地落后 255 个提交；其 AGENTS.md 要求优先公共 RSS/Atom/OPML、保持简单视图、禁止提交私有 feed 和秘密。
- PriceAI 线上当前展示 45 个标准商品、最低价、质保价、库存、渠道和分钟级更新时间。
- OpenPrice 仓库可访问，但自定义许可证禁止未经书面许可直接运营同类商业比价/聚合服务。
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
- 已把四个可公开获取的参考仓库浅克隆到 `D:\GitHub\_references\Aivora-Supply-Radar`：PlanTrack、AI Price Radar、OpenPrice、Flarum Framework。它们与产品仓库隔离，OpenPrice 仅用于研究，不进入发布代码。
- AI Price Radar 的 MIT seed 与目录服务验证了可移植规则：标准商品与原始报价分离、只对可比较且有货的正价格计算最低价、按交付形态和币种计算中位数、来源失败保留最近快照、同款使用稳定指纹分组。
- PlanTrack 的 MIT `data/platforms.json` 是版本化官方价格目录，包含官方 URL、价格、币种、计费口径、核验日期和历史；首发只移植与爱窝啦商品直接相关且能复核官方入口的条目，完整上游代码保存在参考目录。

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| 新仓库名 `Aivora-Supply-Radar` | 与 AI 日报解耦，名称直接表达品牌和用途 |
| 目标域名 `supply.aivora.cn` | 与 `news.aivora.cn`、`www.aivora.cn` 构成清晰站群 |
| TypeScript + Cloudflare Workers + SQLite Durable Objects/Cron | 复用用户现有运维能力，避免 Docker，控制基础设施复杂度 |
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
| OpenPrice 许可不允许直接商业竞品化 | 只研究能力与公开接口；实现同等功能时使用新代码和统一数据模型 |
| 本机 Wrangler 未登录 | 使用既有后端仓库 Secrets 执行只负责新站的部署代理工作流 |
| 既有 Cloudflare Token 调用 D1 返回 code 10000 | 不申请或输出新 Token；按官方新项目路径改为 SQLite Durable Object，首次失败未创建资源或触发采集 |
| `aivora.cn` 由 DNSPod 托管，Workers Custom Domain 无法绑定 | 首发使用 workers.dev；正式子域采用 Pages 外部 CNAME，需先在 Pages 关联域名再由 DNSPod 增加记录 |
| Cloudflare 免费账户已有 5 个 Cron 触发器 | 新站定时同步由 GitHub Actions 调用受保护接口，保持 6 小时频率且不影响 AI 日报现有触发器 |

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
