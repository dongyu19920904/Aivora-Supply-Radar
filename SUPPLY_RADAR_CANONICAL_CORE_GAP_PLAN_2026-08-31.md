# 爱窝啦·货源雷达跨来源商品统一与核心体验修改方案

日期：2026-08-31（Asia/Shanghai）  
关联审计：`SUPPLY_RADAR_CANONICAL_CORE_GAP_AUDIT_2026-08-31.md`

## 1. 目标与边界

本轮目标是修复“同一商品因来源 slug 不同而拆成多个市场”的系统性缺陷，并完成第一批直接改善买家决策的界面修改。

边界：

- 不删除任何 `market_offers` 报价，不篡改来源 URL、价格、库存、来源身份和时间戳；
- 只合并 22 组名称与商业规格均明确相同的记录；试用、正价代充、Team、Pro 等不同规格继续独立；
- 不修改或触发 AI 日报生产任务；账号商机继续只读货源数据和旧日报；
- 不引入 Docker、新编排平台或无关重构；
- 数据库迁移可重跑、可审计，别名目录只停用不物理删除；
- 预览和生产部署使用同一个精确提交 SHA。

## 2. Phase A：中央 canonical 映射

新增 `v2-web/src/lib/product-canonicalization.ts`：

1. 定义 22 组 `alias slug → canonical slug`；
2. 提供 `resolveCanonicalProductSlug(slug)`；
3. 提供 `productSlugsForCanonical(slug)`，返回主 slug 和全部已知别名；
4. 提供目录摘要合并函数：
   - 选择主记录作为名称、平台、描述和公开 URL；
   - 最低价和质保价取所有来源中的有效最小值；
   - 可购买报价数相加；
   - 更新时间取最新；
   - 搜索关键词合并去重；
5. 加纯函数测试，覆盖全部映射、未知 slug、幂等、目录合并、总报价不丢失。

## 3. Phase B：前台、详情和 API 兼容迁移前后状态

### 3.1 商品目录

修改 `catalog-summary.ts`，无论数据库是否已经迁移，都先按 canonical slug 合并摘要。这样 preview 在旧数据库上就能验证最终行为，生产迁移后同一逻辑仍保持幂等。

预期：71 条原始 catalog 记录公开为 49 个标准商品，22 个重复卡片消失；分类和账号商机读取的也是统一市场。

### 3.2 商品详情

修改 `/card-products/[slug]`：

- 别名页面使用永久重定向到主 slug；
- 主页面同时查询主 ID 和全部别名 ID，因此在数据库迁移前也能显示完整报价；
- SEO canonical、OpenGraph 和结构化路径全部指向主 URL；
- 汇总最低价、质保价、可购买数和更新时间时合并全部 ID。

### 3.3 报价 API

修改 `/api/products/[slug]/offers`：

- 主 slug 和别名 slug 都解析到同一组目录 ID；
- 查询使用 `canonical_product_id in (...)`；
- 搜索、排除、价格、库存和分页语义保持不变；
- 旧客户端不会因迁移得到 404。

## 4. Phase C：阻止同步再次制造重复商品

### 4.1 Legacy 导入器

- 读取来源 API 时保留原始 slug，用于获取原报价；
- 写 `product_catalog` 和 `market_offers` 前解析成主 slug；
- 主商品已由 PriceAI 建立时，不用旧源覆盖其权威名称、描述、平台和排序；
- 主商品不存在时允许 Legacy 创建主记录，保证冷启动；
- Legacy 异动的 `product_slug` 同步规范化。

### 4.2 PriceAI 导入器

- catalog、offer 归属和 price change 全部经过同一解析器；
- 当前 PriceAI 主 slug 不变，为未来新增别名提供防线；
- 写入前保持现有完整性、HTTPS、数量覆盖和来源失败阻断。

## 5. Phase D：可回滚数据库迁移

新增 Supabase migration：

1. 对每组映射确认主记录存在，否则立即失败；
2. 将别名 ID 下的全部 `market_offers.canonical_product_id` 改为主 ID；
3. 将 `market_price_changes.product_slug` 复制为主 slug，唯一键冲突使用 `on conflict do nothing`，再移除旧 slug 事件；
4. 将别名 `product_catalog.is_active` 设为 `false`；
5. 检查没有报价仍绑定别名、没有别名仍为 active；
6. 不删除别名目录，以便审计和代码回滚。

