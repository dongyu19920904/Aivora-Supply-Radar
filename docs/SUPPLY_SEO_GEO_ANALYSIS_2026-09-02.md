# 爱窝啦·货源雷达 SEO 与 GEO 分析

日期 2026-09-02

## 结论

货源站应当继续服务 AI 账号卖家，主站继续服务个人零售买家。两站要用清晰的意图分工获得搜索流量。货源站承接 AI 账号货源、进货核价、库存、利润和经营日报等卖家问题。访客明确表示自己使用时，再进入爱窝啦·AI账号店完成零售购买。

这套结构可以避免两站争抢同一批零售关键词，也不会把卖家带进与批量补货不匹配的零售商品页。SEO 负责让合适的页面进入搜索索引，GEO 负责让搜索和 AI 系统能读懂数据、引用结论并找到正确的下一步。排名和引用无法保证，能直接控制的是抓取、页面结构、独有数据、来源透明度和转化路径。

## 本次检查范围

- 线上首页、标准商品、ChatGPT Plus 商品页、账号商机日报、robots.txt 和 sitemap.xml
- 爱窝啦·AI账号店首页、robots.txt、sitemap.xml 和五个零售商品页
- Supply V2 的 metadata、canonical、Schema、导航、商品分类、日报和部署流程
- PriceAI 的首页、渠道页和 ChatGPT 平台页
- 当前公开搜索对 AI 账号货源、AI 账号进货、ChatGPT Plus 货源和账号商机日报的抽样结果

## 当前技术基础

2026-09-02 检查时，货源站首页、商品页、日报、robots.txt 和 sitemap.xml 都返回 HTTP 200。线上由 Cloudflare Pages 边缘层和 Worker 提供服务，两层发布头均指向提交 `03c202925e084fddbf9bc048b175f6ec280fe386`。

货源站 sitemap.xml 当前包含 206 个 URL。首页和商品页有 canonical，首页有 Organization、WebSite 和 FAQPage 数据，日报有 BlogPosting 数据。robots.txt 允许公开页面抓取，只屏蔽 `/admin/`。通配规则没有拦截 OAI-SearchBot、Googlebot 或 Bingbot。

主站 sitemap.xml 当前包含 116 个 URL，其中 29 个是公开商品页。下面五个零售商品页都在主站 sitemap 中，返回 HTTP 200，canonical 指向自身。

| 平台 | 已核验的零售页 |
|---|---|
| ChatGPT | `https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-1` |
| Claude | `https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-2` |
| Gemini | `https://www.aivora.cn/products/gemini-pro-year-renewal` |
| Grok | `https://www.aivora.cn/products/chong-zhi-xu-fei-yue-ka-3` |
| Cursor | `https://www.aivora.cn/products/du-xiang-hao-yue-ka` |

## 当前主要差距

### 平台分类没有独立可索引地址

标准商品页已经按 ChatGPT、Claude、Gemini、Grok 和 AI 编程分类。分类状态目前保存在 `#chatgpt` 这类页面片段中。页面片段不会形成独立文档，搜索引擎也无法为 ChatGPT 货源、Claude 货源等问题分别选择对应页面。

PriceAI 已经提供 `/platforms/chatgpt` 这类独立页面。它的 ChatGPT 页面有独立标题、描述、H1、当前商品数量、有货报价、更新时间和商品列表。货源站虽然有相近数据，却缺少能承载这些搜索意图的独立页面。

这会造成两个结果。搜索引擎只能把所有平台问题都交给一个大目录页。AI 搜索系统也缺少一段可以单独引用的 ChatGPT 或 Claude 现状摘要。

### 页面数据可用，解释层仍然偏薄

商品目录显示标准商品、可采购数量、最低价、渠道数和更新时间。页面可以帮助卖家操作，但没有把每个平台的核价方法、常见规格差异和停止条件整理成独立内容。

竞争页面已经在同一页说明当前数量、最近更新时间、库存口径和平台内商品差异。货源站需要把自己的实时数据与卖家判断方法放在一起，才能形成独有内容。单纯重复常识不会建立主题权威。

### 品牌实体关系没有统一

全站 Schema 把“爱窝啦·货源雷达”声明为 Organization。日报的 publisher 又写成“爱窝啦·AI账号店”，但没有复用同一个实体 ID。搜索和 AI 系统会看到两个关系不清楚的主体。

更准确的表达是由“爱窝啦·AI账号店”这个组织发布“爱窝啦·货源雷达”网站。WebSite 继续使用货源站名称，publisher 指向主站组织实体，audience 明确写 AI 账号卖家与数字商品渠道商。

