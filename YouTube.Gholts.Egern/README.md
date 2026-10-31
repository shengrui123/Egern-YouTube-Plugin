# YouTube Enhance · gholts · Egern

依 2026-10-31 查閱的 Egern 官方文件轉換。來源為使用者指定的 `gholts/surge` 倉庫之 `modules/youtube-enhance.sgmodule`，固定於提交 `4ac19cee13ffa9a998694d228a47bed19c4bcced`。無法取得原 `youtube_gholts.lpx`，因此本包以這份 Surge 模組為功能基準，未宣稱與原 Loon 插件逐項相同。

## 直接匯入此倉庫版本

在 Egern 模組管理中新增 [YAML 原始網址](https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Gholts.Egern/YouTube.Gholts.Egern.yaml)。此版本已設定配套四支原生腳本的 HTTPS 地址，無須另改 `SCRIPT_https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/YouTube.Gholts.Egern`。請安裝並完全信任 Egern MITM CA 憑證，並避免同時啟用其他 YouTube 模組。

以下手動設定步驟僅供另存、搬移或自行託管時使用。

## 安裝

本包包含 YAML 模組和四支必要的配套 JS。ZIP 是下載分發包，不是已驗證的一鍵匯入格式。

1. 解壓，將 YAML 與 `scripts` 目錄上傳至自己的 HTTPS 靜態空間或 GitHub 倉庫，保留目錄結構。
2. 將 YAML 的 `compat_arguments.SCRIPT_BASE` 設為**本包配套 scripts 目錄的完整 HTTPS 網址**，不含末尾 `/`。請勿使用上游原始 Surge 腳本網址。
3. 在 Egern 模組管理中新增 YAML 的原始檔網址，再從模組設定調整功能。
4. 安裝並完全信任 Egern 的 MITM CA 憑證，啟用 MITM，再重新開啟 YouTube。避免同時啟用處理相同接口的其他模組。

本機方式：把四支 JS 放進 Egern 能存取的目錄，將 `SCRIPT_BASE` 設為該目錄的實際路徑，再載入 YAML。預設 `./scripts` 僅表達套件目錄結構，尚未驗證 Egern 匯入後的相對路徑解析基準，安裝時請明確設定。Mac 上的檔案路徑不能直接供 iPhone 使用。

## 功能與設定

保留來源的去廣告、背景播放、畫中畫、最高 4 倍速及九個布林開關。設定採 Egern `env_schema` 和 `ctx.env`，沒有 Surge `argument` 或條件指令。

| 變數 | 功能 | 預設 |
| --- | --- | --- |
| `block_upload` | 移除上傳分頁 | 開 |
| `block_shorts` | 移除 Shorts 分頁 | 關 |
| `auto_hd` | 偏好最高可用畫質 | 開 |
| `block_games` | 移除首頁遊戲 | 開 |
| `block_vertical_live` | 移除首頁直向直播 | 關 |
| `jump_ahead` | 啟用 Jump Ahead 按鈕 | 開 |
| `block_store` | 移除創作者商店、商品卡片與覆蓋項 | 開 |
| `block_ai` | 移除 AI 摘要、提問及相關控制項 | 開 |
| `on_the_go` | 相容介面的行動控制項 | 開 |

`default_value` 是 Egern 設定介面的提示值，真正的預設值也明確寫在原生腳本內。最高畫質以伺服器提供的格式為限，Premium 碼率需要帳號原有授權；Jump Ahead、畫中畫及行動控制項仍受 App 版本、介面和伺服器回應影響。

## 轉換內容

- 四支腳本均以 `export default async function(ctx)` 作為 Egern 原生入口。保留上游 protobuf、UMP 加解密及介面處理核心，將所有 `$request`、`$response`、`$argument`、`$done` 和 `$persistentStore` 引用轉換為區域資料與 Egern API；沒有注入舊版執行環境或執行期下載遠端程式碼。
- 使用 `ctx.request/response.arrayBuffer()` 讀取二進位主體，透過函式回傳值修改流量、`ctx.respond()` 回傳廣告空響應。
- 金鑰及畫質快取使用 `ctx.storage.get/set`；UMP gzip 使用 `ctx.compress.gunzip/gzip`。Base64 使用區域實作，避免依賴 JavaScript 引擎的新版 TypedArray 方法。
- URL 攔截採 `url_rewrites` 搭配 `http://reject/`；MITM 採 `hostnames.includes`。七條腳本規則保留來源的匹配範圍。
- 自動畫質關閉時，`videoplayback` 請求腳本在讀取主體前直接放行，替代來源的 Surge 條件式掛載。
- 來源的無上限 `max-size=-1` 改為明確的 **16 MiB** 主體處理上限；超出時 Egern 不傳入主體。解壓後也檢查 16 MiB 上限。腳本逾時 30 秒，適配入口在 28 秒嘗試回傳原主體；同步核心執行期間計時器無法中斷 JavaScript。
- 修改主體時清除過期的長度、內容編碼及傳輸編碼標頭，保留其他標頭和多值標頭。
- 保留來源的 UMP 錯誤策略：金鑰缺失或驗證失敗時可清除對應舊金鑰並回傳 HTTP 200 空內容，以觸發後續重新初始化。初次啟用可重新啟動 YouTube，讓 `config/log_event` 先建立金鑰快取。

## 驗證

已通過四支 ES 模組解析與模擬 Egern ctx 測試：廣告空響應、事件標頭清理、金鑰擷取與輪替、自動畫質開關、播放初始化、protobuf 去廣告及未知欄位保留、損壞 protobuf 原樣回傳、多值標頭保留，以及**實際 AES-CTR / HMAC / gzip UMP 測試資料的解密、修改、重壓縮和重新加密驗證**。另檢查 YAML、九個開關、七條路由、所有腳本路徑及正則。

尚未在 Egern 真機匯入，未以真實 YouTube 流量驗證去廣告、畫中畫或背景播放。Node 模擬結果不代表已通過 iOS 端到端測試。

重建：`python3 build.py`。測試：在有 Node.js 的環境執行 `node verify.mjs`。上游快照與 SHA-256 留在 `upstream/manifest.json`；此包不會自動跟隨上游 `main` 更新。

## 來源與規範

- [來源模組與固定版本](https://github.com/gholts/surge/blob/4ac19cee13ffa9a998694d228a47bed19c4bcced/modules/youtube-enhance.sgmodule)
- [Egern 模組](https://egernapp.com/docs/configuration/modules/)
- [Egern 腳本配置](https://egernapp.com/docs/configuration/scriptings/)
- [Egern 環境變數](https://egernapp.com/docs/configuration/env/)
- [Egern JavaScript API](https://egernapp.com/docs/javascript-api/)
- [Egern URL 重寫](https://egernapp.com/docs/configuration/url_rewrites/)
- [Egern 配置範例及 MITM 結構](https://egernapp.com/docs/configuration/example/)

來源模組標註基於 Maasea 的 Apache-2.0 程式碼；UMP 中的 noble 元件 MIT 授權聲明完整保留於來源及產生的腳本。原始作者權利及授權條款維持適用。轉換修改包括上述 Egern 入口、環境變數、儲存、壓縮、Base64 及回傳值適配。
