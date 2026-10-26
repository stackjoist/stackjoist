# Progress

## Current phase

**P1 — CLI core: Done** (2026-10-26). Next: P2 (recipe engine + Express + MongoDB + Mongoose).

## Last completed

- P0: baseline approved (ADR-000), name StackJoist (ADR-007), decisions ADR-001…010 in [DECISIONS.md](DECISIONS.md). Proposal split into PRD / ARCHITECTURE / TASKS / TESTING / SECURITY / COMPATIBILITY / AI-WORKFLOWS and removed (still in git history, commit `10c6bf2`).
- P1: package scaffold (`create-stackjoist`, bins `create-stackjoist` + `stackjoist`, ESM, Node ≥ 22.12, MIT); core modules `errors`, `output` (pretty + `--json`), `names`, `fs-safe` (target checks, staging, marker-guarded cleanup, symlink/traversal guards), `exec` (execa, no shell), `pm` (npm/pnpm; yarn/bun rejected clearly), `plan`, `prompter`; commands `create` (prompts, flags, `--dry-run`, cancellation, install/git with PASS/NOT RUN/BLOCKED reporting), `list`, `doctor`; README and DEVELOPMENT.md.
- Owner guide in Bangla: [GITHUB-RELEASES-PACKAGES.bn.md](GITHUB-RELEASES-PACKAGES.bn.md).

## Verification (Windows 11, Node 24.18.1, pnpm 12.15.0)

| Check                                                                                         | Result                                                                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm typecheck`                                                                              | PASS                                                                                    |
| `pnpm lint` (incl. layering + no-`shell: true` rules, both confirmed to fire on a probe file) | PASS                                                                                    |
| `pnpm format:check`                                                                           | PASS                                                                                    |
| `pnpm build`                                                                                  | PASS                                                                                    |
| `vitest run` — 93 unit + 7 CLI integration = 100 tests in 7 files                             | PASS                                                                                    |
| `node scripts/pack-smoke.mjs` — tarball contents, clean install, shebang, both bins           | PASS                                                                                    |
| `pnpm audit --prod`                                                                           | PASS (no known vulnerabilities)                                                         |
| Interactive prompts in a real terminal (TTY)                                                  | NOT RUN — needs a human at a terminal; prompt logic is covered with a scripted prompter |
| Real Ctrl-C during a long command                                                             | NOT RUN — cancellation path covered by unit tests with an abort signal                  |
| Linux / macOS, Node 22 / 26                                                                   | NOT RUN — CI matrix arrives in P7                                                       |
| Recipe generation                                                                             | NOT RUN — no recipes yet (P2+)                                                          |

## Known issues / notes

- `create` has no real templates yet; it exits with code 3 and says so.
- pnpm uses a store at `E:\.pnpm-store` because the default store is on another drive.
- Corepack downloaded Yarn 1.22.22 into its cache during the initial audit (`yarn -v`).
- Owner actions pending: trademark search, domain purchase (`stackjoist.com` / `.dev`).

## Next

P2: write the P2 task breakdown in TASKS.md, then build the Express + MongoDB + Mongoose template, the recipe verify runner, and generated-project tests with npm and pnpm.
