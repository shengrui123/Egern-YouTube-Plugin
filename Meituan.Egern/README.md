# 美团去广告 · ZenmoFeiShi Egern 适配

按用户提供的 Quantumult X 订阅 [MT.snippet](https://github.com/ZenmoFeiShi/Qx/blob/main/MT.snippet) 与配套 [MT.js](https://github.com/ZenmoFeiShi/Qx/blob/main/MT.js) 完整转换。原作者：TG@ZenMoFiShi；Egern 适配：shengrui123。

上游标注美团版本 `12.67.403`，更新日期 `2026.10.25`。快照下载于 2026-11-21；源文件原样保存在 upstream，SHA-256 见 upstream.json。

## 安装

在 Egern 模组中添加：

https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Meituan.RemoveAds.Egern.yaml

配套原生脚本已指向本仓库，无需单独添加。安装并完全信任 Egern 的 CA 证书，开启 HTTPS 解密，启用模组后重启美团。请勿与其他处理相同接口的美团规则重复启用。

## 完整转换范围

- 12 条精确域名、1 条域名通配、29 条 IPv4、4 条 IPv6 拒绝规则：保留上游 Shark、mquic、HTTPDNS 和 IP 拦截。
- 2 条 URL 拒绝：HTTPDNS 接口和指定 IP 的 `/fetch`。
- 8 个响应规则：底部导航、购物车与个人中心推荐流、我的页推荐、搜索默认词、搜索热词、助手技能配置、购物车顶部横幅、开屏图片。
- MITM 保留上游 7 个主机。全部响应规则共用一份已固定的 Egern 原生脚本。

底栏仅在同时存在 `homepage` 和 `mine` 时移除 `video`、`xiaotuan`，其他标签保留；推荐流清空仅限原脚本的两个场景。我的页仅移除 `mine_cross_recommend`。搜索处理清空已知默认词、热词模块和 AI 气泡；助手配置保留内嵌 JSON 字符串格式并清空 skills。购物车横幅和开屏处理覆盖根对象或 data 中的 resource / resourcesMap，不递归删除未知字段。

## 差异与限制

使用 `export default async function(ctx)`、`ctx.request.url`、`ctx.response.text()` 及原生响应返回值，不依赖 Quantumult X 全局变量，也不在运行时下载上游脚本。保留上游各接口的正则和顺序；QX host / host-wildcard / ip-cidr / ip6-cidr 分别映射为 Egern domain / domain_wildcard / ip_cidr / ip_cidr6，reject URL 映射为 Egern `http://reject/`。IP 规则沿用默认解析行为，未额外添加 no_resolve。

新增非 200 响应放行保护；未修改、空正文、无效 JSON、字段缺失及处理异常均保留原正文，修改时移除旧 Content-Length。上游完整功能包括隐藏视频与小团入口、部分推荐和助手技能，并非只去开屏。整主机、固定 IP 拒绝可能影响美团相关服务或使用同一地址的其他业务；接口与 IP 变动后可能失效。

已完成 YAML 解析、全部规则数量与正则检查，以及实际原生脚本与原 QX 脚本的合成样本对照：9 个正向样本、54 个错误/空值/结构异常样本、底栏保护及非 200 响应放行。尚未进行 Egern / 美团真机导入、开屏、首页与下单流程验证，不能保证适用于所有版本或清除已缓存广告。

## 开发

生成：`python3 Meituan.Egern/build.py`

检查：`node Meituan.Egern/test.mjs`

Egern 规范：[规则](https://egernapp.com/docs/configuration/rules/)、[响应脚本](https://egernapp.com/docs/configuration/scriptings/)、[JavaScript API](https://egernapp.com/docs/javascript-api/)。
