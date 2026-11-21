# 微信读书精简 · Maasea Egern 适配

转换自 [WeRead.sgmodule](https://github.com/Maasea/sgmodule/blob/master/WeRead.sgmodule) 及配套 [weread.js](https://github.com/Maasea/sgmodule/blob/master/Script/WeRead/weread.js)。原作者 Maasea；Egern 适配 shengrui123。源文件原样保留在 upstream，2026-11-22 快照 SHA-256 见 upstream.json。

## 安装

在 Egern 模组中添加：

https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/WeRead.Clean.Egern.yaml

脚本自动加载，无需导入 Quantumult X 链接。开启 HTTPS 解密，安装并完全信任 Egern CA，然后重新打开微信读书。不要与处理相同接口的模组重复启用。

原作者测试环境为关闭微信读书通知、禁止其获取微信好友权限；这些系统权限需在手机设置中自行调整，模组不会修改。

## 保留功能

- book/readingstat：清空读者及推荐用户、阅读统计，markedStatus 设为 1。
- book/readingStat：清空混合读者列表及阅读统计，保留原脚本与小写接口的区别。
- book/chapterReview：返回 synckey=0、shareCount=0。
- groups/readerEntrance：返回当前秒级 synckey、hasGroup=0，隐藏圈子入口提示。
- review/list：返回空评论列表、总数和相关用户列表。这会隐藏评论内容，并非仅去掉广告。
- user/profile：关闭勋章、评论及兑换相关展示，保留其他响应字段。
- mobileSync：清零底栏红点、通知和发现/故事/好友书评更新相关字段，保留其他字段。

这是界面与社交提示精简模组，不提供通用广告过滤、会员伪装或付费书籍解锁。原脚本还有 discoverfeed/new 与 discoverfeed/get 分支，源 sgmodule 未启用对应 URL；适配文件保留这些处理分支，但 YAML 与原模组一致不启用它们。

## Egern 适配及限制

使用 Egern 原生 export default async function(ctx)、ctx.request.url、ctx.response.text() 和原生返回值，运行时不依赖 Surge/QX 的全局变量，也不下载执行新的上游代码。MITM 仅包含 i.weread.qq.com，匹配正则与源模组保持一致。

新增非 200 响应放行和异常保护；需要解析 JSON 的分支遇到损坏正文时保留原正文。修改正文时删除旧 Content-Length。阅读统计、圈子、章节书评和评论列表按原脚本替换整个响应，其余分支仅改指定字段。源配置 max-size=0 在 Surge 表示不限制，适配明确设为 4 MiB，超出部分不处理；未将该数值直接复制到 Egern。

已完成 YAML 解析、全部启用/未启用 URL 范围检查、7 个启用接口变体与原脚本的输出对照，以及字段保护、无效 JSON、非 200 和响应头检查。尚未在 Egern / 微信读书真机验证；客户端接口变化或本地缓存可能使效果不同。

生成：`python3 WeRead.Egern/build.py`

检查：`node WeRead.Egern/test.mjs`

语法依据：[Egern 脚本](https://egernapp.com/docs/configuration/scriptings/)、[JavaScript API](https://egernapp.com/docs/javascript-api/)。
