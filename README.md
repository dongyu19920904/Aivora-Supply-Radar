## 爱窝啦 AI 货源雷达

1. **项目定位**：面向 AI 账号买卖双方的货源目录与报价追踪站，网址 supply.aivora.cn。

2. **域名策略**：workers.dev 地址留作备用，所有正式链接用主域名。

3. **本地开发**：所有命令用 D 盘缓存脚本跑，`wrangler dev` 自动建表不用手动迁移。

4. **验证流程**：按顺序跑 lint、typecheck、test、build、dry-run 五步检查。

5. **商家 Feed**：商家提 HTTPS JSON，每次最多 500 条，格式和价格库存都会校验，单个来源出错不影响其他来源。

6. **审核机制**：投稿先进待审队列，只有 GitHub Actions 有权审核和同步，前端拿不到管理密钥。

</br>

---

**📢 关于 AI日报 的一次小调整**
>
坦白说，想要长久地把**AI日报**做下去，单靠“为爱发电”确实面临现实压力。为了更有热情的**投入精力**，我在网站接入了少量 Google 广告。
>
由于 RSS 无法展示广告带来收入，即日起 RSS 将**试运行“摘要模式”一段时间**。
>
**💡 您的每一次点击，都是对我最大的支持**
诚挚邀请您移步官网阅读全文。那里不仅有更舒适的**排版**和清晰的**代码高亮**，还能在评论区与大家交流。
>
感谢您的理解与陪伴，让我们一起走得更远！
>
👇 **点击下方链接，阅读今日完整资讯**
### [🚀 前往官网查看完整版 (ai.hubtoday.app)](https://ai.hubtoday.app/)
>
<small>如有建议，欢迎随时邮件沟通：[justlikemaki@foxmail.com](mailto:justlikemaki@foxmail.com)</small>
<br/>
<small>或直接扫码进群提供建议:</small>
<br/>
![进群-何夕2077AI日报问题反馈](https://source.hubtoday.app/logo/wechat-qun-ex2.jpg)

    