# Cài trên Windows 11

## Quy ước ổ đĩa

Máy Windows dùng **`E:\GinnyAI` làm thư mục gốc duy nhất của dự án**. PowerShell, Python, Git và các thành phần tích hợp Windows được cài ở vị trí mặc định trên ổ C; không chuyển thư mục cài đặt của các công cụ này sang E.

| Nội dung | Vị trí trên Windows |
|---|---|
| Source code, `.git`, README, file `.md`, prompt, script | `E:\GinnyAI` và các thư mục con trong repo |
| Database công việc | `E:\GinnyAI\.ginny\tasks.sqlite3` |
| Dữ liệu đầu vào, tài liệu cá nhân | `E:\GinnyAI\.ginny\data` |
| Bài viết, hình ảnh và file đầu ra | `E:\GinnyAI\.ginny\artifacts` |
| Bản sao lưu database | `E:\GinnyAI\.ginny\backups` |
| Log của dự án | `E:\GinnyAI\.ginny\logs` |
| File tạm của các tiến trình dự án được mở từ phiên đã cấu hình | `E:\GinnyAI\.ginny\tmp` |

File `.md` dùng chung cho dự án nằm trong repo để đồng bộ GitHub. File `.md` chứa công việc hoặc dữ liệu cá nhân đặt trong `.ginny\data` hoặc `.ginny\artifacts`; toàn bộ `.ginny` đã được loại khỏi Git. Một bản sao lưu trên cùng ổ E chỉ giúp phục hồi thao tác nhầm, không bảo vệ khi ổ E hỏng; bản sao dự phòng ngoài ổ E cần được lưu riêng nếu bạn chọn sử dụng.

Quy ước này áp dụng cho máy Windows. Checkout cloud vẫn ở `/workspace/GinnyAI`; các ứng dụng ChatGPT, trình duyệt và Windows tự quản lý dữ liệu của chúng theo cấu hình riêng. Hướng dẫn không thay đổi thư mục hồ sơ hay biến môi trường toàn hệ thống của Windows.

## 1. Cài công cụ

Trong Terminal/PowerShell của Windows 11:

```powershell
winget install --id Microsoft.PowerShell --exact --source winget
winget install --id Python.Python.3.12 --exact --source winget
winget install --id Git.Git --exact --source winget
```

Nếu đã có công cụ đạt yêu cầu, bỏ qua bước tương ứng. Giữ vị trí cài đặt mặc định trên ổ C. Mở lại Terminal sau khi cài. Dùng **PowerShell 7 (`pwsh`)**, không phải Windows PowerShell 5.1.

```powershell
pwsh --version
python --version
git --version
```

Python phải từ 3.11, PowerShell từ 7.4. Nếu `python` mở Microsoft Store, dùng `py -3` thay cho `python` trong các lệnh dưới và chỉnh App execution aliases/PATH theo bản Python vừa cài.

## 2. Lấy mã và chạy bảng

Chỉ dùng khối clone sau khi chưa có repo trên máy và `E:\GinnyAI` chưa tồn tại:

```powershell
if (-not (Test-Path -LiteralPath 'E:\' -PathType Container)) {
    throw 'Không tìm thấy ổ E. Kiểm tra ổ đĩa trước khi tiếp tục.'
}
if (Test-Path -LiteralPath 'E:\GinnyAI') {
    throw 'E:\GinnyAI đã tồn tại. Kiểm tra và dùng repo hiện có; không clone đè.'
}
git clone --branch feat/ginny-control https://github.com/Ha-Hoang-1102/GinnyAI.git E:\GinnyAI
if ($LASTEXITCODE -ne 0) { throw 'Clone thất bại; kiểm tra lỗi Git trước khi tiếp tục.' }
Set-Location E:\GinnyAI
```

Nhánh triển khai hiện tại là `feat/ginny-control`; sau khi được gộp, có thể dùng `main`. Nếu repo đã có tại `E:\GinnyAI`, vào thẳng thư mục đó và kiểm tra `git status --short --branch`. Xác thực GitHub qua trình quản lý Git nếu repo yêu cầu.

**Nếu trước đây đã lưu ở `C:\Projects\GinnyAI`:** dừng bảng và mọi runner trước khi sao chép. Sao chép toàn bộ thư mục sang `E:\GinnyAI`, bao gồm `.git`, `.ginny`, file ẩn và các file chưa commit; giữ bản cũ cho đến khi kiểm tra xong. Nếu thư mục đích đã có dữ liệu, kiểm tra hai bản trước, không ghi đè hoặc gộp tự động. Sau khi chuyển, kiểm tra `git status`, danh sách công việc và sửa shortcut/terminal đang trỏ vào đường dẫn cũ. Các file ngoài thư mục repo hoặc được trỏ tới qua liên kết cần được kiểm tra riêng.

### Cấu hình phiên PowerShell của dự án

Chạy khối sau **trong mỗi cửa sổ PowerShell dùng cho GinnyAI**, trước các lệnh Python hoặc runner. Các biến chỉ áp dụng trong cửa sổ hiện tại và các tiến trình được mở từ đó:

