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
  addons/     registry + one folder per add-on            (planned, P3)
  verify/     runs verify steps, collects results         (planned, P2)
assets/
  templates/<recipe>/   owned template files              (planned, P2+)
  ai/                   AI workflow assets + workflow.json (planned, P3)
```

Allowed imports: `cli → commands → (recipes | addons | verify) → core`. `core` imports nothing above it; recipes and add-ons never import each other. Enforced with an ESLint `no-restricted-imports` rule.

## Core concepts

- **Plan.** Every mutating command first builds a `Plan` (ordered file and command operations) with no side effects. `--dry-run` prints it; the executor applies it.
- **Staging + atomic finalize.** New projects are generated into a fresh sibling directory `.<name>.stackjoist-<random>` on the same volume, then renamed to the target. On failure or cancellation only that staging directory (verified by a marker file) is removed.
- **Install after finalize.** Dependency installation runs in the final target, not in staging, because pnpm can create links with absolute paths that a rename would break. A failed install keeps the generated files and prints the exact recovery command.
- **Process execution.** All external commands go through `core/exec.ts` (execa, argument arrays, `shell: false`, timeouts, abort on cancel).
- **Package managers.** `core/pm.ts` maps npm/pnpm to install/run/exec commands; detects Yarn/Bun and reports them as unsupported.
- **Errors.** Typed errors map to stable exit codes; user-facing messages include a recovery hint.

## Recipe system _(planned, P2, P4–P6)_

`Recipe { id, title, strategy: 'template' | 'upstream+overlay', compat, upstream?, options, plan(ctx), verify }`. Upstream generators run at an exact pinned version with `--skip-install` and no git; config edits are syntax-aware with shape preconditions and fail clearly on unexpected structure. A scheduled CI canary regenerates against newer upstream versions.

## Add-on system _(planned, P3)_

Declarative `AddonManifest` (compatibility, conflicts, dependencies, files with modes `create | merge-json | managed`, env, verify, `reversible: false`). Flow: inspect → resolve → plan → preview/conflicts → backup to `.stackjoist/backups/<ts>/` → apply → verify → report. State in `.stackjoist/state.json`.

## AI workflow _(planned, P3)_

Neutral definitions in `assets/ai/` with a versioned `workflow.json`; a `claude-code` adapter writes `AGENTS.md`, `CLAUDE.md` import, `.claude/skills`, `.claude/agents`, `.claude/hooks/*.mjs` and merges hooks plus `permissions.ask` rules into `.claude/settings.json`. Managed files are hash-tracked in `.stackjoist/ai-manifest.json`; user-edited files are never overwritten (new version written as `<file>.stackjoist-new`). Details: [AI-WORKFLOWS.md](AI-WORKFLOWS.md).
