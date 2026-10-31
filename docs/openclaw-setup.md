# Ginny harness: OpenClaw trên Ubuntu

Bộ chuẩn bị cho Ubuntu 24.04 **x86_64**, Telegram trước, Discord sau. Chưa triển khai trên server của người dùng; chưa có domain, đăng nhập model, bot token hoặc tài khoản mạng xã hội. OpenClaw Control UI là giao diện quản trị/chat của pilot. Bảng xanh Ginny Control hiện có vẫn là ứng dụng riêng, chưa đồng bộ công việc với harness.

## Bộ cấu hình có gì?

- [compose.yaml](../deploy/openclaw/compose.yaml): image chính thức OpenClaw **2026.10.9**, pin digest linux/amd64; chỉ publish `127.0.0.1:18789`, tự khởi động lại trừ khi chủ động dừng, health check, log rotation, giới hạn 2 CPU/4 GB RAM.
- [openclaw.json](../deploy/openclaw/openclaw.json): Ginny và năm vai trò nghiên cứu, biên tập, media, xuất bản, analytics. Token auth, ghép đôi thiết bị; tắt cron/heartbeat/embedding và hai kênh chat trước khi kết nối thật. Chưa chọn model hay API fallback.
- [prepare.py](../deploy/openclaw/prepare.py): tạo state, prompt vai trò và token Gateway ngẫu nhiên tại thư mục riêng, quyền thư mục `700`/file `600`; **từ chối thư mục đã tồn tại**, không ghi đè dữ liệu, không cài hoặc khởi động dịch vụ. Token không được in ra.
- Tool allowlist ban đầu chỉ cho điều phối/session; không cấp shell, browser, công cụ tạo media hay đăng bài. Native tools của Codex/Claude CLI vẫn phải kiểm tra riêng sau khi chọn runtime. Không coi cấu hình này là sandbox cho mọi chương trình bên trong container.

## 1. Kiểm tra server

