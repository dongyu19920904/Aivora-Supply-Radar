# 爱窝啦·货源雷达核心功能与跨来源商品审计报告

审计日期：2026-08-31（Asia/Shanghai）  
生产基线：<https://supply.aivora.cn/>  
代码基线：`Aivora-Supply-Radar origin/main`，提交 `f01b03af5039912c15b819b8a2f1fd59880f69ac`  
对标页面：<https://priceai.cc/channels>、<https://closeman.asia/>、<https://www.openprice.cc/card-products>、<https://withai.homes/>

## 1. 结论先行

用户看到“最热卖的 ChatGPT Plus 只有爱窝啦自己的报价”，并不是全网报价没有采集到，而是**同一个标准商品被两个来源各自建立成了不同的目录记录**。爱窝啦旧货源使用 `chatgpt-plus-trial`，PriceAI 使用 `chatgpt-plus`；前者绑定 1 条自营报价，后者绑定 1,083 条授权聚合报价。页面和 API 都只按单个 `canonical_product_id` 查询，所以用户打开旧记录时只能看到自营。

这不是一个孤立商品问题。生产数据库 71 条目录记录中有 **22 组名称完全相同的重复标准商品**，共占 44 条记录；去掉这 22 条别名记录后，应有 49 个真实标准商品。重复记录把报价、最低价、库存、商机信号、渠道数和 SEO 页面全部拆开，造成“有数据却像没数据”的体验。

本轮 P0 必须从四层一起修复：

1. 建立唯一的跨来源 canonical slug 映射；
2. 前台、详情和 API 在数据库迁移前后都能聚合同一商品；
3. 后续 Legacy 与 PriceAI 同步统一写入主商品，不能再次拆分；
4. 数据迁移保留全部报价和旧链接，只停用别名目录，不删除历史。

在此基础上，本轮同步补齐商品详情的决策摘要、重复商品数据审计和移动端筛选回归等待。社区、提醒、渠道健康度等更大的产品能力继续列为后续阶段，不能用一个版本仓促拼成不可靠功能。

## 2. 数据证据

### 2.1 全量生产快照

2026-08-31 本轮只读审计结果：

| 指标 | 数值 |
| --- | ---: |
| 平台 | 13 |
| 目录记录 | 71 |
| 渠道目标 | 384 |
| 报价总数 | 5,384 |
| PriceAI 授权报价 | 5,360 |
| 爱窝啦旧版报价 | 24 |
| 可购买报价 | 3,392 |
| 缺货报价 | 1,992 |
| 有报价目录 | 54 |
| 无可购买报价目录 | 17 |
| HTTPS 非法链接 | 0 |
| 丢失商品归属 | 0 |
| 丢失渠道归属 | 0 |
| 同渠道同标题重复报价 | 0 |

快照说明采集主体是存在的，完整性校验也通过；缺陷发生在“报价属于哪个标准商品”这一层。

### 2.2 ChatGPT Plus 的直接证据

生产 API 当前返回：

| 用户看到的商品记录 | slug | 报价数 | 实际来源 |
| --- | --- | ---: | --- |
| ChatGPT Plus 试用订阅（旧记录） | `chatgpt-plus-trial` | 1 | 爱窝啦旧版/自营 |
| ChatGPT Plus 试用订阅（PriceAI 记录） | `chatgpt-plus` | 1,083 | PriceAI 授权聚合 |
| ChatGPT Plus 正价代充（旧记录） | `chatgpt-plus-renewal` | 1 | 爱窝啦旧版/自营 |
| ChatGPT Plus 正价代充（PriceAI 记录） | `chatgpt-plus-recharge` | 240 | PriceAI 授权聚合 |

PriceAI 对标页面在本轮检查时显示 ChatGPT Plus 试用订阅 1,125 条渠道报价，其中 225 条有货、900 条缺货；正价代充 241 条，其中 203 条有货、38 条缺货。爱窝啦生产快照较旧且数量会随同步时刻变化，但最主要差距不是几十条时间差，而是用户可能被引导到只有 1 条报价的重复详情页。

### 2.3 22 组精确重复标准商品

下表左侧为旧来源别名，右侧为统一后的公开主 slug。每组生产目录名称完全相同，可安全合并报价；不同商业规格（例如试用订阅与正价代充）仍保持分开。

