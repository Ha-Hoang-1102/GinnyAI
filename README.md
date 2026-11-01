# GinnyAI

Trợ lý điều phối cho cá nhân: **thực thi PowerShell** và **quyết định/nhắc việc**, kèm quy trình nghiên cứu, viết bài và hình ảnh.

Ginny Control là công cụ giám sát đi kèm trong repo: tạo việc, giao cho ChatGPT/Codex, xem tiến độ, nhận báo cáo, duyệt kết quả. Giai đoạn đầu dùng tài khoản ChatGPT/Codex hiện có và giao nhận thủ công; ứng dụng không gọi API AI tính phí.

Giao diện nền xanh hiển thị **Ginny ở trung tâm → 4 nhóm AI → 6 vai trò agent → nhiệm vụ**. Chọn nhóm hoặc agent để lọc công việc, xem trạng thái theo màu và chuyển qua các bước xử lý ngay trên thẻ nhiệm vụ. Agent trên sơ đồ là vai trò điều phối; trạng thái lấy từ dữ liệu công việc, chưa phải kết nối đến các tiến trình AI tự chạy.

Giao diện được xây bằng **React + Vite trên Node.js**, không dùng PHP. Source/build nằm trong [frontend](frontend/README.md); bản build được đóng gói sẵn để các lệnh Python hiện tại vẫn dùng được. API vẫn là Python/SQLite, chưa phải API public có xác thực.

## Bắt đầu

Yêu cầu: Python 3.11+, Git; PowerShell 7.4+ khi chạy lệnh. Python chỉ dùng thư viện chuẩn, không cần `pip install`.

```powershell
cd E:\GinnyAI
$env:GINNY_DB = 'E:\GinnyAI\.ginny\tasks.sqlite3'
python -m ginny init
python -m ginny serve
```

Mở trình duyệt trên **cùng máy**, nhập địa chỉ loopback `127.0.0.1` với cổng `8765`. Bảng tự tải lại mỗi 15 giây. Dừng dịch vụ bằng Ctrl+C. Công cụ cài mặc định trên C; source code, file `.md` và dữ liệu dự án nằm dưới **`E:\GinnyAI`**. Hướng dẫn cài mới, chuyển dữ liệu và cấu hình vùng tạm trên E: [Windows 11](docs/windows.md).

1. Chọn **Giao việc mới**, điền mục tiêu, tiêu chí hoàn thành và ngữ cảnh liên quan. Agent phụ trách xác định nhóm hiển thị trên sơ đồ.
2. Chọn **Bản giao việc**, sao chép vào ChatGPT/Codex; chọn **Nhận việc**.
3. Với PowerShell, chọn **Lệnh chạy**, thực hiện tại thư mục repo trên máy đích; runner tự cập nhật trạng thái.
4. Nộp kết quả và bằng chứng; duyệt hoàn tất hoặc giao lại.
5. Với việc có hạn, chọn **Nhắc qua ChatGPT**, dán câu lệnh vào ChatGPT có Tasks và kiểm tra xác nhận đặt lịch.

**Theo dõi trực quan:** nhóm Thực thi có Executor; Nghiên cứu có Researcher; Điều phối có Planner và Reminder; Sáng tạo có Editor và Designer. Nhánh có việc `running` được làm nổi bật. Sơ đồ tự cập nhật mỗi 15 giây; khi mất kết nối, dữ liệu đã tải được giữ lại với nhãn cảnh báo. Phần trăm hoàn tất là số việc `done` trên tổng số việc chưa hủy, không phải ước lượng phần trăm của một tác vụ đang làm. Bộ lọc chỉ thay đổi danh sách bên dưới; sơ đồ và tổng quan luôn bao quát toàn bộ công việc.

## Hiện có và giới hạn

