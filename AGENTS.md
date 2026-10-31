# Working on GinnyAI

- Use the existing checkout. Each cloud task is already isolated; do not create a worktree unless the user requests one.
- User-facing documentation and UI are Vietnamese. Explain assumptions, give concrete improvements, and ask only for missing information that changes the result.
- The current product is manual-first: existing ChatGPT/Codex subscriptions, Windows 11 execution, ChatGPT Tasks handoff. Do not silently add billable API calls or claim autonomous agents are connected.
- The next requested goal is 24/7 orchestration for the user's Facebook Pages, TikTok and YouTube. Read docs/github-options-social-ai.md and docs/server-24x7-plan.md for the evaluated options. The proposed Ubuntu 24.04 server (20 CPU cores, 32 GB RAM, 2 TB HDD) is not connected. The reported USD 100 ChatGPT and USD 20 Claude plans are subscriptions, with no separate API budget confirmed. Architecture recommendations are not installed integrations or authorization for unbounded API spending.
- On Windows, tools keep their default installation locations on C:, while all project source, Markdown and project data belong under E:\GinnyAI. Personal data, outputs, backups, logs and project temp files use ignored .ginny subdirectories. The cloud checkout remains /workspace/GinnyAI; documentation edits do not establish migration on the user's machine.
- Read `docs/architecture.md` and `docs/workflow.md` before changing the workflow. Load only files relevant to the task; summarize results and link artifacts instead of copying full logs.
- Keep personal tasks, SQLite databases, credentials, logs and machine details out of Git. Do not put secrets into prompts.
- PowerShell runner accepts only fixed command IDs. Add a command with documented scope, implementation and meaningful tests; never turn task text into shell source.
- Do not claim Windows execution, reminder scheduling, image generation, publication or remote synchronization without observed evidence.
- Run `python -m unittest discover -s tests -v`. For runner changes, also exercise actual PowerShell commands. Report skipped checks separately.
- The dashboard is a loopback-only, single-user service. A remote deployment requires authentication and a designed worker connection; do not bind this server publicly.
- For the new server workflow, use the prepared OpenClaw pilot in deploy/openclaw and docs/openclaw-setup.md. Telegram comes first, Discord later; no domain chosen. The names "highfeel" and "muse" and the user's Veo product remain unverified. Never silently map them to a vendor. Do not enable model schedules, paid fallbacks, posting or external channels merely because a config template exists.