Chạy `bash scripts/check-server.sh` tại checkout trên **server thật**. Kiểm tra Docker Engine/Compose và quyền dùng Docker, mount ổ 2 TB, dung lượng Docker root và kiến trúc x86_64. Docker chưa cài thì dùng [hướng dẫn Ubuntu chính thức](https://docs.docker.com/engine/install/ubuntu/); không chạy script tải từ nguồn lạ bằng root. Không tự di chuyển partition/Docker root.

Giữ source tại `/srv/ginnyai/source/GinnyAI` hoặc vị trí bạn quản lý. Windows vẫn dùng `E:\GinnyAI`; không đổi đường dẫn Windows thành đường dẫn Linux. Chọn filesystem dữ liệu trước bước tạo thư mục; `/srv` không tự nằm trên HDD 2 TB.

## 2. Chuẩn bị và khởi động

Tại thư mục repo trên Ubuntu, sau khi xác minh filesystem và Docker:

```bash
sudo python3 deploy/openclaw/prepare.py /srv/ginnyai/data/openclaw
```

Script tạo file cho UID/GID `1000`, tương ứng user của container. Nếu tài khoản quản trị dùng UID khác, dùng quyền quản trị để chạy Compose và đọc file riêng; không chmod dữ liệu thành public. Chỉ chạy initializer một lần cho thư mục mới. Khởi động lại dùng Compose, không chạy initializer lại.

Các lệnh sau dùng tài khoản được phép truy cập Docker và đọc file cấu hình riêng:

```bash
GINNY_COMPOSE_ENV=/srv/ginnyai/data/openclaw/compose.env
ginnyoc() {
  docker compose --env-file "$GINNY_COMPOSE_ENV" -f deploy/openclaw/compose.yaml "$@"
}
ginnyoc config --quiet
ginnyoc pull
ginnyoc run --rm --no-deps gateway node dist/index.js config validate --json
ginnyoc up -d
ginnyoc ps
curl --fail http://127.0.0.1:18789/healthz
curl --fail http://127.0.0.1:18789/readyz
```

`config --quiet` kiểm tra cấu trúc mà không in token đã nội suy. Không gửi `compose.env`, `docker inspect` chứa environment, hoặc toàn bộ config dump lên chat/Git. Không có API key thì đăng nhập UI vẫn được, nhưng chat với model chưa hoạt động. Health 200 không chứng minh model/Telegram/social đã kết nối.

## 3. Mở giao diện khi chưa có domain

Từ Windows PowerShell, thay user/IP bằng thông tin server thật:

```powershell
ssh -N -L 18789:127.0.0.1:18789 USER@SERVER_IP
```

Giữ cửa sổ SSH mở; trên cùng máy nhập địa chỉ loopback `127.0.0.1`, cổng `18789` vào trình duyệt. Đây là đường thử riêng, chưa phải giao diện public cho điện thoại. IP server chưa được cung cấp nên không thể nói hiện chạy trên IP nào của bạn.

Lấy Gateway token **chỉ trong terminal riêng trên server**, không gửi nội dung vào cuộc trò chuyện:

```bash
ginnyoc exec gateway node dist/index.js gateway auth-token --show
```

Dán vào ô Gateway secret của Control UI. Vì cấu hình tắt auto-approve, nếu UI yêu cầu pairing thì dùng `devices list`, đối chiếu đúng thiết bị rồi `devices approve REQUEST_ID` qua CLI trong server. Token là quyền quản trị, không chia sẻ cho người khác.

## 4. Đăng nhập model theo thuê bao

Ưu tiên kiểm tra Codex với gói ChatGPT hiện có, bằng luồng chính thức trong phiên bản đã pin:

```bash
ginnyoc exec gateway node dist/index.js models auth login --provider openai --device-code
ginnyoc exec gateway node dist/index.js models list --provider openai
```

Hoàn tất xác thực trên trang đăng nhập chính thức do CLI đưa ra, không gửi mã/token cho người khác. Sau đó chọn model tài khoản thực sự được cấp trong UI; kiểm tra runtime Codex và đường tính phí trước một tác vụ nhỏ. Không chọn API-key auth hoặc thêm paid fallback vì người dùng chưa có ngân sách API riêng.

Tài liệu OpenClaw còn có đường **Claude CLI với login hiện có**, nhưng phải cài CLI vào đúng môi trường và xác minh login/quota. Không mặc định mọi thao tác Claude CLI đều tính vào gói 20 USD: auth bằng API key có thể tính phí API. Chưa cấu hình đường này trong bộ thử. Gói thuê bao cũng không hứa đủ quota chạy nhiều agent liên tục.

## 5. Telegram trước, Discord sau

1. Tạo bot riêng qua **@BotFather** chính thức. Lưu bot token bằng secret manager hoặc file thường riêng trong `state/secrets/telegram-token`, quyền `600`, owner UID 1000. Không dán token vào chat, commit hoặc dòng lệnh lưu trong shell history.
2. Qua CLI cấu hình `channels.telegram.tokenFile` thành `/home/node/.openclaw/secrets/telegram-token`, rồi `channels.telegram.enabled` thành `true`. Giữ `dmPolicy: pairing`, `groupPolicy: disabled`, `configWrites: false`. Binding mặc định đã trỏ về Ginny.
3. Kiểm tra `channels status --probe`. Gửi tin từ đúng tài khoản Telegram của bạn tới bot; xem `pairing list telegram`, xác nhận user ID, rồi `pairing approve telegram CODE` trên server. Không duyệt yêu cầu của người không biết.
4. Thử một yêu cầu ngắn: nhận → xử lý → kết quả. Thử người chưa ghép đôi không giao việc được. Kiểm tra restart và mất mạng; chưa đạt thì chưa bật lịch báo cáo. Long polling không cần domain hay inbound webhook.
5. Khi Telegram ổn, mới tạo Discord application/bot, giới hạn guild/channel/user và kiểm tra tương tự. Zalo/Viber chưa nằm trong pilot.

Ví dụ cú pháp CLI (không có token thật):

```bash
ginnyoc exec gateway node dist/index.js config set channels.telegram.tokenFile /home/node/.openclaw/secrets/telegram-token
ginnyoc exec gateway node dist/index.js config set channels.telegram.enabled true
ginnyoc exec gateway node dist/index.js channels status --probe
ginnyoc exec gateway node dist/index.js pairing list telegram
```

## 6. Chuyển thành giao diện public có xác thực

Sau khi có domain/subdomain và đường vào server, đặt reverse proxy HTTPS trước Gateway. [Caddyfile.example](../deploy/openclaw/Caddyfile.example) dành cho **Caddy chạy trên host**, cần thay domain và kiểm tra DNS/chứng chỉ. Nếu server sau CGNAT, xác định tunnel/điểm vào phù hợp trước; template không tạo kết nối Internet.

Đặt `gateway.publicOrigin` thành origin HTTPS thật và `gateway.controlUi.allowedOrigins` thành danh sách chứa đúng origin đó, validate rồi restart. Giữ token auth và device pairing; không bật tùy chọn bỏ kiểm tra origin hoặc bỏ xác thực thiết bị. Khi dùng forwarded client IP, chỉ trust đúng địa chỉ reverse proxy do mình kiểm soát, không toàn bộ LAN/Internet. Kiểm tra lại WebSocket, login sai, pairing từ điện thoại và thời hạn session qua HTTPS.

Không mở các cổng 18789/18790/database trực tiếp ra Internet. Ginny Control Python cổng 8765 vẫn chỉ ở loopback. Cấu hình Caddy mới là mẫu; HTTPS/public ingress chưa được chạy thử ở cloud này.

## 7. Vận hành và nâng cấp

- `ginnyoc restart` để kiểm tra khởi động lại; `ginnyoc stop` dừng có chủ đích. Restart policy không thay giám sát: Docker không tự restart chỉ vì container mang nhãn unhealthy. Cần alert/health monitoring và kiểm tra reboot thật.
- Sao lưu nhất quán toàn bộ state/config bằng snapshot khi đã dừng Gateway, hoặc cơ chế backup được phiên bản OpenClaw hỗ trợ. Bản sao chứa phiên đăng nhập và token phải được bảo vệ/mã hóa. Thử restore ở môi trường riêng; không chạy đồng thời hai Gateway dùng cùng bot/state.
- Chỉ bật lịch khi đã có quota và mục tiêu rõ. Nhắc qua Telegram/cron không tạo ChatGPT Tasks; hai lịch là hai hệ thống riêng.
- Postiz, kết nối Facebook/TikTok/YouTube và media triển khai ở bước kế tiếp theo [kế hoạch 24/7](server-24x7-plan.md). Có cấu hình agent publisher/media không đồng nghĩa các connector đó đã tồn tại.
- Nâng version có kiểm tra schema và rollback/backup; không đổi tag sang `latest` để tự nâng không kiểm soát. Không coi việc restart được là bằng chứng một job đang chạy sẽ tự tiếp tục đúng bước.

## Kiểm chứng trong cloud

Ngày 31/10/2026: Compose qua `config --quiet`. Image Docker chính thức lấy được manifest nhưng pull thất bại ở giải nén (`no space left on device` của dịch vụ Docker cloud); **chưa xác minh container chạy**. Không dùng kết quả này để kết luận server Ubuntu thiếu chỗ.

Đã cài OpenClaw npm 2026.10.9 để kiểm tra trực tiếp bằng Node 24.22.1 trong cloud. Node được đối chiếu SHA256 từ nguồn Node.js chính thức; npm kiểm tra integrity gói. Schema cấu hình deployment đã validate thành công. Kiểm tra chức năng [tests/openclaw_smoke.py](../tests/openclaw_smoke.py) **đã đạt**: initializer giữ dữ liệu cũ và quyền file riêng, chạy Gateway thật, UI/readiness, từ chối request chưa xác thực, đọc sáu vai trò bằng token, từ chối exec và restart giữ cấu hình/workspace. Không gửi tin Telegram, không chạy model, không tạo media hoặc đăng bài.

Cloud có helper [install-openclaw-test.sh](../scripts/install-openclaw-test.sh) để tái tạo runtime kiểm tra; helper tắt npm lifecycle scripts, không cài/login native model runtime. Đây không phải bộ cài production Ubuntu. Bản production dùng image chính thức trong Compose.

Lệnh kiểm tra (môi trường phát triển có Node phù hợp):

```bash
python3 tests/openclaw_smoke.py /absolute/path/to/openclaw/dist/index.js
```

Các bước cần tài khoản thật, Docker trên server và domain vẫn là kiểm tra chưa thực hiện; không gọi toàn hệ thống đã sẵn sàng 24/7.