| Nhu cầu | Bản hiện tại |
|---|---|
| Giám sát tác nhân | Hàng đợi, vai trò, ưu tiên, hạn, trạng thái, lịch sử, báo cáo; tiến độ do người dùng/runner cập nhật |
| PowerShell | Chạy thực tế `system.info`, `workspace.list`, `git.status` trên máy có runner; timeout 30 giây, thu exit code |
| Quyết định | Mẫu so sánh phương án và phản biện; hàng đợi đưa việc đến hạn lên trước, sau đó P1/P2/P3 |
| Nhắc việc | Phát hiện đến hạn trên bảng; xuất lời nhắc cho ChatGPT Tasks. Chưa tự tạo Tasks hay gửi push |
| Nghiên cứu, bài viết, ảnh | Bản giao việc theo vai trò; người dùng chạy bằng công cụ có sẵn trong ChatGPT/Codex, rồi nộp kết quả |
| Tối ưu token | Chỉ chuyển mục tiêu/tiêu chí/ngữ cảnh của một việc; giới hạn ký tự đầu vào và yêu cầu báo cáo ngắn |
| Cloud/GitHub | Đồng bộ mã, tài liệu, cấu trúc lệnh bằng Git; SQLite chứa việc cá nhân nằm ngoài Git |

ChatGPT trên điện thoại không tự truy cập PowerShell hay database tại máy Windows. Nếu tài khoản hỗ trợ đồng bộ lịch sử, có thể tiếp tục cuộc trò chuyện trên cùng tài khoản. Cloud phát triển và máy Windows dùng hai database riêng. Bản này chưa có server chung để đồng bộ trạng thái công việc giữa các thiết bị.

## Tài liệu

- [Thiết kế, đồng bộ và lộ trình](docs/architecture.md)
- [Windows 11 và kiểm chứng trên máy đích](docs/windows.md)
- [Danh mục lệnh và CLI](docs/commands.md)
- [Quy trình tiết kiệm ngữ cảnh và kiểm soát chất lượng](docs/workflow.md)
- [Prompt nền cho Ginny](prompts/ginny-system.md)
- [Mẫu yêu cầu theo vai trò](prompts/task-templates.md)
- [Đánh giá 30 lựa chọn GitHub cho trợ lý mạng xã hội](docs/github-options-social-ai.md)
- [Kế hoạch server Ubuntu và harness 24/7](docs/server-24x7-plan.md) — thiết kế giai đoạn tiếp theo, chưa triển khai; thuê bao ChatGPT/Claude hiện tại chưa phải ngân sách API.
- [Cấu hình OpenClaw: giao diện quản trị, Telegram, các nhóm agent](docs/openclaw-setup.md) — bộ triển khai thử riêng; chưa cài trên server người dùng và chưa đồng bộ với bảng Ginny Control.
- [Ubuntu 26.04: tải repo, Docker, quản trị và bảo mật](docs/ubuntu-server-setup.md) — bắt đầu từ máy mới, có bước tránh khóa SSH và báo cáo kiểm tra chỉ đọc.

## Kiểm tra và sao lưu

```powershell
python -m unittest discover -s tests -v
python -m ginny report
python -m ginny backup .ginny/backups/manual-01.sqlite3
```

Database mặc định là `.ginny/tasks.sqlite3` (đã bỏ qua trong Git). `GINNY_DB` hoặc `--db` chọn vị trí riêng. Dùng SQLite backup qua lệnh trên; không đồng bộ file database đang mở bằng Git/OneDrive. Không ghi đè backup hiện có. Xem quy trình phục hồi trong tài liệu Windows.

Kiểm thử giao diện bổ sung nằm ở `tests/browser_workflow.py`, cần Python Playwright và Chromium trong môi trường phát triển. Chạy `python tests/browser_workflow.py`; nếu dùng Chromium của hệ thống, đặt `GINNY_BROWSER` thành đường dẫn executable. Bộ này tạo database tạm, kiểm tra giao nhận/duyệt việc, bộ lọc, báo cáo, mất kết nối và bố cục điện thoại. Không thêm nhiệm vụ mẫu vào database người dùng.
