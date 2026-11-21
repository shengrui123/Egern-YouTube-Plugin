# Apple WeatherKit 天气增强（Egern）

[模组订阅](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/WeatherKit.Egern/WeatherKit.Egern.yaml)

在 Egern「工具 → 模块」中添加以上地址，开启模块；安装 Egern 的 HTTPS 解密证书，并在系统「设置 → 通用 → 关于本机 → 证书信任设置」中启用完全信任。强制关闭天气 App 后重新打开。

基于 [iRingo WeatherKit](https://nsringo.github.io/guide/Weather/weather-kit) v3.3.2 的官方 Egern 模组。包含天气、空气质量、未来一小时降水、预警及可用性处理；保留官方全部参数。默认中国大陆天气使用彩云、预警使用和风网页；和风 API 需要自己的 Host 和 Token。分钟级降水依赖上游接口权限，有降水时才显示。

## 兼容性

目标为 iOS 27.3 beta。已检查 Egern YAML、五类端点匹配、二进制开关与 JavaScript 语法；**没有 iOS 27.3 beta 真机或该系统的 WeatherKit 抓包，尚未完成实机兼容验证**。保留上游已实现的 `/api/v2/weather/` FlatBuffer 处理，未猜测修改系统版本、请求协议或二进制字段。若 beta 改变端点或 schema，需要根据实际日志继续适配。

使用支持兼容脚本 `_compat.$argument` 的当前 Egern 版本。不要同时开启其他修改 WeatherKit 的模块。若天气无法刷新，先关闭本模块确认原始天气是否恢复，再检查 `weatherkit.apple.com` 是否成功解密、脚本是否加载及日志报错。可将模块参数 `LogLevel` 临时设为 `DEBUG`；分享日志前删除坐标与 API Token。

## 本仓库调整

- 固定收录 v3.3.2 请求和响应脚本，内容与上游发布文件相同；脚本由本仓库 raw 地址提供。
- 保留 `binary_body: true`，响应体上限为 4 MiB，脚本超时为 60 秒。
- 将上游覆盖 Apple ASN 的 QUIC 拦截缩小到 `weatherkit.apple.com`，促使该服务回落 TCP 以供解密。
- 保留原作者署名、Apache-2.0 许可与校验摘要（`upstream.json`）。参数内不要填写或提交私人 Token 到 GitHub。

发布前校验：YAML 解析及回写一致性、端点正反例、二进制配置、两份脚本 `node --check`、上游脚本 SHA-256 一致性。以上不代替 Egern 与目标系统上的实机测试。
