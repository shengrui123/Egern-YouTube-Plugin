# YouTube & Music 增强 · Egern

按 2026-09-13 查询到的 Egern 官方文档转换，包含一个 YAML 模组和五个配套 JavaScript 文件。不是把 Loon 配置换扩展名：四个上游脚本均封装成 `export default async function(ctx)`，通过 `ctx.env`、`ctx.storage`、`ctx.http` 和原生返回值运行。

## 安装

模组已经指向本仓库的配套脚本，可直接使用以下地址导入：

```text
https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Enhance.Egern.yaml
```

安装步骤：

1. 在 Egern 的「工具 → 模组」中添加上面的 YAML 原始文件 URL。
2. 在模组设置中调整字幕、底栏和歌词选项。未设置的选项由脚本提供默认值。
3. 确保 Egern 的 MITM CA 证书已安装并完全信任，然后重新打开 YouTube / YouTube Music。

如需镜像到自己的仓库，请同时复制 YAML 和 `scripts` 目录，并将 `SCRIPT_BASE` 改为新仓库中 `scripts` 的完整 HTTPS 地址。

## 默认行为和范围

- 视频字幕目标为简体中文；关闭字幕翻译选 `captionLang: off`。
- 移除上传、Music 选段和 Shorts 底栏入口；歌词翻译开启，Google 翻译，原文在前，同时显示译文。
- 歌词翻译沿用上游的中文目标语言；`captionLang` 只控制视频字幕。
- `Type`、`Types`、`AutoCC` 等保留原插件传参范围。原插件仅对 browse 请求调用 DualSubs，所以 `AutoCC` 不会额外为视频播放器添加自动字幕处理。
- 歌词关闭后，两个歌词脚本会在读取请求体前直接放行。普通 browse 仍由 Maasea 响应脚本处理。
- 不要同时启用其他处理相同接口的 YouTube 去广告、字幕或歌词模组。
- 主体处理上限明确设为 10 MiB，超出部分不处理；脚本超时 30 秒，适配层在 28 秒时尝试原样放行。
- 保留原插件的广告匹配、HTTP 200 空响应及 1×1 图片返回，并将 `redirector*.googlevideo.com` 放进 MITM 排除列表。

## 上游依赖

本包固定了转换时下载的脚本快照，不会在每次拦截时下载或执行新的远程代码。更新上游需要重新生成配套脚本；Egern 的资源刷新不会自动把这些快照升级为上游最新版。

- 原插件：https://raw.githubusercontent.com/shengrui123/Loon-YouTube-Plugin/refs/heads/main/YouTube.Enhance.Loon.plugin
- Maasea 响应：https://raw.githubusercontent.com/Maasea/sgmodule/master/Script/Youtube/youtube.response.js
- Maasea 请求：https://raw.githubusercontent.com/Maasea/sgmodule/master/Script/Youtube/youtube.request.js
- DualSubs 歌词请求：https://github.com/DualSubs/YouTube/releases/download/v1.5.11/request.bundle.js
- DualSubs 歌词响应：https://github.com/DualSubs/Universal/releases/latest/download/Translate.response.bundle.js （下载内容标注 v1.7.5）

保留上游 protobuf 和翻译逻辑；Maasea 实例初始化补入 `debug` 参数。原脚本已有的 `init-stream.maasea.workers.dev` 播放处理依赖和外部翻译服务也被保留，因此相应功能仍依赖这些服务可用。

## 验证范围

已完成 YAML 解析、全部脚本路径检查、正则编译、普通响应与翻译响应互斥检查，以及 Node 模拟 Egern ctx 的脚本测试：protobuf / JSON 歌词请求、普通 browse、关闭歌词、Official 类型、歌词响应入口、事件请求主体、空播放器 protobuf、GIF 返回。

尚未在 Egern 真机导入，未验证真实 YouTube 广告样本、画中画、后台播放或在线翻译服务。模拟测试不能替代客户端及服务端的端到端验证。

规范依据：

- https://egernapp.com/docs/configuration/modules/
- https://egernapp.com/docs/configuration/scriptings/
- https://egernapp.com/docs/configuration/env/
- https://egernapp.com/docs/javascript-api/
- https://egernapp.com/docs/configuration/example/
