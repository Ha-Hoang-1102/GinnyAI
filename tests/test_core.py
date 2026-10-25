import concurrent.futures
import json
import shutil
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from ginny.core import Store, brief, due_date, reminder_prompt, report
from ginny.runner import run_powershell
from ginny.server import make_server


def task(**overrides):
    return dict(title="Tổng hợp thông tin", kind="research", objective="So sánh 3 nguồn",
                acceptance="Có URL và ngày xuất bản", **overrides)


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "tasks.db")

    def tearDown(self):
        self.temp.cleanup()

    def test_review_flow_and_persistence(self):
        t = self.store.create(task())
        t = self.store.transition(t["id"], "running", t["version"])
        t = self.store.transition(t["id"], "awaiting_review", t["version"], "Nguồn: https://example.org")
        t = self.store.transition(t["id"], "done", t["version"])
        reloaded = Store(self.store.path).get(t["id"])
        self.assertEqual(reloaded["status"], "done")
        self.assertEqual(len(reloaded["events"]), 4)

    def test_cannot_skip_review_or_submit_empty_result(self):
        t = self.store.create(task())
        with self.assertRaises(ValueError):
            self.store.transition(t["id"], "done", t["version"])
        t = self.store.transition(t["id"], "running", t["version"])
        with self.assertRaises(ValueError):
            self.store.transition(t["id"], "awaiting_review", t["version"])

    def test_concurrent_claim_only_one_succeeds(self):
        t = self.store.create(task())
        def claim():
            try:
                return self.store.transition(t["id"], "running", 1)["status"]
            except ValueError:
                return "conflict"
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: claim(), range(2)))
        self.assertCountEqual(results, ["running", "conflict"])

    def test_retry_keeps_history_but_clears_current_result(self):
        t = self.store.create(task())
        t = self.store.transition(t["id"], "running", 1)
        t = self.store.transition(t["id"], "failed", 2, "Lỗi nguồn")
        t = self.store.transition(t["id"], "queued", 3)
        self.assertEqual(t["result"], "")
        self.assertEqual(t["events"][2]["note"], "Lỗi nguồn")

    def test_requires_timezone_and_normalizes_dates(self):
        self.assertEqual(due_date("2026-10-26T09:00:00+07:00"), "2026-10-26T02:00:00+00:00")
        with self.assertRaises(ValueError):
            due_date("2026-10-26T09:00")
        data = task(); data["kind"] = "reminder"
        with self.assertRaises(ValueError):
            self.store.create(data)

    def test_overdue_before_priority_and_finished_last(self):
        regular = self.store.create(task(priority=1))
        overdue = self.store.create(task(priority=3, due_at="2020-01-01T00:00:00Z"))
        self.assertEqual(self.store.list()[0]["id"], overdue["id"])
        self.store.transition(overdue["id"], "cancelled", 1)
        self.assertEqual(self.store.list()[0]["id"], regular["id"])

    def test_context_budget_and_isolation(self):
        self.store.create(task(context="PRIVATE_UNRELATED_CONTEXT"))
        current = self.store.create(task(context="Relevant context"))
        self.assertNotIn("PRIVATE_UNRELATED_CONTEXT", brief(current))
        self.assertIn("Relevant context", brief(current))
        with self.assertRaises(ValueError):
            self.store.create(task(context="x" * 2001))

    def test_reminder_export_is_explicit_not_scheduled(self):
        t = self.store.create(task(due_at="2026-10-26T09:00:00+07:00"))
        text = reminder_prompt(t)
        self.assertIn("02:00:00+00:00", text)
        self.assertIn("chưa đặt được lịch", text)
        self.assertEqual(self.store.get(t["id"])["status"], "queued")

    def test_rejects_arbitrary_command(self):
        data = task(); data.update(kind="powershell", command_id="Invoke-Expression")
        with self.assertRaises(ValueError):
            self.store.create(data)

    def test_missing_runtime_does_not_claim_task(self):
        data = task(); data.update(kind="powershell", command_id="system.info")
        t = self.store.create(data)
        with self.assertRaises(ValueError):
            run_powershell(self.store, t["id"], self.temp.name, "ginny-no-such-pwsh")
        self.assertEqual(self.store.get(t["id"])["status"], "queued")

    def test_backup_and_report(self):
        t = self.store.create(task())
        destination = Path(self.temp.name) / "backup.db"
        self.store.backup(destination)
        self.assertEqual(Store(destination).get(t["id"])["title"], t["title"])
        with self.assertRaises(ValueError):
            self.store.backup(destination)
        self.assertIn("Đang mở: 1", report(self.store))


