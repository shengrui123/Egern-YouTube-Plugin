# Egern 模组

本仓库收录 Egern 原生 YAML 模组。

## 模组列表

| 模组 | 功能 | 订阅地址 |
| --- | --- | --- |
| 12306 去广告 | 过滤应用内推广及开屏广告字段 | [12306.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/12306.RemoveAds.Egern.yaml) |
| 彩云天气净化 | 去除广告与推广，保留旧版会员响应伪装 | [CaiYun.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/CaiYun.Clean.Egern.yaml) |
| 中国联通净化 | 屏蔽广告与营销请求，精简首页及我的页面 | [ChinaUnicom.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/ChinaUnicom.Clean.Egern.yaml) |
| 航旅纵横净化 | 清理开屏、推广、榜单及部分会员入口 | [Umetrip.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Umetrip.Clean.Egern.yaml) |
| 豆瓣开屏去广告 | 拦截豆瓣自有及腾讯优量汇开屏广告 | [Douban.AdBlock.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Douban.AdBlock.Egern.yaml) |
| YouTube & Music 增强 | YouTube 去广告、底栏精简、字幕及歌词翻译 | [YouTube.Enhance.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Enhance.Egern.yaml) |

## 安装

1. 在 Egern 的「工具 → 模组」中添加上表对应的 YAML 原始文件 URL。
2. 安装并完全信任 Egern 的 MITM CA 证书。
3. 启用模组后重新打开相应 App。

## 12306 去广告

模组参考 RuCu6 与可莉发布的 Loon 插件转换。广告列表使用 Egern 原生响应 JQ 删除开屏相关字段；应用内推广请求使用原生请求脚本读取 `operation-type`，命中已知操作时调用 `ctx.abort()` 中止。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/12306.RemoveAds.Egern.yaml
```

当前处理范围：

- 删除 `ad.12306.cn/ad/ser/getAdList` 响应顶层的 `materialsList` 和 `advertParam`。
- 拦截活动横幅、铁路会员常见问题、首页热门资讯、商品信息流及支付成功页商业推广请求。
- 保留原插件对 `ad.12306.cn` 使用 `DIRECT` 的行为，以便广告响应能够到达 JQ 净化阶段。
- 未列入的 `operation-type` 原样放行，避免影响登录、购票、订单、支付等其他请求。
- 接口或请求头名称变化后可能失效；尚未进行 Egern / 铁路 12306 真机验证。
- 请勿与其他处理相同接口的 12306 去广告模组同时启用。验证时不要进行不必要的实际购票或支付。

来源与规范：

- 参考插件：https://kelee.one/Tool/Loon/Lpx/12306_remove_ads.lpx
- 原脚本作者：https://github.com/RuCu6/QuanX
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern 消息体重写：https://egernapp.com/docs/configuration/body_rewrites/
- Egern 脚本：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/

## 彩云天气净化

模组按 Egern 当前原生 YAML 与 JavaScript API 转换，配套脚本使用 `export default async function(ctx)`、`ctx.request`、`ctx.response` 和原生响应返回值，不依赖 Loon/Surge 的 `$request`、`$response` 或 `$done`。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/CaiYun.Clean.Egern.yaml
```

功能与限制：

- 保留源插件的广告接口拦截、活动与首页推广清理、消息中心与雨季弹窗清理、发现页过滤，以及 AI 标签关闭响应。
- 保留源插件的本地会员响应伪装，并兼容补充的 `vip_info` 接口；它不产生真实订阅，也不能保证服务端付费功能可用。
- 原作者限定会员逻辑需要登录且彩云天气版本不高于 7.20.2；新版 Pro 或接口结构变化后可能失效。
- 配套脚本对缺失字段及无效 JSON 做了保护；尚未在 Egern / 彩云天气真机环境验证。
- 请勿与其他处理相同彩云天气接口的去广告或会员脚本同时启用。

来源与规范：

