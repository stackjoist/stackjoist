# Tasks

Status values: Todo / In Progress / Blocked / Done. Phases follow the approved baseline with all four recipes in v0.1 (ADR-001).

## Roadmap

| Phase | Goal                                                                                                                         | Depends on | Status |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| P0    | Audit, baseline, decisions, docs                                                                                             | —          | Done   |
| P1    | CLI core                                                                                                                     | P0         | Done   |
| P2    | Recipe engine + Express + MongoDB + Mongoose                                                                                 | P1         | Done   |
| P3    | Add-on engine + `ai-workflows` (Claude Code) + `ci-github`                                                                   | P1         | Todo   |
| P4    | Vite + React + TS + Tailwind                                                                                                 | P2         | Todo   |
| P5    | Next.js + TS + Tailwind                                                                                                      | P4         | Todo   |
| P6    | NestJS + PostgreSQL + Prisma 7.x                                                                                             | P2         | Todo   |
| P7    | CI, docs, release readiness v0.1 (no publish)                                                                                | P2–P6      | Todo   |
| P8    | Multi-agent: Codex + Google Antigravity adapters; expanded skills library (UI/UX design, and more, owner request 2026-10-26) | P3         | Todo   |

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

## P2 — Recipe engine + Express + MongoDB + Mongoose

**Goal:** the first real template, generated from first-party files shipped in the package, and verified by actually installing and testing the generated project.
**Non-goals:** upstream generators (P4+), add-ons (P3), a `--verify` flag on `create` (decide after P4), production deployment config.

| ID   | Task                         | Acceptance criteria                                                                                                                                                                                                                                                                            | Verification                                    | Status |
| ---- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| T2.1 | Template asset loader        | Recipes read files from `assets/templates/<id>/` in both the source tree and an installed tarball; dotfiles npm strips (`.gitignore`) are stored as `_gitignore` and renamed; only listed placeholders are substituted                                                                         | unit tests + pack smoke                         | Done   |
| T2.2 | Express + Mongoose template  | Express 5, Mongoose 9, Zod 4 env + request validation, helmet, configurable CORS, pino logging, `app`/`server` split, `/health` + `/health/ready`, central 404/error handling, graceful shutdown, startup failure exits non-zero, Docker Compose MongoDB, `.env.example`, example `notes` CRUD | generated project's own tests                   | Done   |
| T2.3 | Generated-project tests      | Unit tests (env, errors, validation) + HTTP integration tests (Supertest + mongodb-memory-server) incl. invalid input, invalid ObjectId, 404, pagination limits, startup + shutdown                                                                                                            | run inside generated project                    | Done   |
| T2.4 | Recipe registration + engine | `express-mongoose` in the registry; `plan()` async; package.json generated from code with tested version ranges; next steps printed                                                                                                                                                            | unit tests for the plan                         | Done   |
| T2.5 | Verify runner                | `src/verify` runs a recipe's checks and reports PASS/FAIL/NOT RUN/BLOCKED                                                                                                                                                                                                                      | unit tests                                      | Done   |
| T2.6 | Full recipe verification     | Script generates the recipe with npm and with pnpm in temp dirs → install → typecheck → lint → test → build; Compose file validated where Docker exists, else BLOCKED                                                                                                                          | `pnpm test:recipes` output recorded in PROGRESS | Done   |

## P3–P7

Detailed tasks are written at the start of each phase. Summary acceptance criteria live in [PRD.md](PRD.md#acceptance-criteria-v01).

## P8 — Multi-agent adapters and expanded skills (owner request, 2026-10-26)

**Goal:** the same AI workflow for more coding agents, and a larger skills library.
**Scope (to be detailed when P8 starts):**

- Adapters for **OpenAI Codex** and **Google Antigravity**, each verified against that agent's current official docs (file locations, skill/rule format, subagent and hook support) before any compatibility is claimed. The neutral definitions in `assets/ai/` (P3) are designed so adapters can be added without rewriting skills.
- More skills beyond the P3 core set, for example a **UI/UX design** skill (layout, typography, spacing, design-system use, responsive and accessible design). Each new skill keeps the P3 quality bar: clear triggers, steps, safety limits, verification and an honest definition of done.
- Input: the owner's existing `multi-agent-setup` skill (Antigravity / OpenCode / Copilot setup) as a reference for what already works in practice.

**Open question for the owner:** keep P8 after v0.1, or move some of it into v0.1.
