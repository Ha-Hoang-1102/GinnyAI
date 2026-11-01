# Giao diện Ginny: React + Vite

React 19, Vite 8 và Node.js 24.22.1 (xem `.nvmrc`). Không dùng PHP. API Ginny hiện tại vẫn là Python/SQLite; thay frontend không tự thêm đăng nhập/public API hoặc adapter OpenClaw.

```bash
cd frontend
npm ci --ignore-scripts
npm run build
```

Build cập nhật `../ginny/static/{index.html,app.js,style.css}`. Các file build được lưu cùng repo để Windows/server có thể chạy `python3 -m ginny serve` mà không cần Node ở runtime. Chỉ sửa source trong `frontend/src`, không sửa trực tiếp bundle. Lockfile pin dependency và integrity; `npm audit` phát hiện các advisory đã biết, không thay kiểm thử bảo mật ứng dụng.

Phát triển: khởi động API Python tại loopback cổng 8765, rồi `npm run dev` ở terminal khác. Vite chỉ nghe `127.0.0.1:5173`, proxy `/api` sang backend; kiểm tra Origin trước khi chuyển request. Không đưa Vite dev/preview ra public. Bản build được Python serve dùng CSP hiện có, không nạp CDN hoặc HTML từ nội dung công việc.

Kiểm tra chức năng từ gốc repo:

```bash
python3 -m unittest discover -s tests -v
GINNY_BROWSER=/usr/bin/chromium python3 tests/browser_workflow.py
```

Browser suite cần Python Playwright và Chromium. Kiểm tra lifecycle, bộ lọc/sơ đồ, mobile, XSS bằng text, xung đột giữ bản nháp và mất/kết nối lại; dữ liệu kiểm thử nằm trong database tạm.