- 源插件：https://raw.githubusercontent.com/shengrui123/Loon-YouTube-Plugin/refs/heads/main/CaiYun.Clean.Loon.plugin
- 原规则及脚本：https://github.com/ddgksf2013/Rewrite 与 https://github.com/ddgksf2013/Scripts
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern 脚本：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/
- Egern URL 重写：https://egernapp.com/docs/configuration/url_rewrites/

## 中国联通净化

模组使用 Egern 原生 `env_schema` 提供九个设置开关，并通过两个原生脚本分别处理请求拦截与 JSON 响应净化。未设置开关时，脚本会使用与源插件一致的默认值。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/ChinaUnicom.Clean.Egern.yaml
```

默认效果与限制：

- 拦截 `ad.10010.com` 及其子域名，屏蔽已知营销、新人专享和首页瀑布流请求。
- 清空搜索热词，移除首页背景、商城及权益底部配置，并净化已知“我的”页面推广。
- 钱包、积分、彩铃默认保留，可在模组设置中分别隐藏。
- “我的页面推广”会清空两个目标接口的整个对象型 `data`，可能隐藏同模块的其他信息。
- 接口来自公开规则及既有抓包说明，并非当前联通 App 的实时抓包；尚未进行 Egern / 中国联通真机验证。
- 请勿与其他处理相同联通接口的净化模组同时启用。测试时应检查登录、余额查询和充值入口，但不要为验证模组执行实际付款。

来源与规范：

- 源插件：https://raw.githubusercontent.com/shengrui123/Loon-YouTube-Plugin/refs/heads/main/ChinaUnicom.Clean.Loon.plugin
- 接口参考：https://raw.githubusercontent.com/ddgksf2013/Rewrite/refs/heads/master/AdBlock/ChinaUnicomAds.conf
- Egern 模组与设置：https://egernapp.com/docs/configuration/modules/
- Egern 脚本：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/
- Egern 规则：https://egernapp.com/docs/configuration/rules/

## 航旅纵横去广告与净化

模组固定了源插件 2026.09.11.4 的算法快照，并改用 Egern 原生二进制接口：通过 `ctx.response.arrayBuffer()` 读取响应，根据请求头或载荷中的 RPID 选择净化逻辑，最后返回 `Uint8Array`。运行时不会下载或执行 Loon/Quantumult X 脚本。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Umetrip.Clean.Egern.yaml
```

净化范围与限制：

- 清理已知开屏载荷、首页广告卡片、营销礼包和部分推广入口。
- 过滤首页瀑布流中的特价机票、酒店、租车、权益及攻略推广。
- 清理行程横幅、历史行程、航班详情、家人守护及我的页面中的部分会员推广。
- 按结构过滤动态榜单、我的页面推广入口及底部“经验”导航；这些扩展缺少真实响应样本，不能保证当前版本生效。
- 仅处理已知 RPID 和结构；未知 RPID、损坏载荷、非 200 响应及未修改内容均原样放行。
- 隐藏会员推广不会改变服务端权限。请勿与其他处理相同航旅纵横接口的模组同时启用。
- 尚未进行 Egern / 航旅纵横真机验证；分享抓包样本前应清除 Cookie、Token 和个人行程信息。

来源与规范：

- 源插件：https://raw.githubusercontent.com/shengrui123/Loon-YouTube-Plugin/refs/heads/main/Umetrip.Clean.Loon.plugin
- 原规则：https://ddgksf2013.top/rewrite/UmetripAds.conf
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern 脚本：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/

## 豆瓣开屏去广告

模组按实际抓包规则阻断豆瓣开屏配置、展示回调、广告素材与腾讯优量汇广告链。腾讯 HTTPDNS 入口也被拦截，避免广告 SDK 用 IP 绕过域名规则。

请勿与其他处理相同豆瓣接口的去广告模组同时启用。当 App 更换广告接口或 SDK 时，规则可能需要更新。

## YouTube & Music 增强

按 2026-09-13 查询到的 Egern 官方文档转换，包含一个 YAML 模组和五个配套 JavaScript 文件。不是把 Loon 配置换扩展名：四个上游脚本均封装成 `export default async function(ctx)`，通过 `ctx.env`、`ctx.storage`、`ctx.http` 和原生返回值运行。

