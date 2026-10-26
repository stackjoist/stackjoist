# AI Workflows

Status: **implemented for Claude Code** (P3, workflow version 0.1.0). Other agents: planned in P8, not supported yet.

```bash
npx create-stackjoist add ai-workflows --dry-run   # preview
npx create-stackjoist add ai-workflows             # apply (asks first)
```

## Platform facts this relies on

From the Claude Code docs ([skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks](https://code.claude.com/docs/en/hooks), [permissions](https://code.claude.com/docs/en/permissions)), checked 2026-10-26:

- Skills: `.claude/skills/<name>/SKILL.md`; frontmatter starts on line 1; `description` + `when_to_use` truncated at 1,536 chars; `disable-model-invocation: true` for side-effecting workflows; supporting files load on demand; keep `SKILL.md` under 500 lines; **unknown frontmatter fields are silently ignored**.
- Subagents: `.claude/agents/*.md`; `name` (no `:`, no leading `-`) and `description` required; `tools` is an enforced allowlist.
- Hooks: configured in `.claude/settings.json`. Exec form (`"command": "node"` + `args`) runs without a shell on every OS, and Claude Code substitutes `${CLAUDE_PROJECT_DIR}` in `args`. `PreToolUse` can return `permissionDecision` `ask` or `deny`. Hooks are best-effort; a hook that fails does not block.
- Permissions: rules are evaluated deny → ask → allow; an `ask` rule prompts even when an allow rule also matches. Bash rules use the space form, e.g. `Bash(git push *)`.

## What gets installed

| Path                                          | Kind    | Notes                                                                                                                                 |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                   | managed | Owner policy, byte-for-byte (ADR-003)                                                                                                 |
| `CLAUDE.md`                                   | merged  | Adds the line `@AGENTS.md` if missing; other content untouched                                                                        |
| `.claude/skills/*/SKILL.md` (+ `references/`) | managed | 11 skills                                                                                                                             |
| `.claude/agents/*.md`                         | managed | 6 subagents                                                                                                                           |
| `.claude/hooks/stackjoist-*.mjs`              | managed | 3 Node hook scripts                                                                                                                   |
| `.claude/settings.json`                       | merged  | Adds 3 hook groups and 14 `permissions.ask` rules; replaces only its own previous hooks; never adds `allow` rules or permission modes |
| `.stackjoist/state.json`                      | state   | Add-on versions and the hash of every managed file; commit it                                                                         |
| `.stackjoist/backups/`                        | local   | Copies of files replaced or merged; git-ignored                                                                                       |

Managed files you edit are never overwritten: on update, the new version is written as `<file>.stackjoist-new`. An existing file StackJoist did not create (for example your own `AGENTS.md`) is a conflict: `--yes` refuses, and interactively you can confirm to get the new version as a `.stackjoist-new` file to merge yourself.

## Skills

| Skill                | Purpose                                                                                               | Who can start it                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| `repo-discovery`     | Inspect instructions, git state, scripts and conventions before changing anything                     | Claude or you                    |
| `plan-task`          | Requirements → small tasks with checkable acceptance criteria and a `docs/TASKS.md` entry             | Claude or you                    |
| `tdd`                | Red → green → refactor; regression test first for bugs                                                | Claude or you                    |
| `debug-root-cause`   | Reproduce, isolate, fix; CI triage; stop after 3 attempts                                             | Claude or you                    |
| `api-endpoint`       | Endpoint with validation, authz, error shape, tests (`references/express.md`, `references/nestjs.md`) | Claude or you                    |
| `db-change`          | Schema, migration, index and query review (`references/prisma.md`, `references/mongoose.md`)          | Claude or you                    |
| `ui-verify`          | Breakpoints, UI states, themes, keyboard and accessibility; NOT RUN when no browser tool exists       | Claude or you                    |
| `security-review`    | Trust boundaries, authz, injection, secrets, abuse, dependency audit                                  | Claude or you                    |
| `verify-and-handoff` | Real checks with PASS/FAIL/NOT RUN/BLOCKED, diff review, TASKS/PROGRESS update                        | Claude or you                    |
| `release-prep`       | Changelog, verification, `npm pack` inspection, clean install; never publishes                        | You only (`/release-prep`)       |
| `orchestrate`        | Routes a task to the subagents it needs                                                               | You only (`/orchestrate <task>`) |

No skill uses `allowed-tools`, so no skill pre-approves anything.

## Subagents

| Agent                                   | Tools (enforced)                    | Edits files                               |
| --------------------------------------- | ----------------------------------- | ----------------------------------------- |
| `planner` (includes the architect role) | Read, Grep, Glob, WebFetch          | no                                        |
| `implementer`                           | Read, Edit, Write, Grep, Glob, Bash | source files                              |
| `test-engineer`                         | Read, Edit, Write, Grep, Glob, Bash | test files (by instruction, not enforced) |
| `code-reviewer`                         | Read, Grep, Glob, Bash              | no edit tools                             |
| `security-reviewer`                     | Read, Grep, Glob, Bash              | no edit tools                             |
| `ui-reviewer`                           | Read, Grep, Glob, Bash              | no edit tools                             |

Reviewers have no Edit/Write tools, but Bash could still change files; their instructions limit Bash to read-only commands and checks. No agent has the `Agent` tool, so agents cannot spawn more agents.

Routing (`orchestrate`): S → implementer + verify; M → planner → implementer → test-engineer → code-reviewer; L or sensitive → + security-reviewer; UI changes → + ui-reviewer. One writer at a time; only reviewers run in parallel; at most 3 fix cycles, then the human decides.

## Hooks

| Hook                           | Event / matcher                                     | Behaviour                                                                                                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stackjoist-bash-guard.mjs`    | PreToolUse / `Bash`                                 | `ask` before push, force-push, `reset --hard`, `clean -f`, discarding all changes, amend, branch -D, publish/unpublish, Prisma reset or data-loss flags, DROP/TRUNCATE, Docker volume deletion, kubectl/terraform/helm changes, `curl … \| sh`, recursive delete outside the project |
| `stackjoist-file-guard.mjs`    | PreToolUse / `Edit\|Write\|MultiEdit\|NotebookEdit` | `deny` edits to `.env`, `.env.local`, … (templates such as `.env.example` allowed); `ask` when new content looks like a private key or token                                                                                                                                         |
| `stackjoist-session-start.mjs` | SessionStart                                        | Prints the "Next" section of `docs/PROGRESS.md`                                                                                                                                                                                                                                      |

All hooks fail open on malformed input (they never block work by crashing); the `permissions.ask` rules are the dependable control.

## How it is verified

| Check                                                                                                                | Automated | Where                                                  |
| -------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| Frontmatter schema (fields, names, 1,536-char cap, unknown fields, no `allowed-tools`)                               | yes       | `test/unit/ai-workflows.test.ts` and after every `add` |
| Reference links inside skills resolve                                                                                | yes       | same                                                   |
| `AGENTS.md` shipped byte-for-byte; required policy sections present                                                  | yes       | same                                                   |
| Read-only agents have no edit tools; no agent can spawn agents                                                       | yes       | same                                                   |
| Settings merge preserves user keys, is idempotent, never adds allow rules                                            | yes       | same                                                   |
| Installer on fixture projects (fresh, existing CLAUDE.md, own AGENTS.md conflict, invalid settings, decline, re-run) | yes       | `test/unit/add.test.ts`                                |
| Hook scripts with real stdin JSON                                                                                    | yes       | `test/unit/hooks.test.ts`                              |
| Install from the packed tarball                                                                                      | yes       | `scripts/pack-smoke.mjs`                               |
| Skills and agents behave well inside Claude Code                                                                     | **no**    | manual checklist below                                 |

## Manual checklist (Claude Code)

Run in a scratch project after `add ai-workflows`, then restart Claude Code there:

1. `/skills` (or the `/` menu) lists the 11 skills; `/release-prep` and `/orchestrate` appear and are not started automatically.
2. `/agents` lists the 6 agents with the tools shown above.
3. A new session shows the PROGRESS "Next" text if `docs/PROGRESS.md` exists.
4. Asking Claude to run `git push` triggers a confirmation prompt.
5. Asking Claude to write `.env` is refused with the StackJoist reason; writing `.env.example` works.
6. Asking for "a plan for adding a /users endpoint" loads `plan-task` (and `api-endpoint` when implementing).
7. `/orchestrate add a health check` names a task size and only the agents it needs.

Record results (PASS / FAIL / NOT RUN) in `docs/PROGRESS.md`.

## Removing

Not automated yet. Delete the files listed under `files` in `.stackjoist/state.json`, remove the hook groups whose `args` point to `.claude/hooks/stackjoist-*` and the `ask` rules you do not want from `.claude/settings.json`, and remove the `@AGENTS.md` line from `CLAUDE.md` if desired.
