# Egern 模组

本仓库收录 Egern 原生 YAML 模组。

## 模组列表

| 模组 | 功能 | 订阅地址 |
| --- | --- | --- |
| 12306 去广告 | 过滤应用内推广及开屏广告字段 | [12306.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/12306.RemoveAds.Egern.yaml) |
| 支付宝小程序开屏去广告 | 清空小程序广告推荐并拦截广告管理素材 | [Alipay.MiniApp.SplashAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Alipay.MiniApp.SplashAds.Egern.yaml) |
| 高德地图去广告 | 清理开屏、搜索、路线、导航及打车页推广 | [Amap.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Amap.RemoveAds.Egern.yaml) |
| 彩云天气净化 | 去除广告与推广，保留旧版会员响应伪装 | [CaiYun.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/CaiYun.Clean.Egern.yaml) |
| 中国联通净化 | 屏蔽广告与营销请求，精简首页及我的页面 | [ChinaUnicom.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/ChinaUnicom.Clean.Egern.yaml) |
| 航旅纵横净化 | 清理开屏、推广、榜单及部分会员入口 | [Umetrip.Clean.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Umetrip.Clean.Egern.yaml) |
| 哔哩哔哩去广告 | 清理开屏、信息流、动态、评论、搜索与直播间广告 | [Bilibili.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Bilibili.RemoveAds.Egern.yaml) |
| 哔哩哔哩漫画去广告 | 清理开屏、横幅、推荐内容并精简首页及“我的”页面 | [BiliComic.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/BiliComic.RemoveAds.Egern.yaml) |
| Spotify 去广告与界面修复 | 去除已知广告请求、恢复列表并提供界面设置 | [Spotify.RemoveAds.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Spotify.RemoveAds.Egern.yaml) |
| 豆瓣开屏去广告 | 拦截豆瓣自有及腾讯优量汇开屏广告 | [Douban.AdBlock.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Douban.AdBlock.Egern.yaml) |
| YouTube & Music 增强 | YouTube 去广告、底栏精简、字幕及歌词翻译 | [YouTube.Enhance.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Enhance.Egern.yaml) |
| Apple Intelligence 分流 | Apple Intelligence、PCC、Siri 与系统搜索分流，同时排除 HTTPS 解密 | [AppleIntelligence.Egern.yaml](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/AppleIntelligence.Egern.yaml) |

## 安装

1. 在 Egern 的「工具 → 模组」中添加上表对应的 YAML 原始文件 URL。
2. 安装并完全信任 Egern 的 MITM CA 证书。
3. 启用模组后重新打开相应 App。

## Apple Intelligence 分流

这套配置提供两种用法：

- `AppleIntelligence.Egern.yaml` 是可直接导入的 Egern 模组，自带路由规则和 MITM 排除列表。
- `AppleIntelligence.RuleSet.Egern.yaml` 是纯 Egern 原生规则集，适合在主配置中用 `rule_set` 引用。

模组直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/AppleIntelligence.Egern.yaml
```

模组默认将命中流量交给名为 `PROXY` 的策略组。导入后打开模组设置，把 `POLICY` 改为你配置中真实存在的美国或其他 Apple Intelligence 可用地区策略组。节点需支持 UDP，否则 Private Cloud Compute 可能回落 TCP 或连接失败。

在主配置中引用纯规则集的示例：

```yaml
rules:
  - rule_set:
      match: https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/AppleIntelligence.RuleSet.Egern.yaml
      policy: PROXY
      update_interval: 86400
