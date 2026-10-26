# StackJoist — Product Requirements

Status: **Approved baseline** (owner, 2026-10-26). Package: `create-stackjoist`. Repository: https://github.com/stackjoist/stackjoist

## Problem

Starting a TypeScript project with a reliable stack (validation, error handling, tests, env config, local database, CI) takes days, and most generators produce output that only looks finished. Teams using AI coding agents also lack a reliable, versioned way to install and update engineering guardrails (instructions, skills, subagents, hooks) across repositories.

## Product

StackJoist is a TypeScript-first CLI that:

1. Generates verified starter projects from tested recipes.
2. Adds optional capabilities to existing projects through add-ons with compatibility checks, previews and backups.
3. Installs a versioned AI Development Operating System (Claude Code first).

The scaffolder and the AI workflow are independent; either can be used alone.

## Users

- Developers starting a new TypeScript web/API project (beginner to experienced).
- Experienced developers and CI pipelines using non-interactive flags.
- Teams adopting AI coding agents who want consistent guardrails across repositories.

## v0.1 scope (MVP)

| Area             | Requirement                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands         | `create` (interactive + non-interactive, `--dry-run`, `--yes`, `--json`), `list`, `doctor`, `add <id>`, `--help` with tested examples                                                 |
| Recipes          | Express + MongoDB + Mongoose; Vite + React + TS + Tailwind; Next.js (App Router) + TS + Tailwind; NestJS + PostgreSQL + Prisma 7.x (ADR-001, ADR-002)                                 |
| Add-ons          | Add-on engine; `ai-workflows`; `ci-github`; further add-ons only if time allows                                                                                                       |
| AI workflow      | Claude Code adapter: owner's AGENTS.md verbatim (ADR-003), CLAUDE.md import, 10 skills, 6 subagents, 3 hooks, `orchestrate` skill, installed as managed files in `.claude/` (ADR-004) |
| Package managers | npm and pnpm verified; Yarn/Bun detected and reported as unsupported (ADR-006)                                                                                                        |
| Runtime          | Node.js ≥ 22.12, ESM-only                                                                                                                                                             |
| Distribution     | Packed tarball verified by a clean install; publishing guide; **no publish without owner approval**                                                                                   |

## Explicit non-goals for v0.1

- Express + Prisma/Drizzle, monorepo recipes, authentication starters, Redis/background jobs.
- Remote or user-defined templates and presets.
- Add-on removal (not claimed until implemented and tested).
- Adapters for coding agents other than Claude Code.
- Yarn and Bun support.
- A claude.ai/Claude Code plugin/marketplace distribution of the AI workflow.

## Acceptance criteria (v0.1)

1. Every recipe, generated in a clean temp directory with npm and with pnpm, passes install, typecheck, lint, tests and production build; smoke tests pass (HTTP `/health` for APIs, Playwright + axe for UIs). DB-dependent checks that need Docker run in CI and are reported separately.
2. `create` never writes outside the target directory, never deletes pre-existing user files, and leaves no partial output after failure or cancellation.
3. `add` shows a preview, refuses unresolved conflicts under `--yes`, backs up modified files and reports every changed file; re-running is a no-op.
4. `add ai-workflows` passes all automated workflow checks (schema, references, policy integrity, installer fixtures, hook unit tests) and never widens agent permissions.
5. The packed tarball installs in a clean directory and every documented command runs from it on Windows and Linux.
6. CLI output never claims a project is production-ready; skipped checks are reported as NOT RUN/BLOCKED.

## Open items

- Formal trademark search for "StackJoist" (owner).
- Domain purchase (`stackjoist.com` / `.dev`) (owner).
- SEO keyword list for README/docs site, per AGENTS.md §9: to be proposed before launch copy is written.
