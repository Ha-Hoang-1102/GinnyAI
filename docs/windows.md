# Cài trên Windows 11

## 1. Cài công cụ

Trong Terminal/PowerShell của Windows 11:

```powershell
winget install --id Microsoft.PowerShell --exact --source winget
winget install --id Python.Python.3.12 --exact --source winget
winget install --id Git.Git --exact --source winget
```

Nếu đã có công cụ đạt yêu cầu, bỏ qua bước tương ứng. Mở lại Terminal sau khi cài. Dùng **PowerShell 7 (`pwsh`)**, không phải Windows PowerShell 5.1.

```powershell
pwsh --version
python --version
git --version
```

Python phải từ 3.11, PowerShell từ 7.4. Nếu `python` mở Microsoft Store, dùng `py -3` thay cho `python` trong các lệnh dưới và chỉnh App execution aliases/PATH theo bản Python vừa cài.

## 2. Lấy mã và chạy bảng

```powershell
New-Item -ItemType Directory -Force C:\Projects | Out-Null
Set-Location C:\Projects
git clone https://github.com/Ha-Hoang-1102/GinnyAI.git
Set-Location GinnyAI
```

Nếu tính năng đang ở nhánh chưa gộp vào `main`, dùng tên nhánh được báo khi bàn giao: `git switch --track origin/<ten-nhanh>`. Nếu repo đã có trên máy, dùng checkout đó; không ghi đè thay đổi chưa lưu. Xác thực GitHub qua trình quản lý Git nếu repo yêu cầu.

```powershell
python -m unittest discover -s tests -v
python -m ginny init
python -m ginny serve
```

Trên trình duyệt cùng máy, nhập `127.0.0.1:8765`. Không cần key AI. Để cửa sổ đang chạy mở; Ctrl+C dừng bảng. Lần sau có thể chạy `pwsh -File .\scripts\Start-Ginny.ps1` từ thư mục repo.

## 3. Kiểm chứng PowerShell trên đúng máy

Mở cửa sổ PowerShell thứ hai tại repo:

```powershell
python -m ginny create --file examples/powershell.json
python -m ginny list
# Thay 1 bằng ID thực tế vừa tạo:
python -m ginny run 1 --workspace .
```

Kết quả đúng: exit code 0, OS mô tả Windows, PowerShell đúng phiên bản; trạng thái `awaiting_review`. Quay lại bảng để duyệt. Các lần chạy trong cloud Linux không chứng minh Windows đã hoạt động.

Nếu chính sách Windows chặn `.ps1`, đọc thông báo và kiểm tra `Get-ExecutionPolicy -List`. Trên máy cá nhân do bạn quản lý, có thể cho phép script cục bộ bằng `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`; không vượt chính sách máy do tổ chức quản lý. Không cần `Bypass` hay quyền Administrator để chạy ba lệnh Ginny hiện có.

## 4. ChatGPT trên máy tính và điện thoại

1. Mở cùng tài khoản/cuộc trò chuyện nếu tính năng lịch sử của tài khoản cho phép.
2. Dán `prompts/ginny-system.md` vào chỉ dẫn của Project nếu tài khoản có Projects, hoặc vào đầu cuộc trò chuyện chuyên dùng cho Ginny.
3. Tạo việc trên bảng, sao chép bản giao việc vào ChatGPT/Codex. Trả kết quả về bảng bằng **Nộp kết quả**.
4. Với nhắc việc, dán câu lệnh từ **Nhắc qua ChatGPT** vào nơi có Tasks. Xem xác nhận lịch, ngày và múi giờ; bật thông báo trong ChatGPT và hệ điều hành điện thoại. Nếu không có Tasks, việc vẫn chỉ nằm trên bảng, chưa có nhắc nền.
5. Tạo thử một lời nhắc vài phút sau và xác nhận điện thoại thực sự nhận được thông báo. Sau đó xóa lời nhắc thử nếu cần.

Múi giờ mặc định của giao diện và prompt nhắc là **Asia/Bangkok, UTC+07:00**. Đây là UTC offset giống Việt Nam; nhãn được giữ theo thiết lập của phiên hiện tại. Chọn đúng ngày/giờ tuyệt đối trước khi dán vào Tasks.

## 5. Đồng bộ mã và sao lưu việc

```powershell
git status --short
git pull --ff-only
python -m ginny backup .ginny/backups/windows-01.sqlite3
```

Chỉ pull khi đã lưu/giải quyết thay đổi của bạn; không dùng reset để bỏ việc đang làm. Sao lưu dùng SQLite backup API nên có thể đọc khi bảng đang chạy. Giữ backup trong vị trí riêng được bảo vệ; `.ginny` bị loại khỏi Git.

Phục hồi: dừng bảng và mọi runner; giữ một bản database hiện tại bằng tên mới; dùng bản backup đã chọn làm database mới bằng `python -m ginny --db C:\DuongDan\backup.sqlite3 serve`, kiểm tra công việc rồi mới quyết định vị trí lâu dài. Không chép đè database đang mở. Nếu dùng `--db` khác mặc định, mọi CLI/runner phải dùng cùng `--db` hoặc `GINNY_DB`.

Chưa thiết lập tự khởi động Windows, truy cập từ điện thoại vào bảng, hay đồng bộ database cloud. Nhắc qua ChatGPT Tasks hoạt động theo dịch vụ ChatGPT, không phụ thuộc cửa sổ Ginny đang mở sau khi lịch đã được tạo thành công.
