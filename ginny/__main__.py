import argparse
import json
import os
import sys
from pathlib import Path

from .core import Store, brief, reminder_prompt, report
from .runner import run_powershell
from .server import make_server


def main():
    if sys.version_info < (3, 11):
        raise SystemExit("Cần Python 3.11 trở lên")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Ginny Control — điều phối thủ công, không dùng API tính phí")
    parser.add_argument("--db", default=os.environ.get("GINNY_DB", ".ginny/tasks.sqlite3"))
    commands = parser.add_subparsers(dest="action", required=True)
    commands.add_parser("init")
    commands.add_parser("list")
    commands.add_parser("report")
    create = commands.add_parser("create")
    create.add_argument("--file", required=True, type=Path)
    for name in ("brief", "reminder"):
        command = commands.add_parser(name)
        command.add_argument("id", type=int)
    move = commands.add_parser("move")
    move.add_argument("id", type=int)
    move.add_argument("status")
    move.add_argument("--version", type=int, required=True)
    move.add_argument("--result-file", type=Path)
    run = commands.add_parser("run")
    run.add_argument("id", type=int)
    run.add_argument("--workspace", type=Path, required=True)
    run.add_argument("--pwsh", default="pwsh")
    serve = commands.add_parser("serve")
    serve.add_argument("--port", type=int, default=8765)
    backup = commands.add_parser("backup")
    backup.add_argument("destination", type=Path)
    args = parser.parse_args()
    try:
        store = Store(args.db)
        if args.action == "init":
            output = {"database": str(Path(args.db).resolve()), "status": "initialized"}
        elif args.action == "create":
            output = store.create(json.loads(args.file.read_text(encoding="utf-8-sig")))
        elif args.action == "list":
            output = store.list()
        elif args.action == "brief":
            output = brief(store.get(args.id))
        elif args.action == "reminder":
            output = reminder_prompt(store.get(args.id))
        elif args.action == "report":
            output = report(store)
        elif args.action == "move":
            result = args.result_file.read_text(encoding="utf-8-sig") if args.result_file else None
            output = store.transition(args.id, args.status, args.version, result)
        elif args.action == "run":
            output = run_powershell(store, args.id, args.workspace, args.pwsh)
        elif args.action == "backup":
            store.backup(args.destination)
            output = {"backup": str(args.destination)}
        else:
            with make_server(store, args.port) as server:
                print(f"Ginny Control: cổng {server.server_port}, chỉ trên máy này. Ctrl+C để dừng.", flush=True)
                try:
                    server.serve_forever()
                except KeyboardInterrupt:
                    pass
            return
        print(output if isinstance(output, str) else json.dumps(output, ensure_ascii=False, indent=2))
        if args.action == "run" and output["status"] == "failed":
            raise SystemExit(1)
    except (ValueError, KeyError, OSError) as exc:
        parser.exit(1, f"Lỗi: {exc}\n")


if __name__ == "__main__":
    main()
