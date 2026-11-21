# 中国移动 · Yuheng Egern 适配

来源：[Yuheng0101/X NoAds.js](https://github.com/Yuheng0101/X/blob/main/Scripts/ChinaMobile/NoAds.js)。保留原作者版权及仅供学习研究、禁止商业用途的声明，完整声明在 upstream/NoAds.js 及生成脚本中。

2026-11-21 下载快照，SHA-256：`26d560b8c5fa038bc0f8f0ac751b1739e72b3c9d228a1bee064c420bfb5c76dd`。

## 安装

在 Egern 模组中添加或手动更新：

https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/ChinaMobile.SplashAds.Egern.yaml

描述应显示“v3 · Yuheng 加密响应适配版”。启用 HTTPS 解密，安装并完全信任 Egern CA，停用其他中国移动去广告模组后重启中国移动。脚本地址已配置，无需单独导入 Quantumult X 链接。

## 实现与范围

使用 Egern 原生 `export default async function(ctx)` 入口，将响应正文和 `x-pen` 交给固定快照中的原处理逻辑。原脚本内置 AES-CBC / PKCS7，支持 x-pen 1 的 JSON body 封装及 x-pen 2 的直接密文；修改后按原格式重新加密，不返回未经加密的伪造启动响应。

处理启动页、首页下拉、悬浮、首页区域、办理横幅及我的页弹窗配置；按源规则对 popupWindow/getDetail 返回 HTTP 200 空响应。开屏处理清空 startImgurl/actionUrl，并修改 sdkAdWaitTime 等原脚本字段。范围包含其他页面的推广清理，可能隐藏对应入口。源脚本说明不处理链接不固定的内部 H5 活动。

旧版 v2 的启动空响应及资源目录规则已移除，防止抢先拦截响应；MITM 仅保留源规则的两个主机。HTTP 非 200 不处理，空正文、解密错误、原脚本提前结束或处理异常时保留原正文。修改正文时保留 x-pen 等响应头并删除旧 Content-Length。

## 验证与限制

`node ChinaMobile.Yuheng.Egern/test.mjs`：使用 Node AES 生成两种格式的加密样本，运行实际打包脚本，再独立解密核对开屏字段、下拉、悬浮与弹窗处理，并检查错误码、损坏密文、空正文及非 200 响应。另检查 YAML 和 URL 匹配范围。

尚未在 Egern / 中国移动 12.5.7 真机验证；该版本只有用户反馈，没有真实响应样本。若密钥、x-pen 或数据结构变化，原算法可能失效。已有缓存可能继续展示，成功的合成测试不代表真机去广告已成功。

生成：`python3 ChinaMobile.Yuheng.Egern/build.py`。上游代码内嵌于生成文件，运行时不请求上游、不使用 eval 或 Function 动态执行。