```

覆盖范围：

- Apple 官方列出的 Siri/听写、`smoot` 系统搜索、Private Cloud Compute 的 Cloudflare/Fastly 入口，以及 Apple Intelligence Extensions 中继。
- 额外收录社区实测常用的 `gspe1-ssl.ls.apple.com` 地区可用性检查和 `apple-relay.mask.apple-dns.net` 新版中继名称。
- 不使用 `DOMAIN-KEYWORD,siri`、整个 `ls.apple.com`、整个 `icloud.com` 或整个 `apple-dns.net` 等过宽规则，避免将定位、iCloud 与其他 Apple 服务一并代理。
- 不包含通用系统更新/CDN 域名；Apple Intelligence 本地模型的下载属于 Apple 通用资产分发，把大体积资产强制走境外节点并不会带来解锁效果。
- Apple 官方明确要求不得对这些服务执行 HTTPS/SSL 内容检查；模组已将相关主机放入 MITM 排除列表。如只用纯规则集，请在现有 MITM 配置中手动排除它们。
- 分流规则只决定网络出口，不能绕过机型、系统版本、Apple 账号、设备地区、语言或 Apple 服务端的资格限制。

来源与规范：

- Apple 企业网络主机清单：https://support.apple.com/en-us/101555
- 社区兼容项参考：https://ruleset.skk.moe/List/non_ip/apple_intelligence.conf 与 https://github.com/MetaCubeX/meta-rules-dat/blob/meta/geo/geosite/apple-intelligence.list
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern 规则与规则集：https://egernapp.com/docs/configuration/rules/

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

## 支付宝小程序开屏去广告

这是一个保守范围的 Egern 原生模组：用 Map Local 为阿里妈妈小程序广告推荐接口返回 `{"data":{"result":[]}}`，并用 URL Rewrite 拦截路径中明确标记为 `ad_mgr` 的广告素材。没有拦截整个淘宝、支付宝或支付宝 CDN 域名。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Alipay.MiniApp.SplashAds.Egern.yaml
```

使用说明与限制：

- 安装并完全信任 Egern 的 MITM CA 证书，启用模组后彻底退出并重新打开支付宝。
- 首次验证可打开此前会展示广告的小程序；已经缓存的开屏素材可能需要清理支付宝缓存后才能消失。
- 模组不拦截支付、登录、收银台、普通小程序包或通用图片资源，降低白屏和核心功能误伤风险。
- 不同小程序可能使用自有广告接口，因此本模组不能保证覆盖所有第三方小程序广告。
- 规则来自公开配置而非本机实时抓包，尚未进行 Egern / 支付宝真机验证。若未生效，需要目标小程序名称以及去除身份信息后的请求 URL 继续适配。
- 请勿与其他大范围支付宝或小程序去广告规则同时启用，以免无法判断白屏或加载失败的来源。

来源与规范：

- 公开规则参考：https://github.com/xingjian2566/Surge/blob/main/AD/Module/Alipay.sgmodule
- Egern 模组与 Map Local：https://egernapp.com/docs/configuration/modules/ 与 https://egernapp.com/docs/configuration/example/
- Egern URL 重写：https://egernapp.com/docs/configuration/url_rewrites/

## 高德地图去广告

模组参考 RuCu6、kelv1n1n 与可莉维护的 Loon 插件转换，使用 Egern 原生规则、Body Rewrite、Map Local 和 `ctx` 响应脚本。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Amap.RemoveAds.Egern.yaml
```

当前处理范围：

- 移除开屏、搜索热词与搜索结果推广、路线规划和导航结束页推广、酒店及附近页推广。
- 清理首页卡片、活动图层、天气与消息推广，并精简“我的”页面。
- 清空底部“AI / 长按说话”与“打车”入口相关的 AOCS 远程配置，并兼容新版 `updatable` 接口后缀。
- AOCS `updatable` 保留原始响应并交由脚本定点清理，避免 Map Local 提前返回空对象而跳过 AI / 打车配置处理。
- 清理打车页营销皮肤、优惠弹窗、红点、天气图标和订单推荐卡片。
- 保留登录卡片、继续导航、常去地点、关联车辆位置和订单卡片等源脚本明确保留的功能。
- 底栏是高德 App 的原生控件，Egern 只能清空它依赖的服务端配置，无法直接修改视图树；若高德改为本地强制展示，Tab 可能仍保留但对应远程功能不再下发。
- 域名及接口规则沿用源插件的精确范围；尚未进行 Egern / 高德地图真机验证。导航或打车前建议先验证常用路线，请勿同时启用其他高德去广告模组。

来源与规范：

- 参考插件：https://kelee.one/Tool/Loon/Lpx/Amap_remove_ads.lpx
- 原脚本来源：https://github.com/RuCu6/Loon
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern URL 重写与 Map Local：https://egernapp.com/docs/configuration/url_rewrites/ 与 https://egernapp.com/docs/configuration/example/
- Egern 脚本与 API：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/

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

## 哔哩哔哩去广告

模组参考可莉发布的 Loon 插件与 kokoryh/Sparkle 当前实现转换。JSON、网页与本地响应逻辑使用 Egern 原生 API；Protobuf 处理脚本增加了 Egern `ctx` 适配与原生 gzip 解压，并移除了源实现中会修改会员或付费播放能力的路由。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Bilibili.RemoveAds.Egern.yaml
```

