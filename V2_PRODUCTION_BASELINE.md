# 爱窝啦 AI 货源雷达 V2 生产基线

> 快照时间：2026-08-29 15:44（Asia/Shanghai）
>
> 用途：V2 数据迁移、路由兼容、灰度切流和回滚对账。

## 1. Git 基线

| 项目 | 值 |
|---|---|
| Repository | `git@github.com:dongyu19920904/Aivora-Supply-Radar.git` |
| 生产分支 | `main` |
| 生产基线提交 | `37c275116d47d6498d9b4c4b0e272e5df4975cb7` |
| V2 分支 | `codex/authorized-openprice-v2` |
| V2 worktree | `D:\GitHub\_worktrees\authorized-openprice-v2` |

## 2. Cloudflare 基线

| 资源 | 当前值 |
|---|---|
| 正式域名 | `https://supply.aivora.cn/` |
| V1 Worker | `aivora-supply-radar` |
| Pages edge | `aivora-supply-radar-edge` |
| Pages service binding | `RADAR_SERVICE -> aivora-supply-radar` |
| V1 持久化 | `SupplyRadarStore` SQLite Durable Object，实例名 `primary` |
| Worker 回滚地址 | 现有 workers.dev 地址保留，不在 V2 阶段删除 |

V2 正式切流采用 service binding 变更，不修改 AI 日报 Worker 和 Cron。

## 3. 线上数据基线

来源：`https://supply.aivora.cn/api/v1/health` 和 `/api/v1/products`。

| 指标 | 数值 |
|---|---:|
| 数据库状态 | ok |
| 标准商品 | 48 |
| 公开报价 | 24 |
| 商家 | 1 |
| 有报价标准商品 | 17 |
| 空目录商品 | 31 |
| 最新账号商机 | 2026-08-29 |
| 最新来源运行 | `aivora-shop` success |
| 最新来源完成时间 | 2026-08-29 09:54:53 Asia/Shanghai |

迁移后的 V2 至少要保留这 48 个商品 slug、24 条爱窝啦报价、来源 URL、图片、价格、库存、历史基线和账号商机日期。

## 4. 公开路由基线

以下路由在快照时均返回 HTTP 200：

| 路由 | 作用 | V2 要求 |
|---|---|---|
| `/` | 首页 | 保留 |
| `/products` | 标准商品 | 保留并扩展 |
| `/merchants` | 商家渠道 | 保留并扩展 |
| `/official-prices` | 官方价格 | 保留并扩展 |
| `/changes` | 今日异动 | 保留并扩展 |
| `/opportunities` | 账号商机 | 保留并扩展 |
| `/community` | 货源社区 | 保留并扩展 |
| `/submit` | 提交入口 | 保留并接通审核闭环 |
| `/methodology` | 数据方法 | 保留 |
| `/sitemap.xml` | sitemap | V2 动态生成 |
| `/robots.txt` | robots | 保留管理/API 限制 |

API 兼容基线：

- `/api/v1/health`
- `/api/v1/products`
- `/api/v1/products/{slug}`
- `/api/v1/products/{slug}/offers`
- `/api/v1/products/{slug}/history`
- `/api/v1/merchants`
- `/api/v1/merchants/{slug}`
- `/api/v1/changes`
- `/api/v1/opportunities`
- `/api/v1/opportunities/{date}`

V2 可以增加分页字段，但兼容端点不得在没有版本迁移说明时直接删除。

## 5. SEO 和品牌基线

- 品牌：爱窝啦·AI账号店；
- 正式 canonical host：`https://supply.aivora.cn`；
- 主站：`https://www.aivora.cn/`；
- 现有页面具备 canonical、JSON-LD、robots 和 sitemap；
- 支持日间、夜间和系统主题；
- 支持约 390px 手机视口；
- V2 不继承 OpenPrice 名称、Logo、第三方广告和原站 canonical。

## 6. 回滚基线

正式切流失败时：

1. 将 Pages edge 的 `RADAR_SERVICE` 恢复指向 `aivora-supply-radar`；
2. 如 edge 代码同时变更，重新部署 `37c2751` 对应 edge；
3. 不删除 V2 Worker、Supabase 或 R2，避免在故障时扩大操作范围；
4. V1 Durable Object 数据保持原样，不执行覆盖式迁移；
5. 回滚后验证本文件第 4 节全部公开路由和第 3 节核心数据。

## 7. V2 切流前对账

- [ ] 48 个原有 slug 全部存在或有 301 映射；
- [ ] 24 条爱窝啦报价全部存在；
- [ ] 爱窝啦商家页和主站来源链接正确；
- [ ] 账号商机最新日期不落后于 V1；
- [ ] 所有第 4 节公开路由通过；
- [ ] canonical 只使用正式域名；
- [ ] sitemap 不包含管理后台和无效参数页；
- [ ] 桌面/390px、日间/夜间通过；
- [ ] V1 service binding 回滚演练完成；
- [ ] AI 日报生产链路未被修改。
