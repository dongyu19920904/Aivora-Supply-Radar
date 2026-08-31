# AI 账号商家经营日报拆分实施方案

日期：2026-09-01  
实施原则：先迁数据，再切发布，再隐藏旧入口；每个阶段都可独立回滚。

## 阶段 0：基线与保护

1. 以前后端、货源站和个人主页各自的 `origin/main` 建立独立 `codex/` 工作树。
2. 记录四个仓库当前 SHA、工作流、发布目标和线上状态。
3. 统计 AI 日报账号经营历史文件数、日期范围与总字节数。
4. 所有 Node、Hugo、Wrangler、Playwright 命令通过项目缓存包装器执行。

验收：原目录和用户未提交改动不被触碰；四个任务工作树可独立提交。

## 阶段 1：货源仓库接管数据与页面

### 1.1 迁移历史源文件

1. 将 AI 日报 `content/cn/account-opportunity/` 完整复制到货源仓库同路径。
2. 校验源端和目标端日报文件数量、相对路径与 SHA-256 一致。
3. 不在货源仓库直接用 Hugo 渲染这些文件；它们是可审计的日报源与回放档案。

### 1.2 切换 V1 采集源

1. 将 `SOURCE_REPO` 默认值改为 `dongyu19920904/Aivora-Supply-Radar`。
2. 把公开页面 URL 改为 `https://supply.aivora.cn/opportunities/YYYY-MM-DD`。
3. dry-run 同步使用货源仓库，不再依赖 AI 日报。
4. 添加回归测试，验证 canonical 页面 URL 与上海日期边界。

### 1.3 建立 Supabase 历史归档导入

1. 新增幂等脚本，扫描本仓库历史 Markdown。
2. 解析 front matter、正文、发布日期，使用 Git blob SHA 作为 `source_sha`。
3. `source_url` 统一写入货源站对应日期。
4. 只更新 SHA 变化或数据库缺失的日期，输出发现、导入、跳过、拒绝数量。
5. 在 V2 数据同步工作流中执行；同步失败不阻塞价格与库存主数据，可单独重跑。

### 1.4 完善 V2 经营日报体验

1. `/opportunities` 保持实时经营台为首屏，历史日报只作为同一经营闭环的记录。
2. 新增 `/opportunities/archive` 分页归档。
3. 列表查询只读取摘要字段，详情页才读取 Markdown 正文。
4. 详情页移除“查看日报原页”，改为返回实时经营台、货源核验和利润计算动作。
5. sitemap 收录归档页与全部日报日期。
6. 文案统一为“AI 账号商家经营日报”，避免泛化为资讯或收益承诺。

验收：历史详情不再跳回新闻站；归档可翻页；最新实时盘面仍优先于历史内容。

## 阶段 2：Worker 发布目标拆分

1. 新增独立非敏感变量：
   - `ACCOUNT_OPPORTUNITY_GITHUB_REPO_OWNER`
   - `ACCOUNT_OPPORTUNITY_GITHUB_REPO_NAME`
   - `ACCOUNT_OPPORTUNITY_GITHUB_BRANCH`
2. 账号日报提交、健康检查和 home repair 使用账号专用 GitHub 环境；AI 日报与通用 AI 商机继续使用原目标。
3. 账号日报公开路径改为 `/opportunities/YYYY-MM-DD`。
4. 账号日报源文件路径暂保持 `content/cn/account-opportunity/YYYY-MM/YYYY-MM-DD.md`，降低迁移风险。
5. 更新每日兜底工作流，改查货源仓库及货源站 URL。
6. 添加测试，验证账号目标环境不会覆盖主日报目标，且 URL 为货源站扁平日期结构。

验收：dry-run 显示 0 模型调用、校验通过、would publish 为 true；不实际写 GitHub。

## 阶段 3：AI 日报退出账号经营栏目

