# OpenPrice 商业授权资产清单

> 清单日期：2026-08-29（Asia/Shanghai）
>
> 用途：固定 V2 可移植资产、来源版本、缺口和导入边界。
> 注意：商业授权原件不提交到本仓库；本文件不包含授权金额、个人信息或敏感条款。

## 1. 授权状态

| 项目 | 状态 | 证据处理 |
|---|---|---|
| OpenPrice 代码商业使用 | 项目所有者已明确确认取得 | 私密原件由项目所有者保存，仓库只记录适用版本 |
| 移植全部授权模块 | 已确认允许 | 按 `AUTHORIZED_OPENPRICE_V2_PLAN.md` 执行 |
| 公开再分发授权源码 | 待从授权文本核对 | 未核对前只进入私有分支/仓库，不影响线上部署 |
| OpenPrice 品牌和商标 | 不作为默认授权资产 | V2 统一使用爱窝啦品牌 |
| 生产数据库和历史报价 | 待核对是否随授权交付 | 没有数据授权时从原始商家重新采集 |
| 私有采集器与渠道配置 | 待核对是否另行交付 | 若交付则审计后接入；否则独立补建 |

## 2. 已核对源码

| 字段 | 值 |
|---|---|
| Repository | `https://github.com/bytedoger/awesome-OpenPrice.git` |
| Branch | `main` |
| Commit | `387d6b2b5a7ab0a42acc42da2117c9fd0cf290bf` |
| 本地只读参考副本 | `D:\GitHub\_references\Aivora-Supply-Radar\awesome-OpenPrice` |
| 本地与远端一致 | 是，2026-08-29 复核 |
| TypeScript/TSX 文件 | 117 |
| UI 组件 | 39 |
| Admin 文件 | 18 |
| Python scraper 文件 | 4 |

参考副本只用于核对和导入来源，不直接在其中开发或提交爱窝啦改动。

## 3. 可直接移植模块

| 模块 | 主要路径 | 状态 |
|---|---|---|
| 首页和全局布局 | `src/app/page.tsx`、`src/app/layout.tsx` | 可移植、需品牌化 |
| 标准商品 | `src/app/card-products` | 可移植、需映射到 `/products` |
| 全部报价 | `src/app/card-products/all` | 可移植、上线前需服务端分页 |
| 商品详情 | `src/app/card-products/[slug]` | 可移植、需合并历史/商机 |
| 渠道目录和详情 | `src/app/channels` | 可移植、映射到 `/merchants` |
| 官方地区价格 | `src/app/official-prices` | 可直接移植 |
| 指南 | `src/app/guide` | 可移植并重写品牌文案 |
| 博客 | `src/app/blog` | 可移植；Notion/R2 配置需重新创建 |
| 管理后台 | `src/app/admin` | 可移植并补权限测试 |
| 投稿与反馈 | `src/app/actions.ts` | 可移植并补限流/审核闭环 |
| Supabase schema | `supabase/public_schema.sql`、`supabase/migrations` | 可移植并扩展 |
| OpenNext Cloudflare | `open-next.config.ts`、`cloudflare-worker.mjs`、`wrangler.toml` | 可移植并重命名资源 |
| App Store 价格采集 | `scraper/tasks/app_store_worker.py` | 可移植并 dry-run |
| App Store parser 测试 | `scraper/tests/test_app_store_parser.py` | 可移植 |

## 4. 必须先改造再上线的模块

| 模块 | 当前问题 | V2 动作 |
|---|---|---|
| 全量报价 API | 逐页读取后一次性返回全部报价 | 改游标分页、服务端筛选和响应上限 |
| 商品列表聚合 | 读取和处理大量 `market_offers` | 建立 `product_stats` 读模型 |
| 渠道统计 | 运行时扫描报价 | 建立 `merchant_stats` 读模型 |
| Admin 报价/来源 | 大数据量下缺少完整分页验证 | 服务端分页、搜索、批量操作审计 |
| 公共 Supabase 查询 | 需要重新核对 RLS 和 anon 权限 | 最小 SELECT/INSERT 权限 |
| 管理 service role | 必须仅存在于服务端 | Secret 注入和打包泄漏测试 |
| 上游推广组件 | 含第三方推广素材 | 删除或替换为明确标记的爱窝啦入口 |
| URL | `/card-products`、`/channels` | 迁入爱窝啦 URL 并提供 301 |

## 5. 当前源码缺口

1. 完整发卡系统采集器没有出现在已核对的公开提交中。
2. 当前只有 App Store 官方价格的 Python 采集任务。
3. 没有爱窝啦现有报价快照和今日异动模型。
4. 没有账号商机只读同步和结构化经营动作。
5. 没有完整社区、求购、曝光证据、收藏和提醒模块。
6. 前端自动测试不足，只有 App Store parser 测试可直接继承。
7. 30,000 条报价的分页、缓存和性能门槛尚未验证。

## 6. 授权方交付核对清单

- [ ] 完整商业授权文本适用的代码版本；
- [ ] 是否允许将授权源码提交到当前 GitHub 仓库；
- [ ] 私有采集器源码和依赖；
- [ ] 支持的发卡系统和 scraper type 列表；
- [ ] 每个适配器的测试页面或 fixture；
- [ ] 渠道目标配置是否包含在授权内；
- [ ] 商品类目 seed 和类目 ID 映射；
- [ ] 是否提供数据库导出；
- [ ] 数据库数据和代码授权是否为同一范围；
- [ ] 图片、Logo、广告素材和品牌资产是否允许使用；
- [ ] 已知部署依赖和必要 secrets 名称，仅记录名称不记录值。

## 7. 导入原则

- 固定上游 commit 后导入，不从浮动 main 直接部署；
- 导入提交与品牌/业务修改分开，便于审计 diff；
- 保留版权和授权归属；
- 任何授权源码更新都先在参考副本或独立分支审计；
- 不复制上游生产 secret、数据库凭据、渠道 Cookie 或用户数据；
- 上游代码能够构建不等于适合直接生产，必须经过 V2 测试门槛。
