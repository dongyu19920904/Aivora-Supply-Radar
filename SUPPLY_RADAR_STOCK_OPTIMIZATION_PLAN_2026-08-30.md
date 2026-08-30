# 爱窝啦·货源雷达库存与买卖体验优化实施方案

日期：2026-08-30（Asia/Shanghai）

依据：`SUPPLY_RADAR_STOCK_USABILITY_AUDIT_2026-08-30.md`

## 1. 实施原则

1. 先修数据真相，再修排序与样式；错误数据不能靠前端隐藏。
2. 商品原始库存状态是“能否购买”的权威字段；来源可访问性只用于采集健康度。
3. 可购买优先，但缺货记录必须保留给卖家判断供给缺口。
4. 所有改动保持 Supabase、Next.js/OpenNext、Cloudflare Workers 和 GitHub Actions 现有架构，不新造部署系统。
5. 生产数据同步最多主动触发一次；站点生产部署最多一次。
6. 任何完整性、构建或视觉检查失败都停止发布。

## 2. Phase A：修复库存数据语义（P0）

### A1. 状态标准化

修改 `v2-web/src/lib/priceai-import.ts`：

- `hidden=true` → `blacklisted`；
- `in_stock`、`low_stock` → `in_stock`；
- `out_of_stock` → `out_of_stock`；
- `offline` → `offline`；
- 其他值 → `offline`；
- `effectiveStatus` 不再将未知或缺货商品晋升为有货。

新增冲突回归测试，至少覆盖：

- `out_of_stock + available` 仍为缺货；
- `in_stock + unavailable` 仍按商品原始状态为有货；
- `low_stock + available` 为有货；
- 未知状态不能晋升为有货；
- hidden 始终黑名单。

### A2. 库存数字语义

- 对可购买报价，仅在库存数字 `> 0` 时显示具体库存。
- `0` 不再显示为“库存 0 + 可购买”；状态修正后的真实缺货记录显示“缺货”。
- 不推测缺失库存，不把 `null/0` 编造成正库存。

## 3. Phase B：提高实时同步稳定性（P0）

### B1. 活跃分页漂移

重构 PriceAI 商品分页：

1. 保留 20 条分页重叠和 ID 去重。
2. 记录分页期间观察到的最小/最大 `total`。
3. 对合理的小幅实时漂移继续抓取；超过固定数量或相对比例阈值立即失败。
4. 最终唯一记录数与观察区间进行完整性校验，不能静默吞掉大批数据。
5. 输出 `totalDriftProducts`、`maxTotalDrift`、唯一报价数，便于 Actions 审计。

建议阈值：单商品 `max(total)-min(total) <= max(25, 2%)`；唯一记录缺口 `<= max(10, 1%)`。该阈值只容忍采集期间的正常实时变化，不容忍源大面积丢失。

### B2. 源快照 dry-run

为导入脚本增加 `--dry-run`：

- 抓取全部标准商品和报价；
- 完成 URL、价格、状态、去重、分页完整性检查；
- 输出状态分布和漂移指标；
- 不读取生产写权限、不写 Supabase。

发布前先运行 dry-run；代码合并后只主动触发一次现有数据同步工作流写入生产。

## 4. Phase C：商品详情库存决策界面（P0）

### C1. 查询协议

在 `product-offer-query.ts` 增加 `availability`：

- `all`：全部非黑名单，数据库枚举保证可购买在前；
- `available`：仅 `in_stock`；
- `unavailable`：仅 `out_of_stock/offline`；
- 非法值回退 `all`。

API 应在数据库侧过滤后再分页，不能只过滤当前 50 条。

### C2. 详情页摘要与筛选

在商品标题区展示：

- 可购买 N；
- 缺货/下架 M；
- 全部 T；
- 最低可购买价格与最近更新时间沿用现有摘要。

增加三个清晰的库存筛选按钮。默认“全部”，保持卖家可见缺货市场；买家可一键切到“仅看可购买”。切换筛选时重置分页并从服务端获取对应结果。

