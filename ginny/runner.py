import shutil
import subprocess
from pathlib import Path

from .core import COMMANDS


def run_powershell(store, task_id, workspace, executable="pwsh"):
    workspace = Path(workspace).resolve(strict=True)
    if not workspace.is_dir():
        raise ValueError("Workspace phải là thư mục")
    task = store.get(task_id)
    if task["kind"] != "powershell" or task["command_id"] not in COMMANDS:
        raise ValueError("Việc không phải lệnh PowerShell hỗ trợ")
    if task["status"] != "queued":
        raise ValueError("Chỉ chạy việc đang queued")
    binary = shutil.which(executable)
    if not binary:
        raise ValueError("Chưa có PowerShell 7 (pwsh). Xem docs/windows.md")
    script = Path(__file__).resolve().parent.parent / "scripts" / "Invoke-GinnyCommand.ps1"
    task = store.transition(task_id, "running", task["version"])
    try:
        proc = subprocess.run(
            [binary, "-NoLogo", "-NoProfile", "-NonInteractive", "-File", str(script),
             "-CommandId", task["command_id"], "-Workspace", str(workspace)],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30,
            shell=False,
        )
        result = f"Exit code: {proc.returncode}\n{proc.stdout}\n{proc.stderr}"
        status = "awaiting_review" if proc.returncode == 0 else "failed"
    except (OSError, subprocess.TimeoutExpired) as exc:
        result, status = f"Runner error: {type(exc).__name__}: {exc}", "failed"
    # The runner owns this attempt. A cancelled/changed task must not be overwritten.
    return store.transition(task_id, status, task["version"], result[:12000])