| 别名 slug | 主 slug | 标准商品 |
| --- | --- | --- |
| `other-email` | `email-account` | 其他邮箱 |
| `generic-verification` | `phone-verification` | 通用接码 |
| `identity-service` | `identity-verification` | 真人 / KYC |
| `apple-id` | `apple-id-account` | Apple ID |
| `chatgpt-account` | `chatgpt-free-account` | ChatGPT 普号 |
| `chatgpt-plus-trial` | `chatgpt-plus` | ChatGPT Plus 试用订阅 |
| `chatgpt-plus-renewal` | `chatgpt-plus-recharge` | ChatGPT Plus 正价代充 |
| `chatgpt-team` | `chatgpt-team-business` | ChatGPT Team / Business |
| `claude-pro` | `claude-pro-month` | Claude Pro |
| `chatgpt-services` | `chatgpt-codex-service` | Codex / ChatGPT 周边 |
| `gemini-pro-account` | `gemini-pro-year` | Gemini Pro 成品号 |
| `gemini-pro-renewal` | `gemini-pro-recharge` | Gemini Pro 充值 |
| `gmail-email` | `gmail-account` | Gmail |
| `google-verification` | `google-phone-verification` | Google / Gemini 接码 |
| `kiro-free` | `kiro-account` | Kiro Free |
| `kiro-pro` | `kiro-pro-account` | Kiro Pro |
| `openai-verification` | `openai-phone-verification` | OpenAI / ChatGPT 接码 |
| `outlook-email` | `outlook-account` | Outlook / Hotmail |
| `paypal-verification` | `paypal-phone-verification` | PayPal 接码 |
| `grok-heavy` | `super-grok-heavy` | SuperGrok Heavy |
| `x-account` | `x-twitter-account` | X account |
| `x-premium` | `x-twitter-premium` | X Premium |

其它可见拆分同样严重：ChatGPT 普号是 0 条与 203 条、Team/Business 是 0 条与 260 条、Codex 周边是 2 条与 46 条。它们说明“只有自营”只是同一根因的一个表现。

## 3. 根因定位

### 3.1 两个导入器各自把来源 slug 当作全站 canonical

- `v2-web/scripts/import-legacy-baseline.ts` 按 Legacy `product.slug` upsert `product_catalog`，再把 Legacy 报价绑定到该记录；
- `v2-web/scripts/import-priceai-snapshot.ts` 按 PriceAI `product.slug` 做相同操作；
- 两个导入器之间没有别名表、跨来源映射或名称冲突阻断；
- 定时同步每 30 分钟运行一次，因此只在数据库手工改一次也会复发。

### 3.2 商品详情和 API 只查询单一目录 ID

- `/card-products/[slug]` 先按 slug 找一条目录，再使用 `.eq('canonical_product_id', productId)`；
- `/api/products/[slug]/offers` 也只按同一个 ID 查询；
- 目录摘要 RPC 对每个 catalog ID 独立聚合。

所以即使两条记录名称完全相同，系统仍把它们当作两个互不相关的市场。

### 3.3 现有数据审计没有检查“活跃目录同名/别名重复”

`audit-supabase-snapshot.ts` 验证 HTTPS、外键、报价唯一性和单个 `chatgpt-plus` 数据，但没有验证：

- canonical 别名是否仍处于 active；
- 报价是否绑定在别名 ID；
- 活跃目录是否存在同名重复；
- ChatGPT Plus 是否同时包含 PriceAI 与爱窝啦报价。

因此审计显示 `validation: passed`，用户体验仍然错误。

## 4. 与竞品的当前核心差距

### 4.1 标准商品与报价聚合：P0

PriceAI 的标准商品是一条商品聚合全部来源，并直接显示最低价、质保价、有货、缺货和总渠道。爱窝啦已经采集到相近规模的数据，但 22 组商品被拆分，目录数量虚高、同名卡片重复、详情报价不全。这是本轮最影响买家效率和网站可信度的差距。

### 4.2 商品详情的决策摘要：P1

爱窝啦详情已经具备可购买/缺货/下架筛选、关键词排除、价格区间、分页和原始链接，基础能力不再是阉割版。但首屏只突出“当前可购买报价数”，最低价、缺货数、质保最低价和最近更新时间没有形成清晰摘要；用户仍需扫描表格才能判断市场。

### 4.3 全部报价发现：P1

