# Design — 爱窝啦·货源雷达

这是货源市场的唯一公共设计契约。它吸收 PriceAI 的公开信息架构与交互优点，保留爱窝啦自己的品牌、内容、数据和视觉资产；所有页面应让买家更快完成“选商品 → 看可售报价 → 核验风险 → 决定购买”，让卖家完成“看需求 → 找货 → 算利润 → 跟踪变化”。

## Genre

Modern-minimal marketplace：安静、可信、紧凑但不拥挤。商品和交易证据是主角，不做传统 SaaS 式大口号或仪表盘堆砌。

## Macrostructure family

- 营销入口：Purchase-path entry。首页先展示三种用户意图，再进入数据模块、可信边界和指南。
- 市场页面：Data catalogue。紧凑页头、明确的标准商品/全部报价/渠道商切换、平台与库存筛选、桌面表格和移动决策卡。
- 商品详情：Decision sheet。状态、最低价、可售报价、更新鲜度和风险边界必须先于长说明。
- 内容页面：Long document，正文 60–68ch，公开证据链接保持蓝色。

导航采用居中的胶囊分段导航，顶部允许一条可关闭的经营日报公告；移动端使用抽屉菜单，不再占用屏幕底部。页脚按买家工具、商家经营、项目信息分组。

## Theme

- `--color-paper`：温暖白色内容纸面。
- `--color-paper-2`：极浅森林灰背景。
- `--color-ink`：深森林墨色。
- `--color-ink-2`：次级说明文字。
- `--color-rule`：轻但可见的边界。
- `--color-accent`：森林绿，用于主行动、活动状态与正向供应信号。
- `--color-brand`：爱窝啦黄色，只用于品牌圆点、利润提示等小面积语义，不超过视口 2%。
- `--color-link`：证据蓝。
- `--color-focus`：高可见绿色焦点环。

精确明暗 OKLCH 值位于 `v2-web/src/app/tokens.css`，仓库根目录保留同步副本。

## Typography

- Display：宋体系统栈，标题重量 600–700，营造编辑型市场气质。
- Body：构建期 Noto Sans SC / 系统中文无衬线，400–600。
- Mono：SFMono-Regular / Consolas，用于价格、库存、日期和计数。
- Display tracking：`-0.02em`；正文不要使用超宽字距。
- 数值列使用 tabular figures。

不请求远程字体，不复制参考站字体文件。

## Shape, spacing and motion

- 4-point 命名间距体系见 `tokens.css`。
- 面板 16px、输入 12px、行动按钮胶囊形；一个组件只使用一套半径逻辑。
- Hover 只改变颜色和边界，不做卡片上浮。
- 数据立即出现，不做页面 reveal choreography。
- `prefers-reduced-motion` 关闭非必要过渡。

## CTA voice

- 主行动：森林绿或深墨胶囊，使用“查看可售报价”“开始比价”等动词短语。
- 次行动：白底可见边框，几何与主行动一致。
- 证据链接：蓝色，hover 下划线，不伪装成按钮。
- 禁止笼统“了解更多”；写清动作结果。

## Shared contracts

- 品牌固定为“爱窝啦·货源雷达”，主站品牌固定为“爱窝啦·AI账号店”。
- 首页、目录、详情页共享森林绿、编辑型标题、胶囊按钮和证据蓝。
- 所有目录先展示可购买商品；无库存商品保留但在分类内沉底，并有明确分界。
- 桌面以表格压缩比较成本，移动端按“状态 → 商品 → 价格/库存 → 更新 → 行动”转为决策卡。
- 空状态必须解释原因与下一步，远端故障必须是品牌化 503，不能泄露 Cloudflare 原始错误页。
- 深浅主题必须共享层级，不能只做反色。

## Allowed variation

- 表格、卡片或长文根据任务选择，不强制所有页面一个模板。
- 商家工具可用绿/红表达收益和风险。
- 官方价格与第三方货源必须保持身份分离。

## Provenance

PriceAI 作为用户指定且已取得商业授权的体验参考。本项目学习其购买路径、信息密度、目录切换和移动端决策顺序，但不复制 PriceAI 名称、Logo、插画、文案或抓取到的品牌资产。

## Hallmark stamp

`/* Hallmark · genre: modern-minimal · macrostructure: Purchase-path + Data catalogue · design-system: design.md · studied-DNA: PriceAI */`

## Exports

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(0.995 0.003 145);
  --color-ink: oklch(0.22 0.018 155);
  --color-accent: oklch(0.50 0.12 152);
  --color-brand: oklch(0.86 0.18 91);
  --color-link: oklch(0.51 0.2 257);
  --font-display: "Songti SC", STSong, SimSun, serif;
  --font-body: var(--font-noto-sans-sc), sans-serif;
  --spacing-md: 1.5rem;
  --radius-card: 16px;
}
```

### DTCG tokens.json

```json
{
  "color": {
    "paper": { "$value": "oklch(0.995 0.003 145)", "$type": "color" },
    "ink": { "$value": "oklch(0.22 0.018 155)", "$type": "color" },
    "accent": { "$value": "oklch(0.50 0.12 152)", "$type": "color" },
    "brand": { "$value": "oklch(0.86 0.18 91)", "$type": "color" }
  },
  "space": { "md": { "$value": "1.5rem", "$type": "dimension" } },
  "radius": { "card": { "$value": "16px", "$type": "dimension" } }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 0.995 0.003 145;
  --foreground: 0.22 0.018 155;
  --primary: 0.50 0.12 152;
  --primary-foreground: 0.99 0.004 145;
  --muted: 0.975 0.006 145;
  --muted-foreground: 0.47 0.025 155;
  --border: 0.89 0.012 145;
  --ring: 0.61 0.15 151;
  --radius: 12px;
}
```