当前处理范围：

- 移除开屏广告、首页及 Story 信息流广告、动态和热门页推广、搜索广告、互动弹幕、置顶评论广告、相关推荐广告与直播间推广。
- 精简首页顶部与底部导航；不会修改账号真实会员状态。
- 可在模组设置中调整动态页“最常访问”、评论广告过滤、请求优化、直播活动网页净化与日志等级。
- 空降助手默认关闭；启用后会访问 `bsbsb.top`，并使用 `kokoryh/chronos` 的第三方跳过数据，可能不准确、失效或产生额外网络请求。
- 不包含源插件中的大会员状态伪装，也不启用后台播放、投屏、试看提示修改等付费能力相关逻辑。
- 需要安装并完全信任 Egern 的 MITM CA；建议启用 HTTP/2。尚未进行 Egern / 哔哩哔哩真机验证，请勿与其他处理相同接口的哔哩哔哩模组同时启用。

来源、许可与规范：

- 参考插件：https://kelee.one/Tool/Loon/Lpx/Bilibili_remove_ads.lpx
- Protobuf 原实现：https://github.com/kokoryh/Sparkle（GPL-3.0；详见 `LICENSES/GPL-3.0.txt`）
- Egern 模组：https://egernapp.com/docs/configuration/modules/
- Egern 脚本与 API：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/
- Egern URL 重写：https://egernapp.com/docs/configuration/url_rewrites/

## 哔哩哔哩漫画去广告

模组参考可莉发布的 Loon 插件转换。广告与推荐接口使用 Egern 原生 Map Local 返回空 JSON，界面净化脚本使用 `export default async function(ctx)` 和 Egern 原生响应对象。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/BiliComic.RemoveAds.Egern.yaml
```

当前处理范围：

- 屏蔽活动标签、气泡、通用横幅、搜索横幅、赛季活动、书架与小说推荐、应用初始化广告和开屏素材接口。
- 移除首页“新人”“新作”“商城”标签。
- 移除“我的”页面中的“漫画商城”“超漫俱乐部”和“看漫免流量”。
- 不修改会员、已购漫画、付费章节、漫币、优惠券或订阅状态。
- 需要安装并完全信任 Egern 的 MITM CA；尚未进行 Egern / 哔哩哔哩漫画真机验证，请勿与其他处理相同接口的模组同时启用。

来源与规范：

- 参考插件：https://kelee.one/Tool/Loon/Lpx/BiliComic_remove_ads.lpx
- Egern 模组与 Map Local：https://egernapp.com/docs/configuration/modules/ 与 https://egernapp.com/docs/configuration/example/
- Egern 脚本与 API：https://egernapp.com/docs/configuration/scriptings/ 与 https://egernapp.com/docs/javascript-api/

## Spotify 去广告与界面修复

模组参考 001ProMax 发布的 Loon 插件，使用 Egern 原生规则、Header 模式 URL Rewrite 与二进制响应脚本。原插件脚本还包含 Premium、离线播放和许可证等付费权益伪装；本适配只保留广告标志与两个界面设置，没有复制这些付费权益修改。

直接导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Spotify.RemoveAds.Egern.yaml
```

功能与限制：

- 拦截 `/pendragon/` 广告请求，并阻止 Spotify 域名使用 QUIC，使 HTTPS 处理能够命中。
- 将歌手页的 iPhone 平台请求透明改写为 iPad 平台，用于恢复歌手和专辑列表展示。
- 在 Bootstrap / User Customization Protobuf 响应中仅设置 `ads=false`。
- 可在模组设置中选择移除底栏创建按钮，以及启用或关闭 Apple 设备接力；修改后通常需要重新登录 Spotify。
- 不解锁 Premium、离线播放、任意点播或其他付费功能，也不会改变真实订阅状态。
- Spotify 接口或 Protobuf 结构变化后可能失效；尚未进行 Egern / Spotify 真机验证。
- 请勿与其他处理相同 Spotify 接口的去广告或账号修改模组同时启用。

来源与规范：

- 参考插件：https://kelee.one/Tool/Loon/Lpx/Spotify_remove_ads.lpx
- 原作者：https://github.com/001ProMax
- Egern 模组与设置：https://egernapp.com/docs/configuration/modules/
- Egern 规则：https://egernapp.com/docs/configuration/rules/
- Egern URL 重写：https://egernapp.com/docs/configuration/url_rewrites/
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
