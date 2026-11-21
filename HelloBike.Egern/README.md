# 哈啰净化 · ZenmoFeiShi Egern 适配

完整转换 [helloobike.snippet](https://github.com/ZenmoFeiShi/Qx/blob/main/helloobike.snippet) 及其 [easybike-ad.js](https://github.com/ZenmoFeiShi/Qx/blob/main/easybike-ad.js)。原作者 TG@ZenMoFiShi；Egern 适配 shengrui123。源配置更新于 2026-11-06，下载快照于 2026-11-21。源文件原样保存在 upstream，SHA-256 见 upstream.json。

## 安装

在 Egern 模组中添加：

https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/HelloBike.Clean.Egern.yaml

配套脚本自动加载。开启 HTTPS 解密，安装并完全信任 Egern CA，然后彻底退出并重新打开哈啰。不要同时启用处理相同接口的其他哈啰净化模组。

如果收到“已捕获本机动态密钥”提示，重新进入首页和我的页面；如果界面仍未净化，可重启哈啰，让 App 再次请求 secretkey。动态密钥保存在 Egern 本机存储，不上传仓库。缺失、过期或版本/指纹不匹配的密钥不会用于解密，相关响应原样放行。

## 转换范围

- 4 条广告 URL 拦截：倍孜、Sigmob、优量汇，返回 HTTP 200 空响应。
- 5 条脚本规则：本地样式模板响应、secretkey 动态密钥捕获、API 请求阶段、API 响应阶段、顺风车响应阶段。
- 10 个 MITM 主机完整保留。
- 保留加解密、请求 action/pageId/pageCode 校验、动态密钥轮换与过期检查、64 位数字原文保护、模板 MD5/SHA-256 校验。
- 清理广告素材、指定营销弹窗、首页/我的页推荐流、借钱入口、会员领券横条、我的页推广宫格/推荐/奖励金/接单券提醒及钱包金融整排，以及车主接单列表会员推广卡片。

源脚本中的结构和标识检查完整保留；未知结构不会盲目删除。模板只为带指定 md5 与 hbe_qx_ui=1.3 的请求提供本地 JSON；校验失败返回 503，不从远端下载替代模板。隐藏入口与推广不会修改账号余额、会员或实际权益。

## Egern 适配

使用原生 `export default async function(ctx)` 入口，读取 ctx.request / ctx.response，原处理核心与内置 CryptoJS 固定打包。QX prefs 通过 ctx.storage 适配，所有键加 HelloBike.Egern. 前缀；通知通过 ctx.notify 适配。本地模板使用请求脚本的 ctx.respond，普通响应返回原生 body/headers。

Egern 文档在响应脚本中提供 ctx.request 与其 text() 方法，因此直接读取对应请求正文供原脚本校验 action/pageId/pageCode，不伪造 QX sessionIndex，也不跨请求猜测业务。请求阶段保留原正文；QX 的 sessionIndex 缓存不在 Egern 中生成。此部分需要真机确认 Egern 能在响应阶段提供请求正文；若正文不可用，相关普通 API 净化会保守放行，而非按响应形状猜测。

修改响应时删除旧 Content-Length，其他响应头保留。处理异常、解密失败或不匹配时保留正文。运行时不下载或动态执行上游代码；上游完整脚本内嵌在配套文件中。CryptoJS 内置版权声明随源文件保留。

## 验证与限制

已验证：YAML、4 条拦截/5 条脚本/10 个 MITM 主机数量、全部正则编译；10 类样本在明文/AES/带引号密文下与原 QX 脚本逐一对照；动态密钥捕获/使用/不匹配、本地模板哈希/503、车主推广、64 位 ID、未知 action、无效正文、非 200 响应及请求正文保留。

尚未进行 Egern / 哈啰真机导入、开屏、骑行、打车、订单或支付验证。源接口、密钥格式、模板和客户端结构变化后可能失效。首次进入时若尚未捕获新动态密钥，部分推广可能仍然显示。已缓存素材可能继续显示。

生成：`python3 HelloBike.Egern/build.py`

验证：`node HelloBike.Egern/test.mjs`

依据：[Egern JavaScript API](https://egernapp.com/docs/javascript-api/)、[脚本配置](https://egernapp.com/docs/configuration/scriptings/)。
