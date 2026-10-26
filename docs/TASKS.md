# Tasks

Status values: Todo / In Progress / Blocked / Done. Phases follow the approved baseline with all four recipes in v0.1 (ADR-001).

## Roadmap

| Phase | Goal                                                       | Depends on | Status |
| ----- | ---------------------------------------------------------- | ---------- | ------ |
| P0    | Audit, baseline, decisions, docs                           | —          | Done   |
| P1    | CLI core                                                   | P0         | Done   |
| P2    | Recipe engine + Express + MongoDB + Mongoose               | P1         | Todo   |
| P3    | Add-on engine + `ai-workflows` (Claude Code) + `ci-github` | P1         | Todo   |
| P4    | Vite + React + TS + Tailwind                               | P2         | Todo   |
| P5    | Next.js + TS + Tailwind                                    | P4         | Todo   |
| P6    | NestJS + PostgreSQL + Prisma 7.x                           | P2         | Todo   |
| P7    | CI, docs, release readiness v0.1 (no publish)              | P2–P6      | Todo   |

---

## P0 — Baseline

| ID   | Task                                                                                                                    | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| T0.1 | Repository audit                                                                                                        | Done   |
| T0.2 | Baseline proposal                                                                                                       | Done   |
| T0.3 | Split proposal into PRD/ARCHITECTURE/DECISIONS/TASKS/TESTING/SECURITY/COMPATIBILITY/AI-WORKFLOWS; delete proposal files | Done   |

## P1 — CLI core

**Goal:** a tested, packable CLI skeleton with safe primitives that all later phases reuse.
**Non-goals:** any recipe content, add-ons, AI assets.

| ID    | Task                             | Acceptance criteria                                                                                                                                                                                                                                                         | Verification                                                          | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| T1.1  | Package scaffold                 | `package.json` (name, two bins, ESM, engines, `files`, MIT), tsconfig (strict), ESLint flat config incl. import-direction rule, Prettier, Vitest, `.gitignore`, LICENSE                                                                                                     | `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` pass | Done   |
| T1.2  | TypeScript 6 vs 7 decision       | Decided by `typescript-eslint` peer range                                                                                                                                                                                                                                   | ADR-008                                                               | Done   |
| T1.3  | Errors, exit codes, logger       | Typed errors → stable exit codes; pretty and `--json` output; no stack traces for user errors unless `--debug`                                                                                                                                                              | unit tests                                                            | Done   |
| T1.4  | Name/path validation             | Rejects invalid npm names, traversal, absolute paths, Windows reserved names, trailing dot/space; resolves target inside cwd                                                                                                                                                | table-driven unit tests                                               | Done   |
| T1.5  | fs-safe: target checks + staging | Refuses non-empty/symlinked targets; staging dir with marker; atomic rename; cleanup removes only marked staging dir                                                                                                                                                        | unit + integration on temp dirs                                       | Done   |
| T1.6  | exec + package-manager adapter   | execa wrapper (arrays, no shell, timeout, abort); detects npm/pnpm/yarn/bun from `npm_config_user_agent` and lockfiles; unsupported PMs give a clear error                                                                                                                  | unit tests with fake processes                                        | Done   |
| T1.7  | `create` skeleton                | Prompts (name, recipe, PM) with cancel handling; install/git via `--no-install`/`--no-git` (default on); flags `--template --pm --yes --dry-run --no-install --no-git --json`; prints plan; no recipe yet → clear "no recipes available" path tested via a test-only recipe | CLI integration tests                                                 | Done   |
| T1.8  | `list`                           | Lists recipes/add-ons from registries (empty registries handled); `--json`                                                                                                                                                                                                  | CLI integration tests                                                 | Done   |
| T1.9  | `doctor`                         | Reports Node, npm/pnpm, git versions and support status; non-zero exit when requirements fail                                                                                                                                                                               | CLI integration tests                                                 | Done   |
| T1.10 | Pack-and-install smoke           | `npm pack` → install tarball in temp dir → `create-stackjoist --help`, `stackjoist list`, `doctor` run                                                                                                                                                                      | scripted test                                                         | Done   |
| T1.11 | DEVELOPMENT.md + minimal README  | Verified commands only; README states current status honestly                                                                                                                                                                                                               | review                                                                | Done   |

## P2–P7

Detailed tasks are written at the start of each phase. Summary acceptance criteria live in [PRD.md](PRD.md#acceptance-criteria-v01).
