#!/usr/bin/env bash
# Read-only report. Does not change SSH/firewall, install tools or read credentials.
set -uo pipefail
ginny_repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ginny_repo/scripts/check-server.sh"

printf '\n=== Network listeners ===\n'
if command -v ss >/dev/null 2>&1; then ss -lntup; fi
if command -v ip >/dev/null 2>&1; then
  ip -br addr
  ip route
  ip -6 route
fi

printf '\n=== Owner of the old test service on port 3000 (no command arguments or env) ===\n'
if command -v ss >/dev/null 2>&1; then
  ginny_old_pid="$(ss -H -lntp 'sport = :3000' | sed -nE 's/.*pid=([0-9]+).*/\1/p' | head -n 1)"
  if [[ "$ginny_old_pid" =~ ^[0-9]+$ && -d "/proc/$ginny_old_pid" ]]; then
    ps -p "$ginny_old_pid" -o pid,user,comm
    readlink "/proc/$ginny_old_pid/exe" || true
    readlink "/proc/$ginny_old_pid/cwd" || true
    cat "/proc/$ginny_old_pid/cgroup"
  else
    printf 'No PID available: service absent or insufficient permissions\n'
  fi
fi

printf '\n=== SSH effective global settings (Match rules require separate checks) ===\n'
if [[ -x /usr/sbin/sshd ]]; then
  if /usr/sbin/sshd -t; then
    /usr/sbin/sshd -T | awk '
      $1 ~ /^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|permitemptypasswords|maxauthtries|x11forwarding|allowagentforwarding|allowtcpforwarding|gatewayports|allowusers|allowgroups)$/ {print}
    '
  fi
else
  printf 'OpenSSH server executable not found\n'
fi

printf '\n=== Firewall ===\n'
if command -v ufw >/dev/null 2>&1; then ufw status verbose; else printf 'UFW not installed\n'; fi

printf '\n=== Updates and login protection ===\n'
if command -v systemctl >/dev/null 2>&1; then
  for ginny_service in ssh.service ssh.socket docker.service fail2ban.service apt-daily.timer apt-daily-upgrade.timer; do
    printf '%s: ' "$ginny_service"
    systemctl is-active "$ginny_service" || true
  done
fi
if command -v apt-config >/dev/null 2>&1; then
  apt-config dump | awk '/^APT::Periodic::(Update-Package-Lists|Unattended-Upgrade) / || /^Unattended-Upgrade::Automatic-Reboot / {print}'
fi
if command -v fail2ban-client >/dev/null 2>&1; then fail2ban-client status sshd || true; fi

printf '\n=== Accounts with host administration privileges ===\n'
awk -F: '$3 == 0 {print "UID 0:", $1}' /etc/passwd
if command -v getent >/dev/null 2>&1; then getent group sudo docker || true; fi

printf '\n=== Storage placement ===\n'
if command -v findmnt >/dev/null 2>&1; then
  for ginny_path in /srv /var/lib/docker; do
    if [[ -d "$ginny_path" ]]; then findmnt --target "$ginny_path" --output TARGET,SOURCE,FSTYPE,OPTIONS; fi
  done
fi
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker info --format 'Docker data root: {{.DockerRootDir}}'
  docker ps --format 'Container={{.Names}} Published ports={{.Ports}}'
  docker system df
fi

printf '\n=== Ginny private-file permissions (contents are never printed) ===\n'
for ginny_path in /srv/ginnyai/data/openclaw /srv/ginnyai/data/openclaw/compose.env /srv/ginnyai/data/openclaw/state /srv/ginnyai/data/openclaw/state/openclaw.json /srv/ginnyai/data/openclaw/state/secrets/telegram-token; do
  if [[ -e "$ginny_path" ]]; then stat -c '%a %U:%G %n' "$ginny_path"; fi
done
printf '\nNo changes were made. Missing tools/permissions are unknowns, not passed security checks.\n'
printf 'Review IP addresses and account names before sharing this report. Do not add secrets or full configuration dumps.\n'
