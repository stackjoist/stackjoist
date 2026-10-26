# Security

StackJoist executes commands and writes files on the user's machine. These are the threats it is designed against and how each is mitigated. Status shows what is implemented.

| Risk                                          | Mitigation                                                                                                                                                                                         | Status    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Path traversal / malicious project names      | Own validator: npm name rules, no `/ \ ..`, no absolute paths, no Windows reserved names (`CON`, `NUL`, `COM1`…), no trailing dot/space; target must resolve inside cwd unless `--dir` is explicit | Done (P1) |
| Existing directory collisions                 | Refuse when the target exists and is non-empty; never delete pre-existing content                                                                                                                  | Done (P1) |
| Symlinks                                      | `lstat` the target and write paths; refuse to write through symlinks; staging dir via `mkdtemp`                                                                                                    | Done (P1) |
| Command injection                             | All processes via execa argument arrays with `shell: false`; user input never concatenated into command strings                                                                                    | Done (P1) |
| Partial failure / cancellation                | Staging dir + atomic rename; cleanup deletes only the staging dir after checking its marker file                                                                                                   | Done (P1) |
| Overwriting user configuration (`add`)        | Plan + preview, conflicts block `--yes`, backups, hash-tracked managed files                                                                                                                       | P3        |
| Secret leakage                                | Templates ship only `.env.example`; package `files` allowlist; tarball secret scan at release                                                                                                      | P2 / P7   |
| Install-time lifecycle scripts                | pnpm blocks dependency build scripts by default; recipes declare exactly which packages need them                                                                                                  | P2+       |
| Generated tests reaching production databases | Test configs use in-memory/localhost DBs and refuse non-local URIs or `NODE_ENV=production`                                                                                                        | P2, P6    |
| Upstream drift                                | Exact generator pins, structure preconditions, scheduled canary                                                                                                                                    | P4+       |
| Malicious template content                    | Only first-party templates bundled in the tarball; no remote templates in v0.1                                                                                                                     | by design |
| AI agent overreach                            | Installer only adds `permissions.ask` rules, never `allow` or `bypassPermissions`; hooks documented as best-effort (Claude Code docs)                                                              | P3        |
| Dependency vulnerabilities                    | `pnpm audit --prod` in CI; reviewed before release                                                                                                                                                 | P7        |

## Reporting

Security issues: contact the maintainer (Khaled Siddique, khaledssbd@gmail.com) privately; a `SECURITY` policy for the GitHub repo is added before the first release.
