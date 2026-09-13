import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    "notify", Path(__file__).parents[1] / "scripts/notify_telegram.py"
)
notify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify)


class Notifications(unittest.TestCase):
    def test_expands_script_base(self):
        content = """compat_arguments:
  SCRIPT_BASE: https://raw.githubusercontent.com/o/r/main/scripts
script_url: '{{{SCRIPT_BASE}}}/one.js'
"""
        self.assertEqual(notify.dependencies(content, "o/r"), {"scripts/one.js"})

    def test_message_escapes_html(self):
        text = notify.message(
            ("Test.Egern.yaml", "<Title>", "&desc", True, "<script>"),
            "owner/repo",
            "abc",
        )
        self.assertNotIn("<script>", text)
        self.assertIn("&lt;Title&gt;", text)
        self.assertIn("模组更新", text)

    def test_folded_description(self):
        content = """name: Test
description: >-
  First line;
  second line.
author: tester
"""
        self.assertEqual(
            notify.metadata(content, "description", "fallback"),
            "First line; second line.",
        )

    def test_transport(self):
        with patch.object(notify, "urlopen", return_value=io.BytesIO(b'{"ok":true}')) as mocked:
            notify.send("test", "dummy")
            payload = json.loads(mocked.call_args.args[0].data)
            self.assertEqual(payload["chat_id"], "@Atlas_Corner")
            self.assertEqual(payload["text"], "test")


if __name__ == "__main__":
    unittest.main()
