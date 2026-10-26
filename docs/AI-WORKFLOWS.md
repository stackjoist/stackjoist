# AI Workflows

Status: **approved design, not implemented** (phase P3). This page becomes the user-facing reference once P3 ships.

## Platform facts this design relies on

From the Claude Code docs ([skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks](https://code.claude.com/docs/en/hooks)), fetched 2026-10-26:

- Skills: `.claude/skills/<name>/SKILL.md`; frontmatter starts on line 1; `description` + `when_to_use` truncated at 1,536 chars; `disable-model-invocation: true` for side-effecting workflows; supporting files load on demand; keep `SKILL.md` < 500 lines; **unknown frontmatter fields are silently ignored**.
- Subagents: `.claude/agents/*.md`; `name` (no `:`, no leading `-`) and `description` required; `tools` is an enforced allowlist; spawning subagents requires `Agent` in `tools`.
- Hooks: `.claude/settings.json` → `hooks.<Event>[].{matcher, hooks[]}`; `PreToolUse` blocks via exit 2 or `permissionDecision`; hooks are **best-effort** and the permission system is the hard control; a failed/timed-out hook does not block unless `onFailure: "block"`.

## What `add ai-workflows` installs

```text
AGENTS.md                      owner policy, verbatim, managed (ADR-003)
CLAUDE.md                      "@AGENTS.md" (existing file: import line added only if missing, after preview)
.claude/skills/<name>/SKILL.md (+ references/*.md)
.claude/agents/<name>.md
.claude/hooks/*.mjs            Node scripts, exec form (node + args)
.claude/settings.json          merged: hooks + permissions.ask rules; user keys preserved
.stackjoist/ai-manifest.json   workflow version + sha256 per managed file
```

No permission is ever widened: only `permissions.ask` rules are added (e.g. `Bash(npm publish:*)`, `Bash(git push:*)`, `Bash(git reset --hard:*)`).

## Skills (10)

| Skill                | Purpose                                                                                              | Invocation   |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| `repo-discovery`     | Inspect state, instructions, git, scripts before changing anything                                   | model + user |
| `plan-task`          | Clarify requirements; plan; `TASKS.md` entry with acceptance criteria                                | model + user |
| `tdd`                | Red → green → refactor; regression test first for bugs                                               | model + user |
| `debug-root-cause`   | Reproduce, isolate, fix; CI-failure triage; 3-attempt stop rule                                      | model + user |
| `api-endpoint`       | Endpoint with validation, authz, error shape, tests; `references/express.md`, `references/nestjs.md` | model + user |
| `db-change`          | Schema/migration/index review; `references/prisma.md`, `references/mongoose.md`                      | model + user |
| `ui-verify`          | Breakpoints, states, themes, keyboard, axe; Playwright if present, else NOT RUN                      | model + user |
| `security-review`    | Trust boundaries, input, authz, secrets, audit                                                       | model + user |
| `verify-and-handoff` | Run checks, PASS/FAIL/NOT RUN/BLOCKED report, update PROGRESS/TASKS                                  | model + user |
| `release-prep`       | Pack, inspect tarball, changelog; never publishes                                                    | user only    |

Plus `orchestrate` (user only) with the routing rules below.

## Subagents (6)

| Agent                               | Tools (enforced)                    | Writes                                  |
| ----------------------------------- | ----------------------------------- | --------------------------------------- |
| `planner` (includes architect role) | Read, Grep, Glob, WebFetch          | no                                      |
| `implementer`                       | Read, Edit, Write, Grep, Glob, Bash | only writer of source files             |
| `test-engineer`                     | Read, Edit, Write, Grep, Glob, Bash | tests (instruction-level, not enforced) |
| `ui-reviewer`                       | Read, Grep, Glob, Bash              | no                                      |
| `security-reviewer`                 | Read, Grep, Glob, Bash              | no                                      |
| `code-reviewer`                     | Read, Grep, Glob, Bash              | no                                      |

Routing: S (≤ 1 module, no contract change) → implementer + verify. M → planner → implementer → test-engineer → code-reviewer. L / sensitive (auth, data, money, public API) → + security-reviewer; UI changes → + ui-reviewer. One writer at a time; only read-only reviewers run in parallel; reviewers read `git diff` and re-run checks themselves; each agent ends with a fixed report block (Scope / Evidence / Findings / Verdict / NOT RUN); max 3 fix cycles, then escalate to the human.

## Hooks (3)

1. `PreToolUse` `Bash`: destructive or externally visible commands → `permissionDecision: "ask"` with reason.
2. `PreToolUse` `Edit|Write`: block writes to `.env*` except `.env.example`; ask on high-confidence secret patterns.
3. `SessionStart`: print the "Next" section of `docs/PROGRESS.md` if present.

## Verification

| Check                                                                                              | Automated                 |
| -------------------------------------------------------------------------------------------------- | ------------------------- |
| Frontmatter schema (required fields, name rules, 1,536-char cap, unknown fields)                   | yes                       |
| Reference integrity (`references/*.md`, `@` imports)                                               | yes                       |
| Policy integrity (AGENTS.md hash; required sections present)                                       | yes                       |
| Installer on fixture repos (empty, existing CLAUDE.md/settings, user-edited skill, name collision) | yes                       |
| Hook scripts with JSON stdin fixtures                                                              | yes                       |
| Settings merge never adds `allow` / `bypassPermissions`                                            | yes                       |
| Skills actually trigger and behave well in Claude Code                                             | **no** — manual checklist |
