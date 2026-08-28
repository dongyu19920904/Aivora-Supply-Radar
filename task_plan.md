# 爱窝啦 AI 货源雷达实施计划

## Goal

在不影响现有 AI 日报稳定性的前提下，交付并上线一个位于 `supply.aivora.cn` 的全品类 AI 货源、比价、商家、行情异动与账号商机网站，完成测试、提交、推送、Cloudflare 部署和线上验证。

## Current Phase

Phase 6：发布和线上验证

## Phases

### Phase 1：真实基线与部署前置核查

- [x] 执行 superpowers bootstrap
- [x] 阅读必需技能和相关 AGENTS.md
- [x] 核对现有日报前后端 Git 状态
- [x] 核对账号商机产物、公开数据契约和线上页面
- [x] 核对 GitHub、Cloudflare、DNS 与部署权限
- [x] 记录竞品源码许可及可复用模块
- **Status:** complete

### Phase 2：详细方案和项目骨架

- [x] 编写 `DEPLOYMENT_IMPLEMENTATION_PLAN.md`
- [x] 确定站点信息架构、数据模型和失败隔离边界
- [x] 初始化独立 Git 仓库和任务分支
- [x] 搭建 Worker 原生 SSR、SQLite Durable Object、Cron 和可选 Queue/R2 扩展边界
- **Status:** complete

### Phase 3：核心货源与比价功能

- [x] 实现商品、报价、商家、快照和来源健康模型
- [x] 实现全商品目录、筛选、搜索、详情、最低价和历史
- [x] 实现商家提交、纠错、曝光与管理审核
- [x] 实现官方价格、利润计算和今日异动
- **Status:** complete

### Phase 4：账号商机与社区组合

- [x] 以只读契约接入现有账号商机日报
- [x] 实现商机与标准商品/行情的自动关联
- [x] 实现社区/货源帖入口和可替换的 Flarum 数据边界
- [x] 保证任何关联模块失败不阻塞核心比价站和 AI 日报
- **Status:** complete

### Phase 5：测试、构建和 dry-run

- [x] 运行 lint、单元测试、类型检查和生产构建
- [x] 添加数据契约、分类、去重、安全边界和失败隔离回归测试
- [x] dry-run 种子、真实采集与账号商机导入
- [x] 桌面/390px、日间/夜间、链接、图片、schema、canonical 检查
- [x] 在最终提交前复跑完整验证矩阵
- **Status:** complete

### Phase 6：发布和线上验证

- [x] 创建 GitHub 仓库并使用 SSH 推送
- [x] 创建 Cloudflare 部署代理和隔离管理入口
- [x] 配置首发 workers.dev 域名及部署工作流
- [ ] 等待 Actions/Worker 部署完成并检查日志
- [ ] 验证线上状态码、数据、页面、移动端、缓存和回滚路径
- **Status:** pending

## Key Questions

