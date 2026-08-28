# 爱窝啦 AI 货源雷达

面向 AI 账号买家、卖家和货源商的货源目录、报价追踪、官方价格、账号商机与商家投稿站点。

## 本地开发

所有项目命令应通过 D 盘缓存包装器运行：

```powershell
& "$env:USERPROFILE\.codex\skills\project-cache-hygiene\scripts\Invoke-WithProjectCache.ps1" `
  -ProjectPath "D:\GitHub\Aivora-Supply-Radar" `
  -Command @("npm", "install")

& "$env:USERPROFILE\.codex\skills\project-cache-hygiene\scripts\Invoke-WithProjectCache.ps1" `
  -ProjectPath "D:\GitHub\Aivora-Supply-Radar" `
  -Command @("npm", "run", "dev")
```

本地 `wrangler dev` 会自动创建 SQLite Durable Object 并初始化关系表，不需要单独迁移命令。

## 验证

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run dry-run:seed
npm run dry-run:opportunity -- --date 2026-08-27
npm run check:content
```

完整架构、部署、回滚和验收流程见 [DEPLOYMENT_IMPLEMENTATION_PLAN.md](DEPLOYMENT_IMPLEMENTATION_PLAN.md)。

## 商家公开 Feed

商家可提交 HTTPS JSON Feed。单次最多读取 500 条，URL、响应类型、响应体积、库存值和价格区间均会校验；任何单一来源失败只标记该来源过期。

```json
{
  "merchant": { "name": "示例商家", "site_url": "https://merchant.example/" },
  "offers": [
    {
      "id": "stable-sku-1",
      "name": "ChatGPT Plus 充值续费",
      "url": "https://merchant.example/products/stable-sku-1",
      "image_url": "https://merchant.example/images/stable-sku-1.webp",
      "price": 149,
      "high_price": 159,
      "currency": "CNY",
      "stock_status": "in_stock",
      "stock_count": 20,
      "warranty": "30d",
      "delivery_type": "topup"
    }
  ]
}
```

投稿默认进入待审核队列。生产审核和手动同步由保存 Secret 的 GitHub Actions 管理工作流完成，公开客户端无法读取管理密钥。
