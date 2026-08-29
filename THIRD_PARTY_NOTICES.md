# Third-party notices

本项目的发布代码使用以下开源项目的设计思路或经重新实现的通用算法。具体复制的代码片段在源文件中保留归属说明。

## AI Price Radar

- Repository: https://github.com/BeterXie/ai_price_radar
- Copyright: Copyright (c) 2026 BeterXie
- License: MIT
- Used for: 标准商品与原始报价分离、同款指纹、历史快照、来源健康和 last-good 数据边界的设计参考。

## PlanTrack

- Repository: https://github.com/limitcool/plantrack
- Copyright: Copyright (c) 2026 limitcool
- License: MIT
- Used for: 官方价格目录字段、变更历史、日夜主题和高密度比较页面的设计参考。

## Flarum

- Repository: https://github.com/flarum/framework
- Copyright: Copyright (c) Flarum Foundation and contributors
- License: MIT
- Used for: 社区边界和未来独立社区适配器的接口参考。Flarum 当前未打包进 Worker。

## Hono

- Repository: https://github.com/honojs/hono
- License: MIT
- Used for: Cloudflare Worker HTTP routing and middleware.

## OpenPrice

- Repository: https://github.com/bytedoger/awesome-OpenPrice
- Imported revision: `387d6b2b5a7ab0a42acc42da2117c9fd0cf290bf`
- Upstream license: OpenPrice Custom License Agreement（原文保留于 `v2-web/LICENSE`）
- Authorization: 项目所有者确认已取得权利人的商业使用及模块移植授权；授权文件由项目所有者私下保管，不提交到公开仓库。
- Used for: V2 商品目录、渠道比价、官方区域价格、商家提交、管理后台、指南和 Supabase 数据模型的授权实现基线。

PriceAI、AIDeal 和 withAI 的受限或未公开源码不包含在本仓库中。
