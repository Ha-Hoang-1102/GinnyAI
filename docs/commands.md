# Cấu trúc lệnh và dữ liệu

Chạy tại thư mục repo. `python -m ginny --help` hiển thị toàn bộ CLI.

| Lệnh | Tác dụng |
|---|---|
| `python -m ginny init` | Tạo database nếu chưa có; chạy lại không xóa việc |
| `python -m ginny serve` | Mở bảng tại loopback, cổng 8765 |
| `python -m ginny create --file examples/research.json` | Tạo việc từ JSON |
| `python -m ginny list` | Danh sách kèm ID/version/trạng thái |
| `python -m ginny brief 1` | Bản giao việc cho ChatGPT/Codex |
| `python -m ginny reminder 1` | Câu lệnh tạo ChatGPT Task; cần `due_at` |
| `python -m ginny run 1 --workspace .` | Chạy command ID của việc PowerShell |
| `python -m ginny report` | Báo cáo Markdown tổng hợp |
| `python -m ginny backup .ginny/backups/01.sqlite3` | Sao lưu nhất quán, không ghi đè |

## Task JSON

```json
{
  "title": "Nhắc kiểm tra báo cáo",
  "kind": "reminder",
  "objective": "Mở báo cáo tuần và xác định 3 việc tiếp theo",
  "acceptance": "ChatGPT xác nhận lịch và điện thoại nhận được thông báo",
  "context": "Lịch ví dụ; sửa ngày phù hợp trước khi tạo",
  "priority": 2,
  "due_at": "2030-01-15T09:00:00+07:00"
}
```

`kind`: `powershell`, `research`, `decision`, `reminder`, `article`, `image`. `priority`: 1/2/3. `due_at` là ISO 8601 có múi giờ; backend lưu UTC. Giới hạn tên 160, mục tiêu 1000, tiêu chí 1000, ngữ cảnh 2000 ký tự; đây là giới hạn ký tự, **không phải số token chính xác**. Báo cáo tối đa 12000 ký tự; prompt đề nghị 2000 ký tự, cho phép dài hơn khi bằng chứng cần thiết. Chưa đo token thực tế vì không gọi API.

Task PowerShell cần `command_id` thuộc danh mục:

| Command ID | Thực thi | Phạm vi |
|---|---|---|
| `system.info` | Phiên bản PowerShell, OS, kiến trúc, workspace | Đọc thông tin máy |
| `workspace.list` | Tối đa 100 mục đầu ở cấp gốc workspace | Không đọc nội dung file, không đệ quy |
| `git.status` | `git status --short --branch` | Repo tại workspace; không commit/push |

Runner dùng argument array, `shell=False`, file script cố định và `ValidateSet`. Nội dung mục tiêu/ngữ cảnh không được thực thi. Workspace được chọn trực tiếp qua CLI; task không được truyền đường dẫn hay shell tùy ý. Thêm lệnh mới là thay đổi mã cần được kiểm tra, không nhập một đoạn PowerShell vào ô mục tiêu để kỳ vọng runner chạy nó.

## Trạng thái và báo cáo

`queued → running → awaiting_review → done`. Khi vướng: `running → blocked/failed → queued`. Khi giao lại, báo cáo hiện tại được xóa nhưng lịch sử giữ bản cũ. `done/cancelled` là trạng thái kết thúc; muốn làm lại tạo việc mới.

Ví dụ CLI cập nhật (version lấy từ `list`, không dùng lại sau khi đã thay đổi):

```powershell
python -m ginny move 1 running --version 1
python -m ginny move 1 awaiting_review --version 2 --result-file .ginny/result.txt
python -m ginny move 1 done --version 3
```

Hai bên nhận cùng việc: chỉ một cập nhật đúng version thành công. Runner chạy tối đa 30 giây và lưu exit code; lệnh thành công vẫn chờ người duyệt. Không tự retry. Nếu tiến trình bị tắt khi đang `running`, kiểm tra máy đích trước, ghi lý do `blocked`, rồi đưa lại `queued` khi phù hợp. Hủy việc không có nghĩa là dừng tiến trình PowerShell đã bắt đầu; ba lệnh hiện có chỉ đọc và có timeout.
