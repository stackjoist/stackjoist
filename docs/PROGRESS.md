# Progress

## Current phase

**P2 — Express + MongoDB + Mongoose: Done** (2026-10-26). Next: P3 (add-on engine + AI workflows for Claude Code).

## Last completed

- P1: CLI core (`create`, `list`, `doctor`, safe filesystem and process primitives).
- P2:
  - Template `assets/templates/express-mongoose/`: Express 5, Mongoose 9, Zod 4 env and request validation, helmet, CORS allowlist, pino logging, `app`/`start`/`server` split, `/health` + `/health/ready`, JSON 404/error handling, graceful shutdown, fail-fast startup, Docker Compose MongoDB (localhost only), `.env.example`, `notes` CRUD example, 29 tests.
  - Engine: template asset loader (`_gitignore` → `.gitignore`, strict placeholders), async recipe plans, `package.json` generated in code, pnpm `allowBuilds` policy (ADR-011), verify runner, `pnpm test:recipes`.
  - CLI error output now includes the last lines of a failed tool's output.
- Owner request recorded as P8: Codex + Antigravity adapters and an expanded skills library (UI/UX and more).
- Repo-local git setting `credential.https://github.com.username=khaledssbd`, so Git Credential Manager stops asking which of the two saved GitHub accounts to use.

## Verification (Windows 11, Node 24.18.1, npm 12.1.0, pnpm 12.15.0)

| Check                                                                                                                                   | Result                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm check`: typecheck, lint, format, build                                                                                            | PASS                                                                                                            |
| `vitest run`: 113 tests in 9 files                                                                                                      | PASS                                                                                                            |
| Pack smoke: tarball contents incl. template assets; installed package generates a project                                               | PASS                                                                                                            |
| `test:recipes` express-mongoose / pnpm: create+install, typecheck, lint, format, test, build                                            | PASS                                                                                                            |
| `test:recipes` express-mongoose / npm: same steps                                                                                       | PASS                                                                                                            |
| Generated project: 29 tests (4 files), `npm audit` (all deps)                                                                           | PASS, 0 vulnerabilities                                                                                         |
| Generated server, real process: missing config → exit 1; unreachable DB → exit 1; real start → `/health`, `/health/ready`, list, create | PASS                                                                                                            |
| `docker compose config` on the generated Compose file                                                                                   | BLOCKED: Docker not installed                                                                                   |
| Graceful shutdown via a real SIGTERM                                                                                                    | NOT RUN: Windows has no POSIX signals; `close()` path covered by the generated integration test; Linux CI in P7 |
| Interactive prompts in a real terminal                                                                                                  | NOT RUN: needs a human at a terminal                                                                            |
| Linux / macOS, Node 22 / 26                                                                                                             | NOT RUN: CI in P7                                                                                               |

## Known issues / notes

- The first test run of a generated Express project downloads a MongoDB binary (mongodb-memory-server); needs internet once.
- Generated projects require Node ≥ 22.13 (ESLint 10), slightly above the CLI's own ≥ 22.12.
- Owner actions pending: trademark search, domain purchase.

## Next

P3: add-on engine (`add` command, plan/preview/backup/apply/verify) and the `ai-workflows` add-on for Claude Code. Open question for the owner: should part of P8 (Codex/Antigravity, more skills) move into v0.1?
