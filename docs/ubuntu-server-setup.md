# Ubuntu 26.04 LTS: cài Ginny và bảo vệ quản trị

Cập nhật 01/11/2026 (Asia/Bangkok). Người dùng đã cài Ubuntu 26.04 LTS và có Internet; chưa có kết nối điều khiển server từ phiên Codex. Các bước dưới đây **do người dùng chạy trên Ubuntu**, không phải báo cáo đã cài xong. Docker chính thức hiện liệt kê Ubuntu Resolute 26.04 LTS là bản hỗ trợ: [nguồn Docker](https://github.com/docker/docs/blob/main/content/manuals/engine/install/ubuntu.md).

Ảnh lỗi cho thấy shell đang tại `/root`: Python tìm `/root/deploy/openclaw/prepare.py`, không phải thư mục dự án. Cần tải repo rồi vào đúng thư mục. Bộ cài đang ở nhánh **`feat/ginny-control`**; không giả định đã merge vào `main`.

Người dùng đã xác nhận: OAM riêng cho SSH/giám sát, SSH port 22 đang dùng mật khẩu; Ginny không được quản lý mạng OAM. Các web service thử nghiệm cũ được phép dừng/thay thế, nhưng cần xác định unit trước. Phạm vi tài nguyên là CPU/RAM và dung lượng thư mục, **chưa repartition ổ đĩa**. Địa chỉ IP và log máy thật giữ ở cấu hình triển khai riêng, không lưu vào Git. Xem [tách OAM và phân bổ tài nguyên](server-oam-resources.md).

## 1. Tải mã và kiểm tra trước khi cài

Các lệnh phần này dành cho phiên **root** hiện tại (`sudo -i` đã thực hiện). Chạy từng khối; lỗi ở khối nào thì giữ log và xử lý khối đó trước. Không chép dấu nhắc `root@...#` hoặc dấu ``` vào terminal.

```bash
apt-get update
apt-get install -y git python3 curl ca-certificates
install -d -m 0755 /srv/ginnyai/source
```

Nếu chưa có checkout ở đường dẫn dưới, tải mới:

```bash
git clone --branch feat/ginny-control --single-branch https://github.com/Ha-Hoang-1102/GinnyAI.git /srv/ginnyai/source/GinnyAI
```

Nếu Git báo đích đã tồn tại, **không xóa thư mục hoặc chạy `reset --hard`**. Kiểm tra `git -C /srv/ginnyai/source/GinnyAI status --short --branch`; cập nhật bằng `pull --ff-only` khi đúng repo/nhánh và không có sửa đổi cần giữ. Nếu repo yêu cầu xác thực, dùng quyền GitHub của mình qua cơ chế đăng nhập chính thức; không đưa token vào URL hoặc gửi token trong chat.

```bash
cd /srv/ginnyai/source/GinnyAI
git branch --show-current
test -f deploy/openclaw/prepare.py && echo 'Đã tìm thấy bộ cài Ginny'
bash /srv/ginnyai/source/GinnyAI/scripts/audit-server.sh
hostname -I
```

Kỳ vọng nhánh `feat/ginny-control`, thông báo đã tìm thấy bộ cài; report cho biết OS, kiến trúc, ổ đĩa, cổng đang nghe, SSH/firewall và Docker. Chạy script bằng đường dẫn tuyệt đối được từ cả `/root`. Report không đọc token/private key; IP và tên tài khoản vẫn là thông tin hạ tầng nên xem lại trước khi chia sẻ.

Trước khi lưu media/database, xác minh `/srv` thực sự thuộc filesystem mong muốn. Ổ 2 TB chưa mount vào `/srv` thì dữ liệu ở đây sẽ dùng ổ hệ điều hành. Không format, đổi partition hoặc di chuyển Docker root theo phỏng đoán. Bộ image Ginny hiện pin **amd64/x86_64**; ARM cần chọn image tương ứng trước khi tiếp tục.

## 2. Tài khoản quản trị và cập nhật

Giữ console/phiên root hiện tại để phục hồi. Theo ảnh, tài khoản người dùng là `hoanghm`. Kiểm tra:

```bash
id hoanghm
getent group sudo
systemctl status ssh.service ssh.socket --no-pager
```

Tài khoản quản trị hàng ngày dùng SSH key + sudo. Không cần bật root SSH. Không thêm tài khoản vào nhóm `docker` chỉ để tránh sudo: quyền điều khiển Docker daemon tương đương quyền root trên host.

Cài công cụ nền (chưa bật firewall hoặc đổi SSH bằng khối này):

```bash
apt-get install -y openssh-server ufw fail2ban unattended-upgrades
apt-get --simulate upgrade
```

Đọc danh sách gói/dịch vụ cần khởi động lại. Với máy mới không có workload cần giữ, chạy `apt-get upgrade`; reboot kernel thực hiện sau khi có đường truy cập phục hồi và thời điểm bảo trì. Không bật tự reboot không báo trước cho hệ thống 24/7.

Cấu hình security updates theo gói Ubuntu:

```bash
dpkg-reconfigure -plow unattended-upgrades
```

Chọn **Yes** cho cập nhật tự động. Kiểm tra `apt-config dump` chỉ các trường cần thiết và `systemctl list-timers 'apt-*'`; log ở `/var/log/unattended-upgrades/`. Đối chiếu nguồn được phép cập nhật trong `/etc/apt/apt.conf.d/50unattended-upgrades`: không giả định Docker repo bên ngoài đã được tự cập nhật. Nâng Docker/OpenClaw có phiên bản, kiểm tra tương thích và backup; không giữ image pin mãi khi có bản vá cần áp dụng.

## 3. SSH key trước, siết SSH sau

**Chưa chạy bước siết SSH/firewall nếu chưa xác nhận cổng đang dùng và chưa thử thành công một phiên SSH key thứ hai.** Đây là điều kiện để tránh mất quyền quản trị, không phải yêu cầu cung cấp mật khẩu cho Codex.

Trên Windows PowerShell, tạo key riêng nếu chưa có. Nếu file đã tồn tại, giữ key đó hoặc chọn tên mới; không ghi đè key đang dùng:

```powershell
ssh-keygen -t ed25519 -a 64 -f "$env:USERPROFILE\.ssh\ginny_ed25519"
Get-Content "$env:USERPROFILE\.ssh\ginny_ed25519.pub"
```

Đặt passphrase. Dòng từ file `.pub` là **public key** để thêm vào `~hoanghm/.ssh/authorized_keys` trên server; private key không rời máy quản trị. Thư mục `.ssh` quyền `700`, `authorized_keys` quyền `600`, owner là `hoanghm`. Giữ nguyên các key đã có. Có thể thêm public key qua console hiện tại nếu chưa có SSH từ Windows.

Mở cửa sổ PowerShell thứ hai, thay `SSH_PORT` và `SERVER_IP` bằng giá trị thực:

```powershell
ssh -i "$env:USERPROFILE\.ssh\ginny_ed25519" -p SSH_PORT -o PreferredAuthentications=publickey -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no hoanghm@SERVER_IP
```

Trong phiên mới chạy `sudo -v` để xác minh quyền sudo. Khi kiểm tra này đạt và còn console phục hồi, cấu hình SSH có thể dùng file riêng `/etc/ssh/sshd_config.d/00-ginny-hardening.conf` với nội dung:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitEmptyPasswords no
MaxAuthTries 3
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding local
GatewayPorts no
PermitTunnel no
```

Giữ local forwarding để mở UI qua SSH tunnel. Không đổi cổng SSH hoặc thêm `AllowUsers` khi chưa kiểm tra các tài khoản/dịch vụ đang dùng. Nếu có cấu hình MFA dùng keyboard-interactive, phải giữ cơ chế đó thay vì áp dụng mẫu này nguyên trạng.

Sao lưu cấu hình SSH hiện có vào thư mục root riêng trước khi sửa. OpenSSH thường dùng giá trị đầu tiên đọc được; `Match`/cloud-init có thể ảnh hưởng kết quả. Chạy `/usr/sbin/sshd -t`, kiểm tra `/usr/sbin/sshd -T` và `sshd -T -C user=hoanghm,addr=CLIENT_IP,host=CLIENT_HOST` với đúng kết nối cần dùng. Chỉ khi kết quả đúng mới `systemctl reload ssh`. Giữ phiên cũ, mở thêm một phiên mới để thử; nếu thất bại, phục hồi cấu hình qua phiên cũ/console. Ubuntu có thể dùng `ssh.socket`; không tắt socket hoặc đổi listen port theo phỏng đoán.

## 4. Firewall cho OAM riêng và chống thử mật khẩu

Giữ nguyên đường OAM đang hoạt động. Dùng UFW **hoặc** bộ quy tắc firewall hiện có; không trộn hoặc reset firewall. Trước khi thay đổi phải biết đúng interface OAM, IP/subnet nguồn quản trị và rule hiện có. Subnet nguồn SSH có thể đi qua router OAM, không nhất thiết là subnet gắn trực tiếp vào card. Không mở port 22 trên tất cả interface.

```bash
# Chỉ đọc trước; không bật hoặc reset firewall ở bước này.
ufw status verbose
ip -br addr
ip route
ss -lntup
```

Chính sách đích: chỉ OAM được vào SSH/giám sát; phía dịch vụ chỉ công bố HTTPS khi có domain và xác thực. Rule allow OAM được đặt và kiểm tra **trước** default deny/enable. Kiểm tra IPv4/IPv6. Không mở 18789, 18790, 8765, 5173 hoặc database ra Internet. Cần chặn cả chiều Ginny khởi tạo kết nối vào OAM; inbound firewall riêng chưa đủ.

Nếu có IP quản trị cố định/VPN thì có thể thu hẹp SSH theo nguồn sau khi thử; không giới hạn vào IP động hiện tại rồi coi sẽ luôn truy cập được. Public Internet/VPN/router/CGNAT là các đường vào khác nhau, cần xác nhận trước khi hướng dẫn port forwarding.

Không áp mẫu SSH-password-off cho máy hiện tại trước khi kiểm tra key; không đổi listen address/port của `ssh.socket` trong lúc đang dựa vào phiên OAM này.

Fail2ban là lớp bổ sung, không thay SSH key. Sau khi đã xác minh port, tạo `/etc/fail2ban/jail.d/ginny-sshd.local` (đổi `22` thành port thật):

```ini
[sshd]
enabled = true
backend = systemd
port = 22
maxretry = 5
findtime = 10m
bantime = 1h
```

Kiểm tra `fail2ban-client -t` trước khi restart; sau đó `systemctl enable --now fail2ban`, `systemctl restart fail2ban`, `fail2ban-client status sshd`. Không thử brute force từ IP quản trị của mình.

## 5. Docker từ nguồn chính thức

Nếu `docker version` và `docker compose version` hoạt động, giữ bản cài hiện có để đánh giá trước, bỏ qua khối cài mới. Nếu có `docker.io`, Podman hoặc containerd đang phục vụ workload khác, không tự gỡ để cài chồng. Các lệnh sau dành cho máy Ubuntu mới **chưa có Docker/source Docker**:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
GINNY_UBUNTU_SUITE="${UBUNTU_CODENAME:-$VERSION_CODENAME}"
GINNY_CPU_ARCH="$(dpkg --print-architecture)"
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $GINNY_UBUNTU_SUITE
Components: stable
Architectures: $GINNY_CPU_ARCH
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker version
docker compose version
```

Không dùng repo của 24.04 để lách lỗi trên 26.04. Không bỏ TLS hoặc kiểm tra chữ ký APT. Nếu gặp lỗi repository/signature, dừng và xử lý lỗi đó.

Docker publish port có thể đi ngoài rule UFW; vì vậy Compose Ginny bind rõ **127.0.0.1**, không dựa vào UFW để che cổng container. Không mở Docker TCP API, không mount `/var/run/docker.sock` hoặc cả ổ host vào Gateway. Container chạy UID 1000, bỏ capabilities và `no-new-privileges`; đó là giới hạn quyền, không phải bảo đảm chống mọi khai thác.

## 6. Khởi động Ginny/OpenClaw

Trước khi thay thế giao diện thử cũ, báo cáo `audit-server.sh` xác định process/cgroup của cổng 3000. Nếu Nginx đúng do `nginx.service` quản lý, có thể `systemctl disable --now nginx`; dừng Node theo **unit/PM2 process đã xác định**, không `pkill node` hoặc xóa thư mục source. Không thay đổi SSH/OAM. Giữ package Nginx để có thể dùng lại làm reverse proxy sau; không cài đồng thời hai proxy tranh cổng.

```bash
cd /srv/ginnyai/source/GinnyAI
python3 deploy/openclaw/prepare.py /srv/ginnyai/data/openclaw
```

Chỉ chạy initializer cho thư mục mới. Nếu đã tồn tại, giữ nguyên dữ liệu; không xóa để chạy lại. Chỉ đổi file trong repo cũng không tự cập nhật config đang dùng ở `data/openclaw/state`.

Định nghĩa hàm ở mỗi terminal quản trị; đường dẫn tuyệt đối nên dùng được cả khi đang ở `/root`:

```bash
ginnyoc() {
  docker compose --env-file /srv/ginnyai/data/openclaw/compose.env \
    -f /srv/ginnyai/source/GinnyAI/deploy/openclaw/compose.yaml "$@"
}
ginnyoc config --quiet
ginnyoc pull
ginnyoc run --rm --no-deps gateway node dist/index.js config validate --json
ginnyoc up -d
ginnyoc ps
```

Chờ khởi động rồi kiểm tra:

```bash
curl --fail http://127.0.0.1:18789/healthz
curl --fail http://127.0.0.1:18789/readyz
ginnyoc exec gateway node dist/index.js security audit
```

Nếu chưa ready, xem `ginnyoc logs --tail 100 gateway` trên máy và xử lý lỗi; không gửi toàn bộ log chứa tin nhắn, khóa hoặc mã đăng nhập lên chat. `config --quiet` tránh in token; không dùng toàn bộ `docker inspect`/config dump để gửi báo cáo.

Kiểm tra bảo mật của OpenClaw không thay audit hệ điều hành. Bản cấu hình cập nhật tắt terminal quản trị, browser, tự duyệt thiết bị, elevated/exec, cron/heartbeat/embedding; các agent chỉ xem phiên của mình và cây phiên con được giao. Việc đăng nhập native Codex/Claude cần kiểm tra quyền native tools riêng.

## 7. UI, model và Telegram

Giao diện Ginny Control trong repo đã chuyển sang **React + Vite, build bằng Node.js**, không dùng PHP. Bản build đi kèm nên không bắt buộc cài Node trên server để xem dashboard; muốn phát triển/build từ source xem [frontend/README.md](../frontend/README.md). Backend hiện vẫn là Python/SQLite loopback. OpenClaw Control UI và Ginny Control là hai giao diện riêng; adapter đồng bộ và public authentication cho Ginny Control chưa được triển khai. Không công bố Vite dev/preview ra Internet.

Muốn chạy riêng dashboard xanh như service, repo có [ginny-control.service](../deploy/systemd/ginny-control.service). Từ terminal root, sau khi checkout đã ở đúng đường dẫn và cổng 8765 còn trống:

```bash
id ginny-control || useradd --system --user-group --no-create-home --shell /usr/sbin/nologin ginny-control
install -d -o ginny-control -g ginny-control -m 0750 /srv/ginnyai/data/control
install -m 0644 /srv/ginnyai/source/GinnyAI/deploy/systemd/ginny-control.service /etc/systemd/system/ginny-control.service
systemctl daemon-reload
systemctl enable --now ginny-control
systemctl status ginny-control --no-pager
curl --fail http://127.0.0.1:8765/api/health
```

Nếu user/unit đã tồn tại, kiểm tra đúng là thành phần Ginny trước khi dùng hoặc ghi đè. Service giới hạn 1 CPU/1 GB RAM, chỉ ghi thư mục database, không có sudo/capability, kết nối IP chỉ cho localhost qua systemd IP filtering khi kernel hỗ trợ. Xem log để phát hiện cơ chế hardening không được host hỗ trợ; không coi file unit là chứng minh isolation đã thực thi. Dùng SSH tunnel cổng 8765 để xem React dashboard; vẫn là quy trình giao việc thủ công. Service này không cần PHP hoặc Node runtime vì JS đã build, và không được mở public trước khi có API auth.

Trên Windows mở tunnel bằng tài khoản đã có SSH key, thay IP/port thực:

```powershell
ssh -i "$env:USERPROFILE\.ssh\ginny_ed25519" -p SSH_PORT -N -L 18789:127.0.0.1:18789 hoanghm@SERVER_IP
```

Trong trình duyệt cùng máy nhập loopback `127.0.0.1`, cổng `18789`. Trên terminal server riêng lấy token bằng `ginnyoc exec gateway node dist/index.js gateway auth-token --show`, dán vào Gateway secret; **không gửi token hoặc ảnh chụp token cho Codex**. Nếu cần pairing, chạy `devices list`, đối chiếu thiết bị, rồi `devices approve REQUEST_ID` qua cùng CLI.

Tiếp tục [đăng nhập Codex và Telegram](openclaw-setup.md#4-đăng-nhập-model-theo-thuê-bao). Không có API budget riêng nên chọn đường đăng nhập thuê bao chính thức nếu tài khoản được hỗ trợ; chưa bật paid fallback. Telegram chỉ nhận người đã ghép đôi, group disabled; token lưu ngoài Git.

Lưu Telegram token bằng nhập ẩn tại terminal root trên server (không đưa token vào command history):

```bash
read -r -s -p 'Telegram bot token (không hiển thị): ' GINNY_TELEGRAM_TOKEN
printf '\n'
printf '%s' "$GINNY_TELEGRAM_TOKEN" | ginnyoc exec -T --user 1000:1000 gateway node -e '
const fs = require("node:fs");
const token = fs.readFileSync(0, "utf8").trim();
if (!token || /[\r\n]/.test(token)) throw new Error("Token trống/không hợp lệ");
const dir = "/home/node/.openclaw/secrets";
fs.mkdirSync(dir, {recursive: true, mode: 0o700});
fs.writeFileSync(dir + "/telegram-token", token + "\n", {mode: 0o600, flag: "wx"});
console.log("Đã lưu file riêng; chưa bật Telegram");
'
unset GINNY_TELEGRAM_TOKEN
```

Lệnh ghi bằng user không root **bên trong container**, không đi theo đường dẫn trong state bằng quyền root host; từ chối ghi đè token cũ. Sau đó đặt `channels.telegram.tokenFile`, bật channel và ghép đôi theo tài liệu OpenClaw. Chỉ báo thành công sau khi đã nhận và trả lời được tin nhắn thật từ đúng tài khoản.

## 8. Public HTTPS và vận hành 24/7

Chưa có domain thì dùng tunnel quản trị và Telegram trước. Khi đã xác định IP public/CGNAT và domain, triển khai reverse proxy HTTPS; giữ Gateway token, device pairing và origin allowlist. Có thể bổ sung lớp đăng nhập có MFA ở proxy. Không mở Gateway trực tiếp ra Internet để thay cho HTTPS. Không cần root SSH hay web terminal để dùng dashboard.

Các điều kiện cần kiểm chứng trước khi gọi là vận hành hoàn thiện:

- Đăng nhập SSH key/sudo thành công, root/password SSH bị chặn theo cấu hình thực; thử một lần có kiểm soát từ phiên khác, không brute force.
- Chỉ những cổng chủ động công bố mới truy cập được từ mạng ngoài, gồm IPv6; cần kiểm tra từ ngoài server, không chỉ nhìn `ss` trên host. Codex chưa quét máy người dùng.
- Docker/Gateway lên lại sau reboot có kế hoạch; restart giữ dữ liệu. Container unhealthy cần giám sát riêng, `restart: unless-stopped` không tự chữa mọi lỗi.
- Sao lưu state **và** `compose.env` vào kho riêng được mã hóa, có một bản ngoài ổ/máy này và thử restore. Nếu dùng tar, dừng Gateway để snapshot nhất quán rồi khởi động lại; không commit backup chứa credentials. Backup chỉ trên cùng HDD không bảo vệ khỏi hỏng ổ.
- Theo dõi lỗi đăng nhập, sức khỏe dịch vụ, ổ đĩa/log và lịch cập nhật. Không ghi token/chat đầy đủ vào log công khai. Cảnh báo Telegram cần token/kết nối thật và phải thử gửi thành công.
- Quota/model, Postiz/OAuth và media phải kiểm tra riêng. Chưa có URL chính xác của highfeel/muse/Veo thì chưa coi đã kết nối các dịch vụ này. Cài server không tự hoàn tất connector nghiệp vụ.

## Phạm vi kiểm tra đã làm

Đã rà cấu hình repo và chạy công cụ audit OpenClaw trên state thử trong cloud; sau điều chỉnh, kiểm tra schema/auth/UI/restart được chạy lại. Đây là kiểm tra cấu hình và chức năng ở cloud Linux, **không phải pentest hoặc audit Ubuntu của người dùng**. Cài Docker/SSH/UFW trên 26.04 và public ingress cần xác nhận bằng kết quả trên server thật. Không có cấu hình nào bảo đảm chặn mọi tấn công.

Khi gửi kết quả để tiếp tục, ưu tiên: `scripts/audit-server.sh`, `ginnyoc ps`, kết quả health/readiness và lỗi liên quan đã loại bí mật. Không gửi private key, token, file `.env` hoặc toàn bộ cấu hình chứa secrets.
