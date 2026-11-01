#!/usr/bin/env bash
# Optional cloud validation runtime, not the Ubuntu production deployment.
set -euo pipefail
ginny_repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ginny_tools=/workspace/ginny-tools/openclaw-test
ginny_node="$ginny_tools/node-v24.22.1-linux-x64"
ginny_archive="$ginny_tools/node.tar.xz"
ginny_node_sha=6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6

if [[ "$(uname -m)" != x86_64 || "$(uname -s)" != Linux ]]; then
  printf 'This cloud helper requires Linux x86_64.\n' >&2
  exit 1
fi
mkdir -p "$ginny_tools"
if [[ ! -x "$ginny_node/bin/node" ]]; then
  curl --fail --location --retry 2 --output "$ginny_archive" \
    https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-x64.tar.xz
  printf '%s  %s\n' "$ginny_node_sha" "$ginny_archive" | sha256sum --check --status
  tar --extract --xz --file "$ginny_archive" --directory "$ginny_tools" --no-same-owner
fi
export PATH="$ginny_node/bin:$PATH"
node --version

# No package lifecycle scripts are needed for this credential-free Gateway test.
# This does not provision native Codex/Claude tools or authenticate any account.
npm install --prefix "$ginny_tools/runtime" --cache "$ginny_tools/npm-cache" \
  --ignore-scripts --no-audit --no-fund openclaw@2026.10.9
python3 "$ginny_repo/tests/openclaw_smoke.py" "$ginny_tools/runtime/node_modules/openclaw/dist/index.js"