增加手动、串行的 V2 数据库迁移工作流：

- 只允许 `workflow_dispatch`；
- 使用现有 `SUPABASE_PROJECT_REF` 与 `SUPABASE_DB_PASSWORD`；
- 先 `supabase db push --dry-run`，再执行 push；
- 不打印数据库密码或连接串；
- 数据同步和数据库迁移使用不同 concurrency group，发布时人工顺序调度。

## 6. Phase E：商品详情决策摘要

修改 `ProductDetailClient.tsx`，在长报价表之前展示：

- 当前最低可购买价；
- 可购买报价数；
- 缺货/下架保留数；
- 有明确质保证据时显示质保最低价，否则显示最近更新时间；
- 说明自营不会被固定置顶，默认仍按“可购买优先、价格从低到高”。

这一步不推断销量、信誉或利润，不把“渠道数”冒充真实商家数。

## 7. Phase F：强化数据与视觉审计

扩展 `audit-supabase-snapshot.ts`：

- 区分总 catalog 与 active catalog；
- active catalog 无精确同名重复；
- 22 个别名全部 inactive；
- 0 条报价绑定别名 ID；
- ChatGPT Plus 同时包含 `source:priceai` 与 `source:legacy-v1`；
- public summary 行数等于 active catalog，而不是历史总记录；
- 输出 canonical 商品数、别名数和合并后的 ChatGPT Plus统计。

修复 `visual-audit.ts` 的移动端异步等待：点击库存筛选后等待 DOM 报价状态真正更新，而不是只等待 API 响应。新增断言：

- 目录无已知别名链接；
- 公开商品数为 49；
- ChatGPT Plus 详情有决策摘要；
- 别名 URL 永久跳转；
- 手机缺货筛选只显示不可购买且购买按钮禁用。

## 8. 测试和 dry-run 顺序

所有 npm、Node、Playwright、Supabase 和 Cloudflare 命令通过 D 盘缓存包装器执行：

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. 根项目 `npm run lint`、`npm run typecheck`、`npm test`、`npm run build`
5. `pnpm import:priceai -- --dry-run`，确认数据库写入 0
6. Legacy 源读取/映射 dry-run 或等价回归验证
7. `pnpm build`
8. `pnpm build:cf:preview` 与 production bundle
9. 生产数据库只读审计作为迁移前基线

## 9. 发布顺序

1. 任务分支提交并通过 SSH 推送；
2. 后端既有精确 SHA preview 工作流部署当前提交；
3. 在 preview 检查 49 个标准商品、统一 ChatGPT Plus、旧链接、桌面/390px、日/夜；
4. 将同一提交推送到 `origin/main`，等待 Supply Radar CI；
5. 手动执行数据库迁移工作流，先 dry-run 后 apply；
6. 手动执行一次 V2 Data Sync，验证两个导入器不会复活别名；
7. 再次运行数据审计；
8. 使用后端既有工作流部署同一 SHA 到 production；
9. 检查 Worker version、正式域名、API、canonical、schema、sitemap、缓存和移动端；
10. 不触发 AI 日报。

## 10. 回滚

### 代码

`git revert <本轮提交 SHA>`，禁止 reset/rebase。

### Cloudflare

把生产 Worker version 切回本轮发布前版本。

### 数据

迁移不删除目录或报价。若必须回退：

1. 先回退导入器，避免新写入与回退竞争；
2. 按本报告映射把 `source:legacy-v1` 报价重新指向仍保留的别名 catalog ID；
3. 恢复别名 `is_active=true`；
4. 重新审计总报价数、外键和旧页面。

正常回滚优先只回退应用代码和 Worker；除非统一市场数据本身被证明错误，不主动拆回会误导用户的重复商品。

## 11. 风险控制

- **错合并风险**：仅使用审计确认的 22 组完全同名且规格一致记录；不做模糊名称自动合并。
- **定时任务竞争**：先让 canonical 导入代码进入 main，再迁移，再触发一次同步。
- **迁移中断**：单个 SQL migration 在事务内执行；任何主记录缺失立即回滚。
- **旧链接损失**：代码静态别名解析独立于数据库 active 状态，旧链接永久跳转。
- **来源覆盖风险**：Legacy 不覆盖已存在的 PriceAI 主商品元数据；报价来源标签继续保留。
- **单源依赖风险**：本轮提高聚合正确性但没有新增自有全网采集源；后续仍需扩充直接授权/直接采集来源。
