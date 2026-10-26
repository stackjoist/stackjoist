# Architecture

Describes the **current** architecture. Sections marked _(planned, Pn)_ are approved designs not yet implemented.

## Shape

A single npm package (`create-stackjoist`), ESM-only, built with plain `tsc` to `dist/`. Two executables:

- `create-stackjoist` → scaffolding (`npm create stackjoist@latest`, `pnpm create stackjoist`)
- `stackjoist` → `list`, `doctor`, `add`

Both point at the same entry and accept the same subcommands, so `npx create-stackjoist doctor` works without a global install. Rationale in DECISIONS ADR-009.

## Module layout and import direction

```text
src/
  cli/        commander wiring, help text, exit codes (thin)
  commands/   create, list, doctor, add (orchestration only)
  core/       errors, logger, plan, fs-safe, exec, pm, project, state, names
  recipes/    registry (empty) + types; one folder per recipe from P2 on
  addons/     engine, registry, ai-workflows/, ci-github/
  verify/     runs verify steps, collects results
assets/
  templates/<recipe>/   owned template files
  ai/                   AI workflow assets + workflow.json
```

Allowed imports: `cli → commands → (recipes | addons | verify) → core`. `core` imports nothing above it; recipes and add-ons never import each other. Enforced with an ESLint `no-restricted-imports` rule.

## Core concepts

- **Plan.** Every mutating command first builds a `Plan` (ordered file and command operations) with no side effects. `--dry-run` prints it; the executor applies it.
- **Staging + atomic finalize.** New projects are generated into a fresh sibling directory `.<name>.stackjoist-<random>` on the same volume, then renamed to the target. On failure or cancellation only that staging directory (verified by a marker file) is removed.
- **Install after finalize.** Dependency installation runs in the final target, not in staging, because pnpm can create links with absolute paths that a rename would break. A failed install keeps the generated files and prints the exact recovery command.
- **Process execution.** All external commands go through `core/exec.ts` (execa, argument arrays, `shell: false`, timeouts, abort on cancel).
- **Package managers.** `core/pm.ts` maps npm/pnpm to install/run/exec commands; detects Yarn/Bun and reports them as unsupported.
- **Errors.** Typed errors map to stable exit codes; user-facing messages include a recovery hint.

## Recipe system

`Recipe { id, title, strategy: 'template' | 'upstream+overlay', compat, upstream?, options, plan(ctx), verify }`. Upstream generators run at an exact pinned version with `--skip-install` and no git; config edits are syntax-aware with shape preconditions and fail clearly on unexpected structure. A scheduled CI canary regenerates against newer upstream versions.

## Add-on system

An add-on declares `ManagedFile`s (owned entirely, hash-tracked) and `MergedFile`s (an idempotent edit of a user-owned file such as `.claude/settings.json`). The engine (`src/addons/engine.ts`) plans one action per file: create, update (managed and unedited), merge, unchanged, adopt (identical file now tracked), sidecar (managed but user-edited: new version written as `<file>.stackjoist-new`) or conflict (unmanaged differing file, or a merge that cannot be done). `add` previews the plan; conflicts block `--yes`; every replaced file is backed up to `.stackjoist/backups/<timestamp>/` (git-ignored); state lives in `.stackjoist/state.json`. After applying, the add-on verifies the files on disk. Removal is not implemented.

## AI workflow

Neutral assets in `assets/ai/` (versioned by `workflow.json`). The `ai-workflows` add-on is the Claude Code adapter: it maps `skills/`, `agents/` and `hooks/` to `.claude/`, installs `AGENTS.md`, merges `CLAUDE.md` and `.claude/settings.json`, and runs the structural validators in `src/addons/ai-workflows/validate.ts`. Details: [AI-WORKFLOWS.md](AI-WORKFLOWS.md).
