# Progress

## Current phase

**P3 — Add-on engine + AI workflows + CI add-on: Done** (2026-10-26). Next: P4 (Vite + React + TypeScript + Tailwind recipe).

## Last completed

- P1 CLI core, P2 Express + MongoDB + Mongoose recipe (see git history and TASKS.md).
- P3:
  - Add-on engine: managed vs merged files, sidecars for user-edited files, conflicts block `--yes`, backups, `.stackjoist/state.json`, idempotent re-runs (ADR-013).
  - `add <id>` command with `--dir`, `--dry-run`, `--yes`, `--json`; `list` shows add-ons.
  - `ai-workflows` (Claude Code): owner AGENTS.md verbatim, `CLAUDE.md` import, 11 skills, 6 subagents, 3 hooks in exec form (ADR-014), settings merge that adds only hooks and `ask` rules; structural validators.
  - `ci-github`: CI workflow for npm/pnpm with SHA-pinned actions and read-only permissions (ADR-015).
  - Docs: [AI-WORKFLOWS.md](AI-WORKFLOWS.md) with a manual checklist for Claude Code.
- P8 (Codex, Antigravity, more skills such as UI/UX) recorded for after v0.1, as agreed by default.

## Verification (Windows 11, Node 24.18.1, npm 12.1.0, pnpm 12.15.0)

| Check                                                                                                                                                                 | Result                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm check`: typecheck, lint, format, build                                                                                                                          | PASS                                            |
| `vitest run`: 196 tests in 15 files                                                                                                                                   | PASS                                            |
| Pack smoke: tarball includes `assets/ai`; installed package generates express-mongoose and applies ai-workflows                                                       | PASS                                            |
| `add ai-workflows` in a scratch project: 27 files written, 4 structural checks PASS, user `allow` rule and `model` setting preserved, second run "already up to date" | PASS                                            |
| Hook scripts run as real processes with JSON stdin (bash guard, file guard incl. Windows paths, session start)                                                        | PASS                                            |
| Skills and agents load and behave well inside Claude Code (manual checklist in AI-WORKFLOWS.md)                                                                       | NOT RUN: needs a human in a Claude Code session |
| Generated `ci.yml` running on GitHub Actions                                                                                                                          | NOT RUN: needs a push to a GitHub repository    |
| express-mongoose full recipe run with npm after the P3 asset-loader refactor (create+install, typecheck, lint, format, test, build)                                   | PASS                                            |
| Docker, Linux/macOS, Node 22/26                                                                                                                                       | BLOCKED / NOT RUN: Docker missing; CI in P7     |

## Known issues / notes

- Reviewer subagents have no Edit/Write tools, but Bash could still change files (documented limitation).
- Hooks fail open by design; `permissions.ask` rules are the dependable control.
- Add-on removal is not automated (documented manual steps).
- Owner actions pending: trademark search, domain purchase.

## Next

P4: Vite + React + TypeScript + Tailwind recipe (create-vite pinned + Tailwind overlay, theme and accessibility example, Playwright + axe at three viewports).