1. 现有账号商机日报是否已有稳定 JSON/Markdown 可只读消费？
2. Cloudflare 账户能否直接创建 Worker、SQLite Durable Object 和 `supply.aivora.cn` 路由？（本机 OAuth 失效；现有后端仓库 Actions Secret 可部署 Worker，但无 D1 API 权限，因此存储改为随脚本部署的 SQLite Durable Object）
3. 新 GitHub 仓库是否可由当前 `gh` 登录态创建？
4. 哪些 MIT 代码可直接复用，哪些只能重做公开功能？
5. 在禁止 Docker 的边界下，如何保留完整社区功能并避免首发阻塞？

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 新站使用独立仓库、Worker 和部署流程 | 防止货源采集、社区或图片故障影响 AI 日报主体 |
| 原日报脏目录不直接修改 | 两仓均严重分叉且含用户未提交改动 |
| 首期只读消费账号商机产物 | 页面可以迁移到新站，同时保持原定时生成链路稳定 |
| 功能和商品范围不删减 | 满足用户明确要求，采用分阶段交付而非删功能 |
| 仅直接合入许可允许商业使用的源码 | 确保部署成果可持续维护；受限项目只做功能重建 |
| 使用后端仓库 Actions Secret 作为临时部署代理 | 本机 Wrangler OAuth 失效且新仓库没有 Cloudflare Secret；代理仅部署固定 SHA，不参与日报运行时 |
| 使用单实例 SQLite Durable Object 持久化 | 现有 Token 的 D1 API 权限不足；SQLite Durable Object 随脚本迁移部署，保留完整 SQL、事务、历史价和投稿能力 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `ai-news-radar` 被错误按 `origin/main` 检查 | 1 | 已确认其跟踪分支是 `origin/master`，后续使用真实默认分支 |
| GitHub 匿名 REST API 达到共享出口限额 | 1 | 后续优先使用已认证 `gh` 或 Git/网页读取，不重复匿名 API 请求 |
| 缓存索引中的 PriceAI 仓库当前 404 | 1 | 不将其作为依赖；只独立实现可见功能，除非取得可验证源码和授权 |
| 本机 Wrangler Cloudflare OAuth 返回 400/未登录 | 1 | 不重复无效登录；优先通过现有后端仓库 Actions Secret 的隔离部署工作流发布 |
| `@cloudflare/workers-types@^4.20260828.0` 不存在 | 1 | 查询 npm 真源，修正为实际最新 `5.20260828.1`；同时把 Hono 更新到实际最新 `4.13.5` |
| 首轮分类回归测试漏分 `Gemini Pro 年卡成品号` | 1 | 保留连续短语最高优先级，并为至少两个完整词元的非连续短语增加次级匹配 |
| 本地 Cron 发现 Aivora 26 个商品全被 301 尾斜杠跳转拒绝 | 1 | 最多跟随 3 次，每一跳重做公网 HTTPS 校验；同时限制流式响应实际字节数 |
| Playwright 截图 API 不接受 `URL` 对象 | 1 | 使用 Node `fileURLToPath` 转换为 Windows 绝对路径后重跑 |
| 浏览器审计脚本加入后 TypeScript 缺少 DOM 类型 | 1 | 在同一严格配置中加入 `DOM` lib，Cloudflare Worker 类型仍由专用 types 提供 |
| 商品详情视觉审计发现内联样式被 CSP 拦截 | 1 | 将间距迁移到外部站点 CSS 类，不放宽 `style-src` |
| 7 个最终命令并行时账号商机 dry-run 在 15 秒超时 | 1 | dry-run 网络上限调整为 30 秒并改为单独复跑；生产逻辑仍保留短超时和 last-good 回退 |
| GitHub Actions 类型检查缺少 Node 内置模块声明 | 1 | 显式添加与 CI Node 22 对齐的 `@types/node@^22.20.1`，不依赖本地间接类型 |
| 首次发布在 D1 资源检查前返回 Cloudflare `Authentication error [code 10000]` | 1 | 确认 Token 的 Worker 部署权限正常但无 D1 API 权限；改用官方 SQLite Durable Object，失败运行未创建资源、未迁移、未生产同步 |
| 空缓存首页/商机页同步等待远端 GitHub | 1 | 页面改为只读缓存；部署后受保护地组合同步一次，后续由 Cron 更新，远端失败不阻塞页面 |
| Worker 上传后无法绑定 `supply.aivora.cn` | 1 | 权威 NS 是 DNSPod，不是 Cloudflare Zone；首发改用 workers.dev，正式子域待 DNSPod CNAME 权限后走 Pages 外部子域方案，不迁移整个主域 DNS |

## Notes

- 所有 npm、Node、Wrangler、Playwright 和测试命令必须通过项目缓存包装器运行。
- 不输出或提交任何 Cloudflare、GitHub、测试触发或第三方 API Secret。
- 生产采集和生产任务最多触发一次；失败时先修复再部署。
- 每完成一个阶段更新本文件、`findings.md` 和 `progress.md`。
