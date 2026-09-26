# Egern 常用 App 与网站图标集

可在 Egern 的图标库中订阅以下 JSON 地址。全量库目前有 **417 个**图标；国内库 **303 个**，海外库 **114 个**。图标名称支持在 Egern 中搜索，常用国内服务补充了中文名称。

| 图标库 | 订阅地址 |
| --- | --- |
| 国内外全量 | `https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/iconset/Egern-Icons-All.json` |
| 国内 App 与网站 | `https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/iconset/Egern-Icons-China.json` |
| 海外 App 与网站 | `https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/iconset/Egern-Icons-Global.json` |

打开 Egern 的图标库订阅入口，粘贴一个地址并更新图标库。推荐只订阅“国内外全量”，避免三个库同时订阅产生重复项。选中图标后，Egern 会把对应图片 URL 写入策略组的 `icon` 字段；也可以直接复制 JSON 中的 `url` 手动填入配置，例如：

```yaml
policy_groups:
  - select:
      name: 微信
      policies: [DIRECT, PROXY]
      icon: https://raw.githubusercontent.com/luestr/IconResource/173d41fe13f74590ab9449ee1ae1feb7be2f2b5b/App_icon/120px/Weixin.png
```

本图标库是 `name` / `icons` / `url` 结构的**图标库订阅**，不是 Egern 模组或规则集。它仅提供图标选择，不会改变分流规则。当前收录范围覆盖社交、影音、购物、出行、金融、办公、浏览器、开发者工具和 AI 服务；“所有常用”随新服务出现会继续维护，无法表示所有现存 App。

## 来源与维护

- 主要图标通过固定提交引用 [luestr/IconResource](https://github.com/luestr/IconResource) 的 120px 应用图标，不在本仓库复制其图片文件。
- 少量海外服务通过固定提交引用 [Koolson/Qure](https://github.com/Koolson/Qure) 的彩色图标，不在本仓库复制其图片文件。
- `png/` 中的补充图标由 [Simple Icons](https://simpleicons.org/) 的 SVG 转为 120×120 PNG；原图项目采用 CC0-1.0。各品牌名称和商标仍归各自权利人所有。这些图标仅用于个人配置识别，不代表品牌方背书。
- `catalog.tsv` 是清单源文件。修改后运行 `python3 scripts/build_iconset.py` 重建三份 JSON，脚本会拒绝重复名称和缺失的本地图标。

上游图片被删除或服务不可达时，相关图标可能无法显示；本仓库内的补充 PNG 由本仓库的 Raw URL 提供。
