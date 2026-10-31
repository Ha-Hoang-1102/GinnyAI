"""Optional real OpenClaw smoke check, without model credentials or messages.

Usage: python3 tests/openclaw_smoke.py /absolute/path/to/openclaw/dist/index.js
Put the Node version required by OpenClaw on PATH first. No Docker required.
"""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def main(cli):
    spec = importlib.util.spec_from_file_location("prepare_openclaw", ROOT / "deploy/openclaw/prepare.py")
    prepare = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prepare)
    with tempfile.TemporaryDirectory(prefix="ginny-harness-") as tmp:
        base = Path(tmp)
        target = base / "pilot"
        prepare.prepare(target, 18789)
        saved = (target / "compose.env").read_bytes()
        try:
            prepare.prepare(target, 18789)
        except FileExistsError:
            pass
        else:
            raise AssertionError("Initializer must refuse an existing directory")
        assert saved == (target / "compose.env").read_bytes()
        assert (target / "compose.env").stat().st_mode & 0o777 == 0o600
        print("PASS initializer preserves existing state and private permissions", flush=True)

        state = target / "state"
        token = secrets.token_hex(32)
        # Do not inherit developer API keys, CLI logins or account bindings.
        env = {k: v for k, v in os.environ.items() if k in ("PATH", "LANG", "LC_ALL", "SYSTEMROOT")}
        env.update(OPENCLAW_GATEWAY_TOKEN=token, OPENCLAW_STATE_DIR=str(state),
                   OPENCLAW_CONFIG_DIR=str(state), OPENCLAW_CONFIG_PATH=str(state / "openclaw.json"),
                   XDG_CACHE_HOME=str(state / "cache"), OPENCLAW_DISABLE_BONJOUR="1")
        cmd = ["node", str(cli)]
        subprocess.run([*cmd, "config", "validate", "--json"], env=env, check=True)
        print("PASS exact deployment configuration validates", flush=True)

        # The host smoke test changes only container paths/listener/origins.
        config = json.loads((state / "openclaw.json").read_text())
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        config["gateway"]["bind"] = "loopback"
        config["gateway"]["port"] = port
        config["gateway"]["controlUi"]["allowedOrigins"] = [f"http://127.0.0.1:{port}"]
        for role, agent in config["agents"]["entries"].items():
            agent["workspace"] = str(state / "workspaces" / role)
        (state / "openclaw.json").write_text(json.dumps(config))
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

        def request(path, body=None, authenticated=False):
            headers = {"Content-Type": "application/json"}
            if authenticated:
                headers["Authorization"] = "Bearer " + token
            req = urllib.request.Request(f"http://127.0.0.1:{port}{path}",
                                         data=json.dumps(body).encode() if body is not None else None,
                                         headers=headers)
            try:
                with opener.open(req, timeout=5) as res:
                    return res.status, res.read()
            except urllib.error.HTTPError as err:
                return err.code, err.read()

        for cycle in (1, 2):
            log = base / f"gateway-{cycle}.log"
            with log.open("w") as out:
                process = subprocess.Popen([*cmd, "gateway"], env=env, stdout=out, stderr=subprocess.STDOUT)
                try:
                    deadline = time.monotonic() + 90
                    while time.monotonic() < deadline:
                        if process.poll() is not None:
                            raise AssertionError("Gateway exited during startup")
                        try:
                            if request("/readyz")[0] == 200:
                                break
                        except (OSError, urllib.error.URLError):
                            pass
                        time.sleep(0.5)
                    else:
                        raise AssertionError("Gateway did not become ready")
                    status, html = request("/")
                    assert status == 200 and b"<html" in html.lower(), (status, html[:100])
                    body = {"tool": "agents_list", "agentId": "ginny", "args": {}}
                    assert request("/tools/invoke", body)[0] == 401
                    status, data = request("/tools/invoke", body, authenticated=True)
                    assert status == 200, (status, data)
                    result = json.loads(data)
                    assert result["ok"] is True, result
                    for role in prepare.ROLES:
                        assert role in json.dumps(result), role
                    assert request("/tools/invoke", {"tool": "exec", "args": {}, "agentId": "ginny"}, True)[0] == 404
                    assert (state / "workspaces/ginny/AGENTS.md").read_text().startswith("# Ginny")
                    print(f"PASS cycle {cycle}: UI/readiness, anonymous denial, authenticated agent roster, exec denied", flush=True)
                except Exception:
                    print(log.read_text()[-6000:].replace(token, "[REDACTED]"), file=sys.stderr)
                    raise
                finally:
                    process.terminate()
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
        print("PASS restart with retained config/workspaces. No model turn, Telegram message or public ingress tested.")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
