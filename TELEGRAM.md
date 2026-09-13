# Telegram 频道通知

默认目标频道：https://t.me/Atlas_Corner

## 一次性启用

1. 在 Telegram 的 `@BotFather` 创建机器人，取得 Bot Token。
2. 将机器人添加为目标频道管理员，授予发布消息权限。
3. 在 GitHub 仓库 `Settings → Secrets and variables → Actions` 添加 `TELEGRAM_BOT_TOKEN`，不要将 Token 写入代码或提交记录。
4. 若通知其他频道，再添加 `TELEGRAM_CHAT_ID`；可使用 `@channel_name` 或数字 Chat ID。未设置时使用 `@Atlas_Corner`。
5. 在 `Actions → Telegram module updates → Run workflow` 手动运行一次，发送连接测试。

Secret 页面：https://github.com/shengrui123/Egern-YouTube-Plugin/settings/secrets/actions

也可在本机终端运行：

```shell
gh secret set TELEGRAM_BOT_TOKEN --repo shengrui123/Egern-YouTube-Plugin
```

## 通知规则

- `main` 分支 push 后，对比本次推送前后版本；新增或修改顶层 `*.Egern.yaml` 时通知。
- 模组通过本仓库 `main` 分支 URL 引用的脚本变更时，也会通知对应模组。
- 消息包含模组简介、本次相关 Git 提交标题、订阅链接和提交详情。
- 没有相关变更时保持安静；删除模组不通知。
- 手动运行只发送连接测试，不重发历史模组。

测试：`python3 -m unittest discover -s tests -p 'test_*.py'`。
