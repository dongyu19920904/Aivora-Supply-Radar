# 爱窝啦·货源雷达 SEO 与 GEO 修改方案

日期 2026-09-02

## 目标

让货源站获得 AI 账号卖家相关搜索和 AI 推荐流量，同时把明确的个人自用需求交给爱窝啦·AI账号店。货源站首页、导航和核心模块继续只面向卖家。零售入口只出现在页脚和高意图页面，不把货源站改成零售商城。

## 第一阶段建立平台主题页

新增统一的平台主题配置，首批覆盖 ChatGPT、Claude、Gemini、Grok 和 AI 编程。配置包括独立标题、页面说明、核价重点、分类 ID 和已核验的主站零售商品页。

新增 `/platforms/[slug]` 页面。页面从现有实时标准商品数据读取统计，不复制或另建价格库。每个页面提供这些公开内容。

- 平台标准商品数量
- 当前可采购商品数量
- 当前公开报价数量
- 当前最低公开参考
- 最近一次报价更新时间
- 平台内标准商品列表
- 卖家核价的三项检查
- 条件明确的个人自用零售入口

未知平台返回 404。五个页面使用独立 metadata 和自引用 canonical。

## 第二阶段补齐内部链接和 sitemap

首页增加“热门平台核价”区块，直接链接五个主题页。标准商品页在 H1 和页面说明之后增加平台主题入口，保留原有分类筛选。

sitemap.xml 增加五个主题页。平台页距离首页不超过一次点击，也可以从标准商品页进入。

## 第三阶段统一 Schema

全站 Organization 改为爱窝啦·AI账号店，实体 ID 使用 `https://www.aivora.cn/#organization`。货源站继续使用独立 WebSite 实体，publisher 指向主站组织，audience 写明 AI 账号卖家和数字商品渠道商。

平台页输出 CollectionPage、ItemList 和 BreadcrumbList。ItemList 只列出页面当前可见的标准商品，不虚构价格或库存。

账号商机日报补齐 image、author、publisher、isPartOf、inLanguage 和页面实体 ID。发布日期与更新时间同时显示在正文标题区。

## 第四阶段重做零售意图交接

建立一个主站链接构造器。所有链接都从 2026-09-02 的主站 sitemap 中核验过的地址生成，并增加这些归因参数。

- `utm_source=supply.aivora.cn`
- `utm_medium=referral`
- `utm_campaign=retail_handoff`
- `utm_content` 记录页脚、平台或商品来源

建立统一的个人自用提示组件。文案明确说明货源页继续服务卖家核价，个人自用访客可以进入主站查看零售商品和交付说明。

商品详情删除重复的桌面推荐位，只保留一个响应式正文入口。空白广告位不再占据主要内容。页脚入口改成“个人自用零售入口”。每个页面最多保留两个主站链接。

批发页和企业经营页不再把主站描述成补货或企业履约支持。链接保留时明确写个人自用零售入口。

## 第五阶段保护卖家定位

首页不恢复“新手买订阅”“AI 订阅买家”“买家找货”等已经移除的零售模块。平台主题页标题和首段继续以卖家货源、进货核价和库存判断为主。

零售说明只作为意图切换。页面不会把第三方最低价与主站售价混在一起，也不会让主站商品参与货源排序。

## 第六阶段回归测试

新增 SEO 与 GEO 单元测试，覆盖这些边界。

- 五个平台 slug、分类和 metadata 配置唯一
- 平台分类只选择对应标准商品
- 所有零售商品链接使用 `www.aivora.cn` HTTPS 地址
- 所有零售链接带固定 UTM 来源
- 平台页包含 CollectionPage、ItemList、BreadcrumbList 和自引用 canonical
- sitemap 包含全部平台页
- 首页仍然只面向 AI 账号卖家
- 商品详情不再同时输出桌面和移动端两个自营入口

继续运行 Supply V2 的完整测试、类型检查、lint 和生产构建。根项目运行完整测试、类型检查、内容检查、种子 dry-run 和 Wrangler dry-run 构建。

## 第七阶段发布和线上验收

只提交本任务文件，通过 SSH 推送任务分支和 `main`。部署工作流使用完整提交 SHA 构建并发布独立 V2 Worker，再切换 Pages 边缘层。

部署后检查这些项目。

- 首页和五个平台页返回 HTTP 200
- 平台页 title、description、H1、canonical 和 Schema 正确
- sitemap URL 数增加五个
- 商品页正文和页脚最多两个主站链接
- 零售链接指向已核验商品并带 UTM 参数
- OAI-SearchBot、Googlebot 和 Bingbot 没有被 robots.txt 屏蔽
- 桌面、约 390 像素手机、日间和夜间主题没有溢出或遮挡
- Pages 边缘层和 Worker 发布头等于本次提交 SHA

## 后续索引工作

Google Search Console 和 Bing Webmaster Tools 需要站点所有者权限。发布完成后，应在这两个平台提交 `https://supply.aivora.cn/sitemap.xml`，检查五个平台页的 URL Inspection 结果。

IndexNow 需要域名校验文件和密钥。本轮不在仓库生成虚假密钥，也不调用未配置的提交接口。取得 Bing 站点权限后再接入发布通知，避免把索引动作伪装成已经完成。

## 回滚

本轮保持单一 Supply 提交。页面或 Schema 出现问题时回滚该提交，再使用上一稳定 SHA `03c202925e084fddbf9bc048b175f6ec280fe386` 运行现有生产部署工作流。账号商机日报生成任务不参与本轮修改，也不会被触发。
