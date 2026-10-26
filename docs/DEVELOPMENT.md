# Development

## Requirements

- Node.js ≥ 22.12 (developed on 24.18.1)
- pnpm 12 (`packageManager` field pins `pnpm@12.15.0`)
- Git

## Setup

```bash
pnpm install
```

## Commands

All verified on Windows 11, Node 24.18.1, pnpm 12.15.0 (2026-10-26).

| Command                             | What it does                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm typecheck`                    | `tsc --noEmit` over `src`, `test` and configs                                  |
| `pnpm lint`                         | ESLint (type-checked rules, layering rule, no `shell: true`)                   |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                                         |
| `pnpm build`                        | Clean `dist/`, compile `src` with `tsconfig.build.json` (fails on type errors) |
| `pnpm test`                         | All Vitest tests (CLI tests need a prior build)                                |
| `pnpm test:unit`                    | Unit tests only                                                                |
| `pnpm test:cli`                     | Build, then run the built CLI as a child process                               |
| `pnpm test:pack`                    | Build, `npm pack`, inspect tarball, install it in a temp dir, run both bins    |
| `pnpm check`                        | Everything above in sequence                                                   |

Run the local build directly: `node dist/cli/index.js --help`.

## Conventions

- ESM only; relative imports end in `.js`.
- Layering: `cli → commands → (recipes | addons | verify) → core` (ESLint-enforced). See [ARCHITECTURE.md](ARCHITECTURE.md).
- Commands receive a `CommandContext` (cwd, env, output, runner, prompter, signal) so they can be tested without a terminal or real processes.
- External programs only through `ProcessRunner` with argument arrays.
- User-facing errors are `StackJoistError` subclasses with an exit code and a hint.
- Conventional Commits.
