#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/cloud-env.sh
python3 -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11+ required"'
test "$(uname -m)" = x86_64
ginny_tool_dir="$ginny_tools_root/powershell-7.6.8"
mkdir -p "$ginny_tool_dir"
if [[ ! -x "$ginny_tool_dir/pwsh" ]]; then
  ginny_archive="$ginny_tool_dir/powershell-7.6.8-linux-x64.tar.gz"
  if [[ ! -f "$ginny_archive" ]]; then
    curl -fL --retry 2 --max-time 180 \
      https://github.com/PowerShell/PowerShell/releases/download/v7.6.8/powershell-7.6.8-linux-x64.tar.gz \
      -o "$ginny_archive"
  fi
  # Official v7.6.8 hashes.sha256, retrieved over verified HTTPS.
  printf '%s  %s\n' 59112e38ad83350e4f6dc0195953c66b5926792f300ca2e7691b8242e7a16e7f "$ginny_archive" | sha256sum -c -
  tar -xzf "$ginny_archive" -C "$ginny_tool_dir"
  chmod u+x "$ginny_tool_dir/pwsh"
fi
export PATH="$ginny_tool_dir:$PATH"
pwsh --version
python3 -m ginny init
python3 -m unittest discover -s tests -v