@unittest.skipUnless(shutil.which("pwsh"), "PowerShell 7 chưa cài hoặc chưa kích hoạt PATH")
class PowerShellTests(unittest.TestCase):
    setUp = StoreTests.setUp
    tearDown = StoreTests.tearDown
    def test_real_commands(self):
        for command in ("system.info", "workspace.list", "git.status"):
            with self.subTest(command=command):
                data = task(); data.update(kind="powershell", command_id=command)
                t = self.store.create(data)
                result = run_powershell(self.store, t["id"], Path(__file__).resolve().parent.parent)
                self.assertEqual(result["status"], "awaiting_review", result["result"])
                self.assertIn("Exit code: 0", result["result"])
                if command == "system.info":
                    payload = json.loads(result["result"].split("\n", 1)[1])
                    self.assertTrue(payload["PowerShell"].startswith("7."))

    def test_git_failure_is_not_reported_as_success(self):
        data = task(); data.update(kind="powershell", command_id="git.status")
        t = self.store.create(data)
        result = run_powershell(self.store, t["id"], self.temp.name)
        self.assertEqual(result["status"], "failed")
        self.assertIn("Exit code: 128", result["result"])

    def test_script_rejects_command_text(self):
        script = Path(__file__).resolve().parent.parent / "scripts" / "Invoke-GinnyCommand.ps1"
        result = subprocess.run(["pwsh", "-NoProfile", "-NonInteractive", "-File", str(script),
                                 "-CommandId", "system.info; Write-Output injected", "-Workspace", self.temp.name],
                                capture_output=True, timeout=30)
        self.assertNotEqual(result.returncode, 0)


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "http.db")
        self.server = make_server(self.store, 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        self.temp.cleanup()

    def request(self, path, data=None, headers=None):
        base_headers = {"Content-Type": "application/json", "X-Ginny-Client": "local"}
        base_headers.update(headers or {})
        body = json.dumps(data).encode() if data is not None else None
        with urlopen(Request(self.base + path, body, base_headers), timeout=5) as response:
            return json.load(response)

    def test_end_to_end_task_and_brief(self):
        self.assertEqual(self.request("/api/health")["status"], "ok")
        created = self.request("/api/tasks", task())
        self.assertEqual(len(self.request("/api/tasks")), 1)
        self.assertIn("So sánh 3 nguồn", self.request(f"/api/tasks/{created['id']}/brief")["text"])
        t = self.request(f"/api/tasks/{created['id']}", {"status": "running", "version": 1})
        self.assertEqual(t["version"], 2)
        t = self.request(f"/api/tasks/{created['id']}", {"status": "awaiting_review", "version": 2, "result": "Đã kiểm chứng"})
        t = self.request(f"/api/tasks/{created['id']}", {"status": "done", "version": 3})
        self.assertEqual(t["status"], "done")

    def test_blocks_cross_origin_and_bad_host(self):
        for headers in ({"Origin": "https://foreign.example"}, {"Host": "foreign.example"}, {"X-Ginny-Client": ""}):
            with self.assertRaises(HTTPError) as ctx:
                self.request("/api/tasks", task(), headers)
            self.assertEqual(ctx.exception.code, 403)
        self.assertEqual(self.store.list(), [])

    def test_invalid_and_large_requests(self):
        for data, code in (({}, 400), ([], 400), (task(context="x" * 40000), 413)):
            with self.assertRaises(HTTPError) as ctx:
                self.request("/api/tasks", data)
            self.assertEqual(ctx.exception.code, code)

    def test_static_page_and_no_traversal(self):
        with urlopen(self.base, timeout=5) as response:
            self.assertIn("Ginny Control", response.read().decode())
            self.assertIn("frame-ancestors 'none'", response.headers["Content-Security-Policy"])
        with self.assertRaises(HTTPError) as ctx:
            self.request("/../README.md")
        self.assertEqual(ctx.exception.code, 404)


if __name__ == "__main__":
    unittest.main()
