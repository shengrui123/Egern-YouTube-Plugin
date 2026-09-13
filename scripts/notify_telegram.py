"""Announce new or updated Egern modules through Telegram."""

import html
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen


MODULE_SUFFIX = ".Egern.yaml"


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def expanded_module(content):
    """Expand simple compat_arguments defaults so script URLs can be tracked."""
    arguments = {}
    in_arguments = False
    for line in content.splitlines():
        if line == "compat_arguments:":
            in_arguments = True
            continue
        if in_arguments and line and not line.startswith((" ", "\t", "#")):
            break
        if in_arguments:
            match = re.match(r"^\s{2}([A-Za-z_][A-Za-z0-9_]*):\s*['\"]?([^'\"#]+?)['\"]?\s*$", line)
            if match:
                arguments[match.group(1)] = match.group(2).strip()
    for key, value in arguments.items():
        content = content.replace("{{{" + key + "}}}", value)
    return content


def dependencies(content, repo):
    result = set()
    for url in re.findall(r"https://raw\.githubusercontent\.com/[^\s'\"\)]+", expanded_module(content)):
        path = unquote(urlsplit(url).path)
        prefix = f"/{repo}/main/"
        if path.startswith(prefix):
            relative = path[len(prefix):]
            # Base-directory compat arguments are also present as standalone URLs.
            # Only expanded file URLs are useful git dependencies.
            if Path(relative).suffix:
                result.add(relative)
    return result


def metadata(content, key, fallback):
    lines = content.splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"^" + re.escape(key) + r":\s*(.*)$", line)
        if not match:
            continue
        value = match.group(1).strip()
        if value in {">", ">-", "|", "|-"}:
            parts = []
            for continuation in lines[index + 1 :]:
                if continuation and not continuation.startswith((" ", "\t")):
                    break
                if continuation.strip():
                    parts.append(continuation.strip())
            return " ".join(parts) or fallback
        return value.strip("'\"") or fallback
    return fallback


def affected_modules(before, after, repo):
    changed = set(git("diff", "--name-only", before, after).splitlines())
    result = []
    for name in git("ls-tree", "-r", "--name-only", after).splitlines():
        if "/" in name or not name.endswith(MODULE_SUFFIX):
            continue
        content = git("show", f"{after}:{name}")
        tracked = {name, *dependencies(content, repo)}
        if not tracked & changed:
            continue

        existed = subprocess.run(
            ["git", "cat-file", "-e", f"{before}:{name}"], capture_output=True
        ).returncode == 0
        notes = git("log", "--format=%s", f"{before}..{after}", "--", *sorted(tracked))
        result.append(
            (
                name,
                metadata(content, "name", name),
                metadata(content, "description", "Egern 模组"),
                existed,
                notes,
            )
        )
    return result


def message(entry, repo, sha):
    name, title, description, existed, notes = entry
    escape = html.escape
    raw_url = f"https://raw.githubusercontent.com/{repo}/main/{quote(name)}"
    commit_url = f"https://github.com/{repo}/commit/{sha}"
    heading = "🔄 模组更新" if existed else "🆕 新模组上线"
    return (
        f"<b>{heading}｜{escape(title[:150])}</b>\n\n"
        f"{escape(description[:700])}\n\n"
        f"<b>更新内容</b>\n"
        f"{escape(notes[:1400] or '模组配置或配套脚本已更新，详见提交记录。')}\n\n"
        f'<a href="{escape(raw_url, quote=True)}">模组订阅地址</a> · '
        f'<a href="{escape(commit_url, quote=True)}">查看更新详情</a>'
    )


def send(text, token):
    payload = json.dumps(
        {
            "chat_id": os.environ.get("TELEGRAM_CHAT_ID", "@Atlas_Corner"),
            "text": text,
            "parse_mode": "HTML",
            "link_preview_options": {"is_disabled": True},
        }
    ).encode()
    request = Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.load(response)
        if not result.get("ok"):
            raise RuntimeError("Telegram rejected the message")
    except (HTTPError, URLError):
        raise RuntimeError(
            "Telegram 发送失败，请检查 Token、频道管理员发消息权限和网络。"
        ) from None


def main():
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    repo = os.environ["GITHUB_REPOSITORY"]
    after = os.environ["GITHUB_SHA"]
    if os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch":
        messages = [
            "✅ Egern 模组通知已连接。后续 main 分支新增或更新模组时，将自动发布简介、更新内容与订阅链接。"
        ]
    else:
        before = event.get("before", "")
        if not before or set(before) == {"0"}:
            before = git("hash-object", "-t", "tree", "/dev/null")
        messages = [message(entry, repo, after) for entry in affected_modules(before, after, repo)]
    if not messages:
        print("没有模组或配套脚本变更，无需通知。")
        return
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise RuntimeError("缺少 TELEGRAM_BOT_TOKEN：请在仓库 Actions secrets 中添加。")
    for text in messages:
        send(text, token)
    print(f"已发送 {len(messages)} 条频道通知。")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