### 安装与设置

模组已经指向本仓库的配套脚本，可直接使用以下地址导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Enhance.Egern.yaml
```

安装步骤：

1. 在 Egern 的「工具 → 模组」中添加上面的 YAML 原始文件 URL。
2. 在模组设置中调整字幕、底栏和歌词选项。未设置的选项由脚本提供默认值。
3. 确保 Egern 的 MITM CA 证书已安装并完全信任，然后重新打开 YouTube / YouTube Music。

如需镜像到自己的仓库，请同时复制 YAML 和 `scripts` 目录，并将 `SCRIPT_BASE` 改为新仓库中 `scripts` 的完整 HTTPS 地址。

### 默认行为和范围

- 视频字幕目标为简体中文；关闭字幕翻译选 `captionLang: off`。
- 移除上传、Music 选段和 Shorts 底栏入口；歌词翻译开启，Google 翻译，原文在前，同时显示译文。
- 歌词翻译沿用上游的中文目标语言；`captionLang` 只控制视频字幕。
- `Type`、`Types`、`AutoCC` 等保留原插件传参范围。原插件仅对 browse 请求调用 DualSubs，所以 `AutoCC` 不会额外为视频播放器添加自动字幕处理。
- 歌词关闭后，两个歌词脚本会在读取请求体前直接放行。普通 browse 仍由 Maasea 响应脚本处理。
- 不要同时启用其他处理相同接口的 YouTube 去广告、字幕或歌词模组。
- 主体处理上限明确设为 10 MiB，超出部分不处理；脚本超时 30 秒，适配层在 28 秒时尝试原样放行。
- 保留原插件的广告匹配、HTTP 200 空响应及 1×1 图片返回，并将 `redirector*.googlevideo.com` 放进 MITM 排除列表。

### 上游依赖

本包固定了转换时下载的脚本快照，不会在每次拦截时下载或执行新的远程代码。更新上游需要重新生成配套脚本；Egern 的资源刷新不会自动把这些快照升级为上游最新版。

- 原插件：https://raw.githubusercontent.com/shengrui123/Loon-YouTube-Plugin/refs/heads/main/YouTube.Enhance.Loon.plugin
- Maasea 响应：https://raw.githubusercontent.com/Maasea/sgmodule/master/Script/Youtube/youtube.response.js
- Maasea 请求：https://raw.githubusercontent.com/Maasea/sgmodule/master/Script/Youtube/youtube.request.js
- DualSubs 歌词请求：https://github.com/DualSubs/YouTube/releases/download/v1.5.11/request.bundle.js
- DualSubs 歌词响应：https://github.com/DualSubs/Universal/releases/latest/download/Translate.response.bundle.js （下载内容标注 v1.7.5）

保留上游 protobuf 和翻译逻辑；Maasea 实例初始化补入 `debug` 参数。原脚本已有的 `init-stream.maasea.workers.dev` 播放处理依赖和外部翻译服务也被保留，因此相应功能仍依赖这些服务可用。

### 验证范围

已完成 YAML 解析、全部脚本路径检查、正则编译、普通响应与翻译响应互斥检查，以及 Node 模拟 Egern ctx 的脚本测试：protobuf / JSON 歌词请求、普通 browse、关闭歌词、Official 类型、歌词响应入口、事件请求主体、空播放器 protobuf、GIF 返回。

尚未在 Egern 真机导入，未验证真实 YouTube 广告样本、画中画、后台播放或在线翻译服务。模拟测试不能替代客户端及服务端的端到端验证。

规范依据：

- https://egernapp.com/docs/configuration/modules/
- https://egernapp.com/docs/configuration/scriptings/
- https://egernapp.com/docs/configuration/env/
- https://egernapp.com/docs/javascript-api/
- https://egernapp.com/docs/configuration/example/

## Telegram 更新通知

`main` 分支上线新模组或更新现有模组及其配套脚本时，GitHub Actions 会自动向 Telegram 频道发布通知。详见 [TELEGRAM.md](TELEGRAM.md)。
