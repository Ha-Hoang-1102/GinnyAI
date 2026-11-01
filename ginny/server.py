import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from .core import brief, reminder_prompt, report

STATIC = Path(__file__).parent / "static"


def make_server(store, port=8765):
    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(10)

        def log_message(self, fmt, *args):
            pass  # Task contents and request paths are not written to logs.

        def send(self, code, data, content_type="application/json; charset=utf-8"):
            if isinstance(data, (dict, list)):
                data = json.dumps(data, ensure_ascii=False)
            body = data.encode("utf-8") if isinstance(data, str) else data
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(body)

        def dispatch(self, write=False):
            try:
                port = self.server.server_port
                allowed = {f"127.0.0.1:{port}", f"localhost:{port}"}
                host = self.headers.get("Host", "")
                if host not in allowed:
                    return self.send(403, {"error": "Host không được phép"})
                if write:
                    if self.headers.get("Origin") not in {None, f"http://{host}"}:
                        return self.send(403, {"error": "Origin không được phép"})
                    if self.headers.get("X-Ginny-Client") != "local":
                        return self.send(403, {"error": "Thiếu X-Ginny-Client"})
                    if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                        return self.send(415, {"error": "Cần application/json"})
                    length = int(self.headers.get("Content-Length", "0"))
                    if not 0 < length <= 32768:
                        return self.send(413, {"error": "JSON phải từ 1 đến 32768 bytes"})
                    data = json.loads(self.rfile.read(length))
                    if not isinstance(data, dict):
                        raise ValueError("Cần JSON object")
                path = urlsplit(self.path).path
                if not write and path == "/api/health":
                    return self.send(200, {"status": "ok", "mode": "manual", "task_count": len(store.list())})
                if path == "/api/tasks":
                    return self.send(201, store.create(data)) if write else self.send(200, store.list())
                if not write and path == "/api/report":
                    return self.send(200, {"text": report(store)})
                parts = path.strip("/").split("/")
                if len(parts) in {3, 4} and parts[:2] == ["api", "tasks"]:
                    task_id = int(parts[2])
                    task = store.get(task_id)
                    if write and len(parts) == 3:
                        return self.send(200, store.transition(task_id, data.get("status"), data.get("version"), data.get("result")))
                    if not write and len(parts) == 4 and parts[3] in {"brief", "reminder"}:
                        content = brief(task) if parts[3] == "brief" else reminder_prompt(task)
                        return self.send(200, {"text": content})
                    if not write and len(parts) == 3:
                        return self.send(200, task)
                files = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"), "/style.css": ("style.css", "text/css")}
                if not write and path in files:
                    filename, mime = files[path]
                    return self.send(200, (STATIC / filename).read_bytes(), mime + "; charset=utf-8")
                self.send(404, {"error": "Không tìm thấy"})
            except KeyError:
                self.send(404, {"error": "Không có việc này"})
            except (ValueError, TypeError) as exc:
                self.send(400, {"error": str(exc)})

        def do_GET(self):
            self.dispatch()

        def do_POST(self):
            self.dispatch(write=True)

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)
