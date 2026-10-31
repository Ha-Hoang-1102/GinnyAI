"""Optional browser checks: Python Playwright + Chromium, separate from stdlib tests.

Run: GINNY_BROWSER=/usr/bin/chromium python3 tests/browser_workflow.py
Set GINNY_UI_ARTIFACTS to an output directory to retain screenshots of test fixtures.
"""
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from playwright.sync_api import sync_playwright, expect
from ginny.core import Store
from ginny.server import make_server


class VisualWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        options = {"headless": True}
        if os.environ.get("GINNY_BROWSER"):
            options["executable_path"] = os.environ["GINNY_BROWSER"]
        cls.browser = cls.playwright.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "ui.sqlite3")
        self.server = make_server(self.store, 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1050}, reduced_motion="reduce")
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("console", lambda msg: self.errors.append(msg.text) if msg.type == "error" and "Content Security Policy" in msg.text else None)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [])
        finally:
            self.context.close()
            self.server.shutdown()
            self.server.server_close()
            self.thread.join()
            self.temp.cleanup()

    def visit(self):
        self.page.goto(self.base)
        expect(self.page.locator("#sync-state")).to_have_class("sync-state connected")

    def seed(self, kind, title, status="queued", **extra):
        data = {"kind": kind, "title": title, "objective": "Đầu ra có thể kiểm chứng cho nhiệm vụ này.",
                "acceptance": "Có kết quả và bằng chứng rõ ràng.", **extra}
        if kind == "powershell":
            data["command_id"] = "system.info"
        if kind == "reminder" and "due_at" not in data:
            data["due_at"] = "2030-01-15T09:00:00+07:00"
        task = self.store.create(data)
        if status == "cancelled":
            return self.store.transition(task["id"], "cancelled", 1)
        if status != "queued":
            task = self.store.transition(task["id"], "running", 1)
        if status in ("awaiting_review", "done", "blocked", "failed"):
            task = self.store.transition(task["id"], "awaiting_review" if status == "done" else status,
                                         task["version"], "Bằng chứng từ dữ liệu kiểm thử.")
        if status == "done":
            task = self.store.transition(task["id"], "done", task["version"])
        return task

    def screenshot(self, name):
        directory = os.environ.get("GINNY_UI_ARTIFACTS")
        if directory:
            Path(directory).mkdir(parents=True, exist_ok=True)
            self.page.screenshot(path=str(Path(directory) / name), full_page=True)

    def test_empty_create_handoff_review_and_graph_updates(self):
        self.visit()
        expect(self.page.locator(".team-card")).to_have_count(4)
        expect(self.page.locator(".agent")).to_have_count(6)
        expect(self.page.locator("#completion-percent")).to_have_text("—")
        expect(self.page.locator(".connection-live")).to_have_count(0)
        self.page.get_by_role("button", name="Giao việc mới", exact=True).click()
        self.page.locator('[name="title"]').fill("Nghiên cứu công cụ điều phối")
        self.page.locator('[name="kind"]').select_option("research")
        self.page.locator('[name="objective"]').fill("So sánh 3 nguồn chính thức")
        self.page.locator('[name="acceptance"]').fill("Có URL và ngày cập nhật")
        self.page.get_by_role("button", name="Thêm vào hàng đợi").click()
        card = self.page.locator('article[data-task-id="1"]')
        expect(card).to_be_visible()
        expect(self.page.locator('.agent[data-kind="research"]')).to_contain_text("Nghiên cứu công cụ điều phối")
        card.get_by_role("button", name="Bản giao việc", exact=True).click()
        expect(self.page.locator("#detail")).to_be_visible()
        self.assertIn("So sánh 3 nguồn chính thức", self.page.locator("#detail-text").input_value())
        self.page.get_by_role("button", name="Đóng chi tiết").click()
        card.get_by_role("button", name="Nhận việc", exact=True).click()
        expect(self.page.locator("#running")).to_have_text("1")
        expect(self.page.locator(".connection-live")).to_have_count(1)
        card.get_by_role("button", name="Nộp kết quả").click()
        self.page.locator("#result-text").fill("Đã so sánh; có nguồn kiểm chứng.")
        self.page.get_by_role("button", name="Gửi duyệt").click()
        expect(self.page.locator("#review")).to_have_text("1")
        card.get_by_role("button", name="Duyệt hoàn tất").click()
        expect(self.page.locator("#completion-percent")).to_have_text("100%")
        expect(self.page.locator("#active")).to_have_text("0")
        expect(self.page.locator(".connection-live")).to_have_count(0)
        self.assertEqual(self.store.get(1)["status"], "done")

    def test_filters_status_counts_mobile_and_layout(self):
        self.seed("powershell", "Kiểm tra môi trường Windows", "running")
        self.seed("research", "Tổng hợp nguồn cho báo cáo tuần", "running")
        self.seed("decision", "Chọn ba ưu tiên trong tuần", "awaiting_review")
        self.seed("reminder", "Nhắc duyệt bản thảo", "queued")
        self.seed("article", "Biên tập bài giới thiệu Ginny", "blocked", due_at="2020-01-01T00:00:00Z")
        self.seed("image", "Thiết kế ảnh cho bài giới thiệu", "done")
        self.seed("article", "Bản nháp đã hủy", "cancelled")
        self.visit()
        expect(self.page.locator("#attention")).to_have_text("1")  # overdue+blocked is one task
        expect(self.page.locator("#completion-caption")).to_have_text("1/6 việc hoàn tất")
        expect(self.page.locator(".connection-live")).to_have_count(2)
        expect(self.page.locator(".connection-base")).to_have_count(4)
        self.screenshot("ginny-desktop.png")
        self.page.get_by_role("button", name="Xem nhóm Sáng tạo", exact=True).click()
        expect(self.page.locator("article.task")).to_have_count(3)
        self.page.locator('.agent[data-kind="image"]').focus()
        self.page.keyboard.press("Enter")
        expect(self.page.locator("article.task")).to_have_count(1)
        expect(self.page.locator("article.task")).to_contain_text("Thiết kế ảnh")
        self.page.locator('#pipeline [data-status="issues"]').click()
        expect(self.page.locator("article.task")).to_have_count(1)
        expect(self.page.locator("article.task")).to_contain_text("Biên tập bài")
        self.page.get_by_role("button", name="Xem tất cả", exact=True).click()
        self.page.locator("#search").fill("#2")
        expect(self.page.locator("article.task")).to_have_count(1)
        self.page.get_by_role("button", name="Xem tất cả", exact=True).click()
        for width in (390, 768, 1024):
            self.page.set_viewport_size({"width": width, "height": 900})
            self.page.evaluate("window.scrollTo(0, 0)")
            self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width)
            expect(self.page.locator(".connection-base")).to_have_count(4)
            if width == 390:
                self.screenshot("ginny-mobile.png")
                self.page.get_by_role("button", name="Báo cáo tổng hợp", exact=True).click()
                expect(self.page.locator("#detail")).to_be_visible()
                self.assertIn("Đang mở: 5", self.page.locator("#detail-text").input_value())
                self.page.get_by_role("button", name="Đóng chi tiết").click()
        self.assertEqual(self.page.locator(".connection-live").first.evaluate("el => getComputedStyle(el).animationName"), "none")

    def test_reminder_and_powershell_actions(self):
        self.seed("reminder", "Rà soát ngày mai")
        self.seed("powershell", "Thông tin hệ thống")
        self.visit()
        self.page.locator('[data-task-id="1"]').get_by_role("button", name="Nhắc qua ChatGPT").click()
        expect(self.page.locator("#detail")).to_be_visible()
        self.assertIn("2030-01-15T02:00:00+00:00", self.page.locator("#detail-text").input_value())
        self.page.get_by_role("button", name="Đóng chi tiết").click()
        self.page.locator('[data-task-id="2"]').get_by_role("button", name="Lệnh chạy").click()
        expect(self.page.locator("#detail-text")).to_have_value("py -3 -m ginny run 2 --workspace .")
        self.assertEqual(self.store.get(2)["status"], "queued")

    def test_disconnection_keeps_data_then_recovers(self):
        self.seed("research", "Không mất công việc khi mất kết nối", "running")
        self.visit()
        self.page.route("**/api/tasks", lambda route: route.abort())
        self.page.get_by_role("button", name="Tải lại dữ liệu").click()
        expect(self.page.locator("#sync-state")).to_have_class("sync-state stale")
        expect(self.page.locator("article.task")).to_have_count(1)
        self.page.unroute("**/api/tasks")
        self.page.get_by_role("button", name="Tải lại dữ liệu").click()
        expect(self.page.locator("#sync-state")).to_have_class("sync-state connected")
        expect(self.page.locator("#message")).to_be_hidden()

    def test_task_text_is_not_html_and_conflict_keeps_draft(self):
        task = self.seed("article", '<img src=x onerror="alert(1)">', "running")
        self.visit()
        expect(self.page.locator("article.task img")).to_have_count(0)
        self.page.get_by_role("button", name="Nộp kết quả").click()
        self.page.locator("#result-text").fill("Bản báo cáo cần giữ khi có xung đột.")
        self.store.transition(task["id"], "blocked", task["version"], "Được cập nhật từ cửa sổ khác.")
        self.page.get_by_role("button", name="Gửi duyệt").click()
        expect(self.page.locator("#result-error")).to_contain_text("Việc đã thay đổi")
        expect(self.page.locator("#result-text")).to_have_value("Bản báo cáo cần giữ khi có xung đột.")
        expect(self.page.locator("#result-dialog")).to_be_visible()


if __name__ == "__main__":
    unittest.main(verbosity=2)
