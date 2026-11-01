#!/usr/bin/env bash
# Read-only preflight for the actual Ubuntu server. No credentials or env dump.
set -euo pipefail

if [[ -r /etc/os-release ]]; then
  # System-provided OS metadata, not a project config or credentials file.
  . /etc/os-release
  printf 'Operating system: %s\n' "${PRETTY_NAME:-unknown}"
fi
printf 'Architecture: %s\n' "$(uname -m)"
printf 'Available logical CPUs: %s\n' "$(getconf _NPROCESSORS_ONLN)"
if command -v free >/dev/null 2>&1; then free -h; fi

printf '\nStorage (no serial numbers):\n'
if command -v lsblk >/dev/null 2>&1; then
  lsblk -d -o NAME,TYPE,SIZE,ROTA || true
fi
for ginny_path in / /srv /var/lib/docker; do
  if [[ -d "$ginny_path" ]]; then df -hT "$ginny_path"; fi
done

printf '\nInstalled tools:\n'
for ginny_tool in git python3 docker ffmpeg; do
  if command -v "$ginny_tool" >/dev/null 2>&1; then
    printf '%s: available\n' "$ginny_tool"
  else
    printf '%s: not on PATH\n' "$ginny_tool"
  fi
done
if command -v docker >/dev/null 2>&1; then
  docker --version
  if ! docker compose version; then printf 'Docker Compose: unavailable\n'; fi
  if docker info >/dev/null 2>&1; then
    printf 'Docker daemon: accessible to this user\n'
  else
    printf 'Docker daemon: not accessible or not running (not diagnosed further)\n'
  fi
fi
printf '\nThis report is for the machine where the script was run; no changes were made.\n'