```powershell
Set-Location E:\GinnyAI
$ginnyLocalRoot = 'E:\GinnyAI\.ginny'
foreach ($ginnyFolder in @('data', 'artifacts', 'backups', 'logs', 'tmp')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ginnyLocalRoot $ginnyFolder) | Out-Null
}
$env:GINNY_DB = Join-Path $ginnyLocalRoot 'tasks.sqlite3'
$env:TEMP = Join-Path $ginnyLocalRoot 'tmp'
$env:TMP = $env:TEMP
```

`GINNY_DB` chọn rõ database trên E, kể cả khi trước đó có cấu hình trỏ sang C. `TEMP`/`TMP` đặt vùng tạm cho tiến trình dự án trong phiên này; không di chuyển vùng tạm của Windows hay ứng dụng đã chạy ở cửa sổ khác. Nếu cấu hình cũ từng dùng một database ngoài repo, sao lưu và chuyển database đó trước khi chạy `init`, để tránh nhầm một database mới trống với dữ liệu cũ.

Sau đó chạy:

```powershell
python -m unittest discover -s tests -v
python -m ginny init
python -m ginny serve
```

Trên trình duyệt cùng máy, nhập `127.0.0.1:8765`. Không cần key AI. Để cửa sổ đang chạy mở; Ctrl+C dừng bảng. Lần sau, cấu hình phiên như trên rồi chạy `pwsh -File E:\GinnyAI\scripts\Start-Ginny.ps1`. Script khởi động dùng thư mục repo chứa nó và kế thừa `GINNY_DB`, `TEMP`, `TMP` từ phiên này.

## 3. Kiểm chứng PowerShell trên đúng máy

Mở cửa sổ PowerShell thứ hai, chạy lại khối **Cấu hình phiên PowerShell của dự án** ở mục 2 để dùng cùng database trên E, rồi chạy:

```powershell
python -m ginny create --file examples/powershell.json
python -m ginny list
# Thay 1 bằng ID thực tế vừa tạo:
python -m ginny run 1 --workspace .
```

Kết quả đúng: exit code 0, OS mô tả Windows, PowerShell đúng phiên bản, `Workspace` là `E:\GinnyAI`; trạng thái `awaiting_review`. Quay lại bảng để duyệt. Các lần chạy trong cloud Linux không chứng minh Windows đã hoạt động.

Kiểm tra vị trí lưu trữ thực tế trong phiên đang dùng:

```powershell
Get-Location
git rev-parse --show-toplevel
python -c "from pathlib import Path; import os, tempfile; print('Database:', Path(os.environ['GINNY_DB']).resolve()); print('Temp:', tempfile.gettempdir())"
Get-Item -LiteralPath E:\GinnyAI\.ginny\tasks.sqlite3
```

Thư mục repo, database và temp được báo phải nằm dưới `E:\GinnyAI`. Chỉ coi việc chuyển dữ liệu trên Windows là hoàn tất sau khi các kiểm tra này đúng và bảng hiển thị các công việc cần giữ.

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
Set-Location E:\GinnyAI
git status --short
git pull --ff-only
python -m ginny --db E:\GinnyAI\.ginny\tasks.sqlite3 backup E:\GinnyAI\.ginny\backups\windows-01.sqlite3
```

Chỉ pull khi đã lưu/giải quyết thay đổi của bạn; không dùng reset để bỏ việc đang làm. Sao lưu dùng SQLite backup API nên có thể đọc khi bảng đang chạy. Giữ backup trong vị trí riêng được bảo vệ; `.ginny` bị loại khỏi Git.

Phục hồi: dừng bảng và mọi runner; giữ một bản database hiện tại bằng tên mới. Sao chép bản backup cần dùng sang một file làm việc mới, ví dụ `E:\GinnyAI\.ginny\restored.sqlite3`, rồi kiểm tra bằng `python -m ginny --db E:\GinnyAI\.ginny\restored.sqlite3 serve`; giữ file backup gốc để có thể phục hồi lại. Không chép đè database đang mở. Nếu dùng `--db` khác mặc định, mọi CLI/runner phải dùng cùng `--db` hoặc `GINNY_DB`.

Chưa thiết lập tự khởi động Windows, truy cập từ điện thoại vào bảng, hay đồng bộ database cloud. Nhắc qua ChatGPT Tasks hoạt động theo dịch vụ ChatGPT, không phụ thuộc cửa sổ Ginny đang mở sau khi lịch đã được tạo thành công.

## 6. Cập nhật giao diện điều phối

Trong cửa sổ đang chạy Ginny, nhấn **Ctrl+C** để dừng dịch vụ, rồi cập nhật nhánh đã cài:

```powershell
Set-Location E:\GinnyAI
git status --short --branch
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'Chưa cập nhật được repo. Giữ nguyên file hiện có và kiểm tra lỗi Git.' }
py -3 -m ginny serve
```

Dùng cùng phiên PowerShell đã cấu hình `GINNY_DB` ở mục 2. Nếu mở cửa sổ mới, chạy lại khối cấu hình phiên trước khi khởi động. Nhấn **Ctrl+F5** trong trình duyệt để tải lại CSS và JavaScript. Bản giao diện mới có nền xanh, Ginny ở giữa và bốn nhóm AI bao quanh; mỗi nhóm chứa các vai trò agent và nhiệm vụ từ database hiện tại. Khi chưa có nhiệm vụ, sơ đồ vẫn hiển thị nhóm/agent nhưng các bộ đếm là 0. Không cần cài thêm thư viện cho ứng dụng hoặc thay database.
