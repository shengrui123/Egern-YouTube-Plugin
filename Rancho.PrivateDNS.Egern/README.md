# rancho 私有 DNS · Egern

依据用户提供的 Shadowrocket 模块截图转换，包含截图中的全部 6 个精确域名和 2 个私有 DoH 地址。重复的服务器配置合并为一个上游组，组内并行查询并采用最快响应。

在 Egern 的模块页面添加 YAML 的 Raw 链接并启用。无需安装 MitM 证书或脚本。

如主配置已有较宽泛的 DNS forward 规则，请将本模块规则排在这些规则之前；Egern 按顺序使用第一个匹配项。如已配置 dns.proxy_nameservers，代理 DNS 会跳过 forward，需要在主配置检查该设置。

这只是指定域名的 DNS 转发转换，不承诺提速，也不保证服务端持续可用。已验证 YAML 结构，尚未在 Egern 真机验证。未复制原订阅链接中的用户 ID 和签名。

已按用户要求发布至公开 GitHub 仓库，文件包含私有 DoH 地址。

导入地址：https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/Rancho.PrivateDNS.Egern/Rancho.PrivateDNS.Egern.yaml

参考：https://egernapp.com/docs/configuration/dns/ 和 https://egernapp.com/docs/configuration/modules/