### 零售跳转存在重复和语义错位

首页只有页脚的一个主站链接，商品详情页同时渲染桌面推荐位、移动推荐横幅和页脚链接。服务端 HTML 中一共出现 3 个主站链接。两个推荐位内容相同，页面还显示空白广告位，削弱主要操作。

批发页把主站链接写成“联系补货支持”，企业经营页写成“联系履约支持”。主站实际服务个人零售买家，这两个文案会让卖家误以为主站承接批发或企业履约。

零售跳转需要保留，但必须明确条件。卖家继续留在货源页核价。个人自用访客进入主站零售页。每页保留 0 到 2 个主站链接，商品和平台页优先使用一个与内容匹配的零售商品链接，再保留一个页脚入口。

### 跨站转化无法归因

现有主站链接没有来源参数。即使主站已有访问统计，也无法区分流量来自页脚、商品详情还是平台主题页。链接需要加入固定 UTM 参数，并保留主站商品页的干净 canonical。

### 搜索可见度仍处于新站阶段

本轮公开搜索抽样没有返回 `site:supply.aivora.cn` 结果。这只能说明抽样搜索没有发现页面，不能替代 Google Search Console 的索引报告。站点上线时间较短，独立主题页和外部引用也较少，搜索系统需要时间重新抓取和建立信任。

### GEO 不应依赖特殊文件

Google 当前说明，生成式搜索仍依赖基础 SEO、可抓取页面、独有内容和良好体验，不需要专门为 AI 拆碎内容，也不需要 llms.txt 才能出现。OpenAI 说明 OAI-SearchBot 没有被 robots.txt 屏蔽时，公开页面可以进入 ChatGPT 搜索发现流程。

本项目不增加隐藏提示词，不做关键词堆砌，也不把同一段文字复制成大量页面。本轮 GEO 采用可见的问答、实时数字、更新时间、方法说明、内部链接和准确 Schema。

## 搜索意图分工

| 搜索意图 | 应进入的站点 | 目标页面 | 访客下一步 |
|---|---|---|---|
| AI 账号货源和进货 | 货源站 | 标准商品与平台主题页 | 比较库存、渠道和原页 |
| ChatGPT 或 Claude 货源核价 | 货源站 | 对应平台主题页 | 进入标准商品详情 |
| AI 账号利润和经营动作 | 货源站 | 利润计算器与账号商机日报 | 核验成本后决定接单 |
| 自己购买 ChatGPT 或 Claude | 主站 | 对应零售商品页 | 阅读交付说明并下单 |
| 爱窝啦账号购买 | 主站 | 首页或商品页 | 完成零售购买 |

## 本轮优先级

### 第一优先级

- 建立 ChatGPT、Claude、Gemini、Grok 和 AI 编程五个独立平台主题页
- 每页显示实时商品数、可采购商品数、公开报价数、最低参考和最近更新时间
- 每页提供独立标题、描述、canonical、CollectionPage、ItemList 和 BreadcrumbList
- 用可见文字明确卖家核价和个人自用的不同路径

### 第二优先级

- 统一主站组织实体和货源站 WebSite 实体
- 补齐日报 author、publisher、image、isPartOf 和可见更新时间
- 首页、目录和 sitemap 增加平台主题页的内部链接

### 第三优先级

- 统一主站跳转构造器和 UTM 归因
- 商品详情只保留一个正文零售入口，再保留页脚入口
- 把批发和企业页的主站入口改成准确的个人自用说明

## 衡量方式

上线当天可以验证 HTTP、canonical、Schema、sitemap、主站链接、UTM 参数、桌面和移动端页面。搜索收录和 AI 引用需要持续观察。

建议在 Google Search Console 观察已发现 URL、已编入索引 URL、平台页查询和生成式搜索曝光。在 Bing Webmaster Tools 观察抓取和索引。主站统计按 `utm_campaign=retail_handoff` 查看货源站带来的访问、商品页浏览和订单转化。

## 不能自动保证的结果

- 搜索引擎不会因为一次发布立即收录全部页面
- GEO 没有可以保证引用的技术开关
- 货源站流量不等于零售订单，只有个人自用意图适合进入主站
- Search Console、Bing Webmaster Tools 和主站订单归因需要对应账号权限才能查看最终数据

## 主要来源

- [Google 生成式搜索优化指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google Breadcrumb 结构化数据指南](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [OpenAI 发布者与开发者说明](https://help.openai.com/en/articles/12627856)
- [Bing IndexNow 说明](https://www.bing.com/indexnow/getstarted)