1. 删除 `hugo.yaml` 中账号商机主导航。
2. 删除首页封面按钮、阅读说明和快捷卡片中的账号经营入口。
3. 删除 `static/llms.txt` 中账号经营入口。
4. 将 134 期正文替换为轻量迁移桩：保留日期和标题，添加 `noindex`、新站 canonical、禁用 sitemap、排除站内搜索。
5. 根栏目和月份目录跳到货源经营台或归档；日期页一一跳到新日期。
6. 更新导航测试，新增旧日期映射、canonical、正文不泄露和 sitemap 排除测试。

验收：Hugo 构建后搜索数据、sitemap 和首页 HTML 均没有账号经营内容；旧 URL 仍可迁移。

## 阶段 4：个人主页增加受众分流入口

1. 在首页 `NAV_LINKS` 增加“AI 货源与商家经营”。
2. 在 `/projects` 增加完整项目卡片，描述找货、库存、比价、异动和经营日报。
3. 顶部导航增加简短“货源雷达”入口，页脚同步增加。
4. 保留 AI 日报原入口，并让两者名称和描述清楚区分买家资讯与卖家经营。
5. 更新相关测试或添加数据配置测试。

验收：桌面和移动端导航不溢出，项目卡片正确跳到 `https://supply.aivora.cn/`。

## 阶段 5：测试与 dry-run

### 后端

- 运行完整 `node --test tests/*.mjs`。
- 执行指定日期账号日报 dry-run，检查货源快照、正文段落、链接、重复、可发布状态和模型调用数。
- 构建/部署 dry-run 验证 Wrangler 配置。

### 货源 V1

- `lint`、`typecheck`、完整 Vitest。
- `check:content`、`dry-run:seed`、指定日期 `dry-run:opportunity`。
- Wrangler dry-run build。

### 货源 V2

- `pnpm test`、`typecheck`、`lint`。
- `pnpm build:cf:production`。
- 归档导入脚本 `--dry-run`，不得写 Supabase。

### AI 日报前端

- 运行仓库已有 Node 测试。
- Hugo production 构建。
- 检查首页、旧根路径、旧日期路径、sitemap、robots、canonical 和搜索数据。

### 个人主页

- `pnpm exec astro check`、测试、lint、format check、build。
- 扫描生成 HTML 中的入口和 canonical。

## 阶段 6：发布顺序

1. 先推送货源仓库：历史源、归档导入和 V2 页面。
2. 等待 V1/V2 CI 通过，执行数据同步，确认 Supabase 归档已接管。
3. 通过现有后端生产部署工作流发布货源 V2，并验证 `/opportunities`、归档和历史详情。
4. 再推送后端，等待 Worker 部署完成。
5. 对当天执行一次账号日报 dry-run；仅在目标权限和新站均正常时最多生产触发一次。
6. 推送 AI 日报迁移页，等待 GitHub Pages 完成。
7. 最后推送个人主页入口，等待其现有部署流程完成。

该顺序确保任何时刻都不会出现“旧正文已移除但新站尚无内容”的窗口。

## 阶段 7：线上验收

1. `news.aivora.cn`：主页与导航无账号经营入口；旧日期 canonical 和跳转正确。
2. `supply.aivora.cn`：经营台、归档、最新一期和至少一条早期历史期返回 200。
3. 详情页可进入关联商品和利润计算器，不再链接 AI 日报原页。
4. `yuyu.aivora.cn`：首页、项目页、顶栏和页脚入口正确。
5. 桌面与 390px 手机视口检查日间/夜间模式、溢出、跳转和字体。
6. 检查四个仓库远端 SHA、Actions 结论、Worker 状态和缓存刷新。

## 回滚顺序

1. 货源 V2：使用现有 `rollback-supply-v2` 或生产部署工作流自动回滚到 V1。
2. 后端：revert 发布目标拆分提交，账号任务仍保持隔离。
3. AI 日报：revert 迁移页提交，恢复原正文和入口。
4. 个人主页：revert 导航入口提交。

每个仓库单独提交，任何一层回滚都不要求重置或覆盖其他仓库历史。
