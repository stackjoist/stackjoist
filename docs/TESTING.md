# Testing

## Test layers

| Layer                        | Covers                                                                                                                                                           | Runs                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Unit (`test/unit`)           | name/path validation, PM detection, plan building, errors/exit codes, settings merge, manifest schemas, hook scripts                                             | every PR, all OS                                                  |
| CLI integration (`test/cli`) | built CLI (`node dist/cli/index.js`) in temp dirs: flags, `--dry-run`, `--yes`, invalid input, existing dir, cancellation, process failure, exit codes, `--json` | every PR, ubuntu + windows                                        |
| Recipe generation (fast)     | generate without install; assert files, manifest, config shape                                                                                                   | every PR                                                          |
| Recipe verification (full)   | generate → install (npm, pnpm) → typecheck → lint → test → build → smoke                                                                                         | nightly, release, label-triggered                                 |
| DB-backed                    | Express on mongodb-memory-server; Prisma against a CI Postgres service; Compose files via `docker compose config`                                                | CI (Docker is not installed on the dev machine → BLOCKED locally) |
| Add-on                       | compatibility, conflicts, idempotency, update, recovery                                                                                                          | every PR                                                          |
| AI workflow                  | frontmatter schema, references, policy integrity, installer fixtures, hook stdin fixtures, no permission widening                                                | every PR                                                          |
| Package distribution         | `npm pack` → inspect → install tarball in clean dir → run commands                                                                                               | every PR (ubuntu), release (all OS)                               |
| Qualitative AI behaviour     | whether skills trigger and behave well in Claude Code                                                                                                            | manual checklist only; never reported as automated                |

Results are always reported as PASS / FAIL / NOT RUN / BLOCKED.

## Commands

See [DEVELOPMENT.md](DEVELOPMENT.md) for the verified commands.

## Known gaps

- Docker-based checks cannot run on the current dev machine.
- Bun is not installed and not supported in v0.1.