`/card-products/all` 已有平台、类目、搜索和游标加载，但仍缺少明确的库存筛选、价格排序、更新时间排序与已选条件摘要。对批量找货的卖家，路径仍比 AIDeal 的类别/细分/交付/价格/仅看有货更慢。

### 4.4 渠道判断：P1

渠道页已经分页，不再一次显示 384 行；但列表主要只有系统类型、商品数和更新时间，缺少：

- 当前可购买报价数与覆盖平台；
- 最近成功采集、错误状态和数据新鲜度；
- 自营、授权聚合、直接采集等来源身份；
- 从渠道页反查具体在售商品时的库存/价格摘要。

这使“找到渠道”可用，“判断渠道值不值得看”仍然弱。

### 4.5 异动与账号商机：已从空壳提升，但受重复商品污染

生产视觉审计显示 `/changes` 已有真实内容，`/opportunities` 有 6 条实时线索、商品链接、供给地图和日报归档；这两个模块已经不再是旧版空壳。不过它们读取的商品摘要和变动 slug 仍可能来自重复目录，导致同一市场被拆成两条信号，供给密度被低估或高估。canonical 合并后需要同步统一异动 slug 和商机输入。

### 4.6 社区与供需协作：P2

`/community` 当前仍是“提交货源、查看商机、GitHub 建议”三个静态入口，不是真正的供需市场。WithAI 的优势是即时发帖、求购、批发、回复和时间流；AIDeal 的优势是避坑检索。爱窝啦后续应做审核型供需板和纠错/争议证据链，但未经核验的帖子不能直接进入自然报价排序。本轮不仓促上线空论坛。

### 4.7 收藏、提醒与卖家工作台：P2

当前还没有用户侧收藏、补货/降价提醒、关注商品、批量比较和卖家上架清单。这些能力决定“访问一次”能否转化为“每天使用”，但需要账号或匿名订阅、限速、通知和隐私边界，不宜与本轮数据修复混在一个不可回滚的大改中。

## 5. 视觉与稳定性检查

生产自动化审计覆盖首页、商品目录、全部报价、ChatGPT Plus 详情、商机和异动：

- 11 个桌面/手机、日/夜用例均为 HTTP 200；
- 无横向溢出、破图或浏览器控制台错误；
- 商品目录分 11 类，ChatGPT 第一，分类内可购买优先；
- 商机页实时盘面、6 条线索、商品入口、供给地图与归档均存在；
- 唯一阻断是手机详情切换“缺货/下架”后，审计脚本在 React 完成渲染前立即读取旧 DOM。桌面相同功能通过，属于等待条件不足的测试缺陷，本轮会修复审计等待并重新验证。

## 6. 本轮实施范围

### 必须完成

1. 22 组别名统一到 22 个主商品；
2. 目录从 71 条原始记录变为 49 个公开标准商品，报价不丢失；
3. ChatGPT Plus 统一详情同时显示授权全网报价和爱窝啦自营报价；
4. 旧 URL 永久跳转，新旧 API slug 都返回统一市场；
5. 两个同步器以后只写主商品；
6. 迁移报价与异动 slug，别名目录停用但不删除；
7. 数据审计阻断任何别名复活、同名重复或报价继续绑定别名；
8. 商品详情增加最低价、可购买、缺货/下架、质保价/更新时间摘要；
9. 完整测试、数据 dry-run、构建、预览视觉和生产验证。

### 后续阶段

1. 全部报价的库存/交付/更新时间/排序组合；
2. 渠道健康、覆盖平台和在售指标；
3. 审核型供需板与避坑证据链；
4. 收藏、补货/降价提醒和卖家工作台；
5. 自有直接采集来源扩充，降低对单一授权聚合源的依赖。

## 7. 验收口径

- 活跃标准商品无已知别名 slug、无精确同名重复；
- `chatgpt-plus` 报价数等于迁移前两个记录之和，并包含两类来源标签；
- `chatgpt-plus-trial` 页面 308 永久跳转到 `/card-products/chatgpt-plus`；
- `chatgpt-plus-trial` API 与 `chatgpt-plus` API 返回同一 total；
- 目录公开商品数为 49，所有 5,384 条现有报价保留；
- 后续 Legacy/PriceAI 同步后，别名不复活、报价不回流；
- 手机/桌面、日间/夜间无溢出、错序、错误购买按钮或失效链接；
- 任何数据审计、全量测试、构建或预览失败都不得生产部署。