### C3. 可购买与不可购买分区

- 第一条不可购买报价前插入“以下报价当前不可购买”分隔行/卡片。
- 状态“正常”改为“可购买”，含义直接。
- 缺货/下架行使用灰色背景和灰色价格，不再使用购买态绿色。
- 缺货/下架按钮保持禁用，并有可理解的文字。
- 手机卡片与桌面表格同时实现。

## 5. Phase D：商品目录买卖双方信息（P0/P1）

1. “在售渠道”统一改为“可购买报价”，避免把商品数与渠道商数混淆。
2. `0` 状态统一写“暂无可购买”，并继续沉底。
3. 目录筛选文案改为“可购买/暂不可购买”。
4. 保留推荐排序：可购买优先、核心 AI 商品优先、可购买报价多、新鲜度高。
5. 本轮不新增数据库 RPC；缺货总量在详情页由 `total - in_stock` 得到，避免为了一个展示字段引入生产 schema 风险。

## 6. Phase E：审计与回归测试

### E1. 单元测试

- PriceAI 状态冲突测试；
- 分页漂移边界测试（把纯函数抽出，覆盖允许/拒绝）；
- availability 查询解析测试；
- 目录可购买优先测试；
- 库存显示判断纯函数测试。

### E2. 生产数据审计扩展

`audit-supabase-snapshot.ts` 新增：

- `inStockWithZeroInventory`；
- `outOfStockWithPositiveInventory`；
- `inStockWithNonPositivePrice`；
- `productsWithAvailableOffers` / `productsWithoutAvailableOffers`；
- 最新/最旧采集时间；
- ChatGPT Plus 的总量、可购买、缺货分布。

状态冲突可以作为观测指标；真正阻断条件仍为 URL、关联、重复键和严重数据规模下降，避免历史存量在一次修复中造成不可控停机。

### E3. 视觉审计扩展

详情页检查新增：

- 库存筛选控件存在；
- 标题区可购买数与状态按钮一致；
- 首屏不得出现“库存: 0”；
- 不可购买行不得出现在可购买行之前；
- 缺货按钮禁用；
- 桌面、390px，日/夜模式无溢出。

## 7. Phase F：验证、提交与发布

顺序固定为：

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. PriceAI 全量 `--dry-run`
5. 生产 Supabase 只读数据审计
6. `pnpm build`
7. OpenNext/Cloudflare preview bundle
8. 部署 preview Worker
9. preview 的桌面/手机、日/夜视觉审计
10. 只提交本任务文件，SSH 推送任务分支
11. 等待 CI 全部通过
12. 合并/推进 `origin/main` 后记录精确 source SHA
13. 只主动运行一次 `v2-data-sync.yml`，等待通过并复查库存分布
14. 将同一 source SHA 同步到后端 deploy worktree
15. 一次生产 Worker 部署
16. 验证自定义域名、direct Worker、canonical、schema、库存筛选、状态排序和缓存

## 8. 回滚策略

代码回滚：对本次生产提交执行独立 `git revert <本次生产 SHA>`，通过原工作流重新部署；禁止 reset/rebase。

数据回滚：状态修复来自可重复的授权上游快照；如发现映射错误，先回滚导入代码，再用上一稳定提交运行一次同步恢复状态。

站点回滚：Cloudflare 可切回上一 Worker version；后端 deploy 仓库中的 source SHA 记录用于确认精确版本。

## 9. 后续收益迭代（不阻塞本轮）

1. 同名报价折叠与展开 N 家。
2. “库存 ≥10/50”“1 小时内更新”“有质保”“低风险”快捷筛选。
3. 商品详情一键带价进入利润计算器，并关联当天异动/账号商机。
4. 补货/降价提醒与卖家供给缺口订阅。
5. 渠道库存稳定率、价格位置、投诉证据等级和购买反馈闭环。
