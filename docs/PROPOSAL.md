# StackForge — Baseline Proposal (Phase 0)

> **Status: PROPOSED — awaiting owner approval. Nothing in this document is implemented.**
>
> Working name: "StackForge". The npm package name is **not final** (see §9).
> Once approved, this document will be split into the source-of-truth docs
> (`PRD.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TASKS.md`, `TESTING.md`,
> `SECURITY.md`, `COMPATIBILITY.md`, `AI-WORKFLOWS.md`) and then deleted, so the
> same rules are not kept in two places.
>
> Evidence date: 2026-10-26. All versions below come from `npm view` on that date.

---

## 1. Repository audit

| Item | Finding |
|---|---|
| Git | Branch `main`, **no commits**. `AGENTS.md` and `CLAUDE.md` are staged by the owner and are preserved untouched. |
| `CLAUDE.md` | One line: `@AGENTS.md`. |
| `AGENTS.md` | 508 lines; the authoritative engineering policy (§0–§15). Not modified. |
| Code / manifests / lockfiles / CI | None. This is a **new project**. |
| Runtime (local) | Node `v24.18.1`, npm `12.1.0`, pnpm `12.15.0`, Yarn `1.22.22` (fetched via Corepack during this audit), Git `2.55.0`. |
| Not available locally | **Docker** (not installed), **Bun** (not installed). Checks that need them will be `BLOCKED` locally and run in CI only. |
| OS | Windows 11. Windows path and process handling (`.cmd` shims, reserved file names, `\` separators) is a first-class concern, not an afterthought. |

### Facts found that change the brief

1. **`create-stackforge` is taken on npm** (v0.4.2, created 2026-02-13, ~28 downloads/month). Its description ("universal full-stack boilerplate generator … AI agent integrations") overlaps directly with this product, and it already ships bins `create-stackforge` **and** `stackforge`. **`stackforge` is also taken** (v1.0.0), and so is `stackforge-cli`. npm rejects new names that differ from an existing name only by punctuation, so `create-stack-forge` is not a real option even though it shows as a 404. → Open question Q1.
2. **Prisma's `latest` dist-tag points to a release candidate** (`8.0.0-rc.27`). The last stable release is `7.10.1` (`prev` tag). This shows concretely why the CLI must not install `@latest` blindly.
3. **Current majors moved recently:** TypeScript 7.0 (native compiler), Vite 8, create-vite 9, Next.js 16.4, NestJS 12, Express 5, Mongoose 9, Zod 4, ESLint 10, Vitest 5, Tailwind 4.3. Every recipe adapter will be checked against these versions' actual output, not against older docs.
4. **Node.js:** v26 is current and Node 20 reached end of life in April 2026. Candidate libraries need Node ≥ 22 (`commander@15` needs ≥ 22.12, `execa@10` needs ≥ 22).

---

## 2. Product definition

**Problem.** Starting a TypeScript project with a reliable stack (validation, error handling, tests, env config, a local database, CI) takes days of piecing parts together, and most generators produce something that only looks finished. Teams using AI coding agents have a second problem: there is no reliable, versioned way to install and update engineering guardrails (instructions, skills, subagents, hooks) across repositories.

**StackForge** generates verified starter projects and installs a versioned AI Development Operating System. The scaffolder and the AI workflow are independent: either can be used without the other.

### Proposed MVP (v0.1)

| In | Out (deferred, not dropped) |
|---|---|
| `create` (interactive + non-interactive, `--dry-run`) | Next.js and NestJS+Prisma recipes (v0.2, see Q3) |
| `list`, `doctor`, `add` commands | Express+Prisma/Drizzle, monorepo, auth, Redis, jobs |
| Recipe: **Express + MongoDB + Mongoose** | Yarn Berry and Bun support (detected and reported clearly, not claimed) |
| Recipe: **Vite + React + TS + Tailwind** | User-defined presets, community recipes |
| Add-on engine plus 2–3 add-ons: `ai-workflows`, `ci-github`, (maybe) `env-validation` | Add-on **removal** (only claimed once implemented and tested) |
| AI workflow v1 for **Claude Code only** | Adapters for other agents |
| npm + pnpm verified | Publishing (needs explicit owner approval) |
| Packed-tarball install verification, CI, publishing guide | |

**Why two recipes first:** they cover the two halves of the product (an API with a database, and a front end with Tailwind) and exercise both recipe strategies (an owned template, and an upstream generator plus overlay). Adding Next.js and Nest afterwards then only means new adapters, not engine changes. Prisma 8 also being in RC right now argues for doing the Nest+Prisma recipe after it settles, or pinning 7.x on purpose.

---

## 3. Architecture

### 3.1 Single package, not a monorepo (for now)

One publishable npm package with module boundaries enforced inside `src/` (an ESLint `no-restricted-imports` rule on allowed import directions, plus tests). Reasons:

- Only one artifact is published. A monorepo adds workspace and build-order costs with no consumer benefit yet.
- The AI workflow is **versioned on its own** through its own manifest (`assets/ai/workflow.json` → `version`), even though it ships inside the same tarball. The installer records the installed workflow version in the target project.
- **Revisit trigger:** if the AI workflow needs a release cadence separate from the CLI, or third parties want it without the scaffolder, extract it to its own package.

### 3.2 Layout

```text
src/
  cli/            # commander wiring, help text, exit codes. Thin.
  commands/       # create, list, doctor, add. Orchestration only.
  core/
    errors.ts     # typed errors (UserError, PreconditionError, ExternalToolError) + exit codes
    logger.ts     # structured events -> pretty TTY output or --json
    plan.ts       # Plan = ordered FileOp[] + CommandOp[]; rendered for --dry-run
    fs-safe.ts    # path validation, symlink checks, staging dir, atomic finalize
    exec.ts       # execa wrapper: argument arrays only, shell:false, timeouts, abort signal
    pm.ts         # package-manager detection/adapter (npm, pnpm; others reported)
    project.ts    # inspect an existing project: manifest, lockfile, framework fingerprint
    state.ts      # .stackforge/state.json (installed add-ons, versions, file hashes)
  recipes/
    registry.ts   # static list; no dynamic loading of arbitrary code
    express-mongoose/  recipe.ts + adapters
    vite-react-tailwind/
  addons/
    registry.ts
    ai-workflows/  ci-github/ ...
  verify/         # runs a recipe's verify commands, collects PASS/FAIL/NOT RUN/BLOCKED
assets/
  templates/<recipe>/...     # owned template files (shipped in the tarball)
  ai/                        # AI workflow assets + workflow.json manifest
```

Import direction: `cli → commands → (recipes | addons | verify) → core`. `core` imports nothing above it. Recipes never import each other.

### 3.3 Recipe system

```ts
interface Recipe {
  id: 'express-mongoose' | 'vite-react-tailwind' /* ... */;
  title: string;
  strategy: 'template' | 'upstream+overlay';
  compat: { node: string; packageManagers: PackageManagerId[] };
  upstream?: { pkg: 'create-vite'; version: '9.3.1'; args: (ctx) => string[] }; // exact pin
  options: RecipeOption[];           // e.g. tests: vitest|none, docker: bool
  plan(ctx: RecipeContext): Plan;    // pure: produces ops, touches nothing
  verify: VerifyStep[];              // typecheck, lint, test, build, smoke
}
```

- **Plan first, then execute.** `plan()` is pure and unit-testable, and `--dry-run` prints it. The executor applies it.
- **Staging directory.** Generation happens in a fresh sibling directory `.<name>.stackforge-<random>` on the same volume. On success it is renamed to the target. On failure or Ctrl-C **only that staging directory** is removed, and a user's existing directory is never touched.
- **Upstream generators** are called at an **exact pinned version** with non-interactive flags, `--skip-install`, and no git. Install happens afterwards through StackForge, once.
- **Config edits** use syntax-aware editing (`magicast` for JS/TS configs; JSON parse/serialize for `package.json`/`tsconfig`) behind a **precondition check**: the adapter asserts the expected shape (for example "`vite.config.ts` default-exports `defineConfig({ plugins: [...] })`"). If the shape differs, it fails with a clear message. No regex rewriting of source files.
- **Version strategy:** each recipe keeps a tested set of dependency versions (exact upstream generator version plus caret ranges for overlay dependencies). The CI "canary" job (scheduled, not per-PR) regenerates against the newest upstream and opens an issue on drift. Bumps are deliberate PRs.

### 3.4 Add-on system

Each add-on declares metadata (stored as data and validated by a schema in tests):

```ts
interface AddonManifest {
  id: string; version: string;
  appliesTo: { frameworks?: FrameworkId[]; requires?: string[]; conflicts?: string[] };
  dependencies?: Record<string,string>; devDependencies?: Record<string,string>;
  files: Array<{ path: string; mode: 'create' | 'merge-json' | 'managed' }>;
  env?: Array<{ name: string; example: string; description: string }>;
  verify: VerifyStep[];
  reversible: false;            // MVP: no removal claimed
  limitations: string[];
}
```

`add <id>` flow: inspect project → resolve compatibility and conflicts → build a plan → show the preview and conflicts (with `--yes` it proceeds only if there are **no** conflicts) → back up every file it modifies to `.stackforge/backups/<timestamp>/` → apply → verify → report every file changed. Re-running is idempotent, and state is tracked in `.stackforge/state.json`.

### 3.5 AI workflow architecture (detail in §5)

- **Source of truth:** `assets/ai/` with `workflow.json` (version, list of skills/agents/hooks, a target-adapter map).
- **Adapter:** `claude-code` only in v1. The adapter maps neutral definitions to `.claude/skills`, `.claude/agents` and `.claude/settings.json` hooks. Each future agent gets its own adapter, and compatibility is claimed only after verification against that agent's docs.
- **Managed-file updates:** the installer records the sha256 of every file it writes. On update: if the file is unchanged since install, it is replaced; if the user edited it, the new version is written next to it as `<file>.stackforge-new` and reported. User edits are never overwritten silently.

---

## 4. Technical choices

| Concern | Choice | Version | Alternatives considered / notes |
|---|---|---|---|
| Language | TypeScript, strict, ESM-only | 6.0.x **or** 7.0.x | TS 7 is the native compiler. **Must verify in T1.2** that `typescript-eslint` supports it; otherwise pin 6.0.x. |
| Runtime | `engines.node: ">=22.12"` | 22 / 24 / 26 | Node 20 is EOL. Required by commander/execa. |
| Arg parsing | `commander` | 15.x | `cac`, `citty`: smaller but less mature help/subcommand handling. |
| Prompts | `@clack/prompts` | 1.x | Good cancellation (`isCancel`) and spinner UX. |
| Processes | `execa` | 10.x | Handles Windows `.cmd` shims, abort, timeouts. `tinyexec` is lighter; reconsider if size matters. |
| Name validation | `validate-npm-package-name` + own rules | — | Own rules add path traversal, Windows reserved names, trailing dots. |
| Config editing | `magicast` (JS/TS), native JSON | 0.5.x | Pre-1.0. Isolated behind adapters so it can be swapped. |
| Build | plain `tsc` → `dist/` | — | A CLI does not need bundling. Fewer moving parts and readable stack traces. tsup/tsdown only if startup time measurably needs it. |
| Tests | `vitest` | 5.x | |
| Lint/format | ESLint 10 + typescript-eslint, Prettier | — | |
| E2E for generated UI | Playwright + `@axe-core/playwright` | — | In generated Vite project tests and the CI recipe job. |

All candidates are MIT/Apache-2.0 (checked via `npm view … license`). New dependencies beyond this table need owner approval, per AGENTS.md §6.

**Recipe stacks (to be confirmed against real generator output in each recipe phase):**

- **Vite:** `create-vite@9.3.1 --template react-ts`, then `tailwindcss` + `@tailwindcss/vite` 4.3.x (plugin in `vite.config.ts`, `@import "tailwindcss";` in CSS), Vitest + Testing Library, Playwright smoke test with axe, light/dark/system theme example.
- **Express:** owned template. Express 5, Mongoose 9, Zod 4 for request and env validation, `helmet`, `cors` (allowlist from env), `pino` logging, `app.ts`/`server.ts` split, health endpoint, centralized 404/error middleware, graceful shutdown (SIGINT/SIGTERM, server close, Mongoose disconnect, exit timeout), Docker Compose for MongoDB, Vitest + Supertest, integration tests on `mongodb-memory-server` (no Docker needed; it downloads a `mongod` binary, so it needs network on first run).
- **Next.js (v0.2):** `create-next-app@16.4.x` with explicit flags (`--ts --tailwind --eslint --app --src-dir? --skip-install --disable-git --use-<pm>`). Flags must be re-verified against `--help` of the pinned version.
- **NestJS + Prisma (v0.2):** `@nestjs/cli@12` `nest new … --skip-install --skip-git --strict`. Prisma pinned to the **7.x stable line** unless 8.0 is GA by then. Prisma 7's workflow (`prisma.config.ts`, the `prisma-client` generator with an explicit output, the driver adapter `@prisma/adapter-pg`, no automatic `.env` loading) **must be verified against the installed version's docs at implementation time**. Listed here from memory, not yet verified.

Docs used for this proposal: Claude Code [skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [hooks](https://code.claude.com/docs/en/hooks), [plugins](https://code.claude.com/docs/en/plugins) (fetched 2026-10-26). Framework docs are fetched per recipe phase.

---

## 5. AI workflow design (Claude Code adapter, v1)

### 5.1 Verified platform facts (from the docs fetched today)

- Skills: `.claude/skills/<name>/SKILL.md`. Frontmatter must start on line 1. `description` (plus `when_to_use`) is truncated at **1,536 chars**. `disable-model-invocation: true` is for side-effecting workflows. Supporting files load on demand (progressive disclosure), and `SKILL.md` should stay under 500 lines. **Unknown frontmatter fields are silently ignored**, so the validator must catch typos.
- Subagents: `.claude/agents/*.md`. `name` (no `:`, no leading `-`) and `description` are required. `tools` is an allowlist, which is **real enforcement**. A subagent can only spawn subagents if `Agent` is in its tools.
- Hooks: `.claude/settings.json` → `hooks.<Event>[].{matcher, hooks[]}`. `PreToolUse` blocks via exit 2 or `permissionDecision: "deny" | "ask"`. **The docs say hooks are best-effort and that hard allow/deny belongs in the permission system.** A hook that fails or times out does **not** block unless `onFailure: "block"` is set.
- Plugins are an alternative distribution channel (`.claude-plugin/plugin.json`, marketplaces, namespaced `/plugin:skill`). See Q5.

### 5.2 What gets installed (`add ai-workflows`, or the opt-in during `create`)

```text
AGENTS.md                    # policy: see Q4 for how it is distributed
CLAUDE.md                    # "@AGENTS.md" (if CLAUDE.md exists: add the import line only if missing, after preview)
.claude/skills/<name>/SKILL.md (+ references/*.md)
.claude/agents/<name>.md
.claude/hooks/*.mjs          # Node scripts (cross-platform), run in exec form: node + args
.claude/settings.json        # merged: adds hooks + "ask" permission rules; user keys preserved
.stackforge/ai-manifest.json # workflow version + sha256 per managed file
```

**No permission is ever widened.** The installer adds only `permissions.ask` rules (for example `Bash(npm publish:*)`, `Bash(git push:*)`, `Bash(git reset --hard:*)`) and never adds `allow` rules or `bypassPermissions`.

### 5.3 Initial skills (10, each with scope / triggers / prerequisites / steps / safety / verification / definition of done)

| Skill | Purpose | Invocation |
|---|---|---|
| `repo-discovery` | Inspect state, instructions, git, scripts before changing anything | model + user |
| `plan-task` | Clarify requirements, write the plan and a `TASKS.md` entry with acceptance criteria | model + user |
| `tdd` | Red → green → refactor; regression test first for bugs | model + user |
| `debug-root-cause` | Reproduce, isolate, fix; includes CI-failure triage; 3-attempt stop rule | model + user |
| `api-endpoint` | Endpoint with validation, authz, error shape, tests; `references/express.md`, `references/nestjs.md` | model + user |
| `db-change` | Schema/migration/index review; `references/prisma.md`, `references/mongoose.md` | model + user |
| `ui-verify` | Breakpoints, states, theme (light/dark/system), keyboard, axe; Playwright when present, otherwise reports NOT RUN | model + user |
| `security-review` | Trust boundaries, input, authz, secrets, `npm audit` | model + user |
| `verify-and-handoff` | Run discovered checks, report PASS/FAIL/NOT RUN/BLOCKED, update `PROGRESS.md`/`TASKS.md` | model + user |
| `release-prep` | Pack, inspect tarball, changelog; never publishes | **user only** (`disable-model-invocation: true`) |

Stack-specific guidance sits in `references/` so a task loads only the stack it touches.

### 5.4 Subagents and orchestration

| Agent | Tools (enforced allowlist) | Writes? |
|---|---|---|
| `planner` (also covers the architect role) | Read, Grep, Glob, WebFetch | No |
| `implementer` | Read, Edit, Write, Grep, Glob, Bash | **Only writer of source files** |
| `test-engineer` | Read, Edit, Write, Grep, Glob, Bash | Test files only (instruction-level; see note) |
| `ui-reviewer` | Read, Grep, Glob, Bash | No |
| `security-reviewer` | Read, Grep, Glob, Bash | No |
| `code-reviewer` | Read, Grep, Glob, Bash | No |

- I propose **folding "architect" into `planner`**, which escalates material design decisions to the human, to avoid two agents with overlapping remits. Tell me if you want them separate.
- **Routing** (in an `orchestrate` skill, user-invocable only): S tasks (≤1 module, no contract change) → implementer + verify. M → planner → implementer → test-engineer → code-reviewer. L or sensitive (auth, data, money, public API) → adds security-reviewer, and ui-reviewer for UI changes.
- **Rules:** one writer at a time; only read-only reviewers run in parallel. Reviewers read `git diff` and re-run the checks themselves rather than trusting the implementer's summary. Every agent ends with a fixed report block (Scope / Evidence / Findings / Verdict / NOT RUN). Max 3 fix cycles, then escalate to the human. Human-approval boundaries are inherited from AGENTS.md §5.
- **Honest limit:** "test-engineer writes only tests" is an instruction, not something the platform enforces. Read-only reviewers *are* enforced by `tools`.

### 5.5 Hooks (minimal set)

1. `PreToolUse` / `Bash`: flags destructive or externally visible commands (`git push`, `--force`, `reset --hard`, `npm publish`, `prisma migrate reset`, `rm -rf` outside the project, `DROP`) → `permissionDecision: "ask"` with a reason. It complements, and does not replace, the `permissions.ask` rules.
2. `PreToolUse` / `Edit|Write`: blocks writes to `.env*` other than `.env.example`, and asks when the content matches high-confidence secret patterns (private keys, `AKIA…`, `ghp_…`, `sk-…`).
3. `SessionStart`: prints the "Next" section of `docs/PROGRESS.md` if it exists (cheap context).

There is no per-edit lint or test hook by default (too expensive). It can be offered as an opt-in later.

### 5.6 How the workflow is verified (deterministic vs. qualitative)

| Check | Type | Automated? |
|---|---|---|
| Frontmatter schema per the docs above (required fields, name rules, 1,536-char cap, unknown-field detection) | static | Yes |
| Reference integrity (every `references/*.md` and `@import` resolves) | static | Yes |
| Policy integrity (installed AGENTS.md matches the source hash; required sections present, e.g. approval rules and the PASS/FAIL/NOT RUN/BLOCKED rule) | static | Yes |
| Installer on fixture repos (empty, existing CLAUDE.md, existing `.claude/settings.json`, user-edited skill, name collision) | integration | Yes |
| Hook scripts: JSON stdin fixtures → exact exit code / decision | unit | Yes |
| Settings merge never adds `allow` / `bypassPermissions` | unit | Yes |
| Skills actually trigger and behave well in Claude Code | qualitative | **No.** Manual checklist; `claude plugin eval` investigated later. Not claimed. |

---

## 6. Security and reliability plan

| Risk | Mitigation | Test |
|---|---|---|
| Path traversal / malicious names | Validate the name (npm rules + no `/ \ ..`, no absolute paths, no Windows reserved `CON/NUL/COM1…`, no trailing dot/space); resolved target must be inside cwd unless `--dir` is explicit | Table-driven unit tests |
| Existing directory | Refuse if the target exists and is non-empty; never `--force`-delete user content | Integration |
| Symlinks | `lstat` the target and every write path; refuse to write through symlinks; staging dir created with `mkdtemp` | Integration (POSIX CI; Windows where permitted) |
| Command injection | `execa` argument arrays, `shell: false`, no interpolation of user input into command strings | Unit + grep-based lint rule against `shell: true` |
| Partial failure / Ctrl-C | Staging dir plus atomic rename; cleanup removes only the dir we created (marker file checked before delete) | Fault-injection tests |
| Overwriting user config (`add`) | Plan + preview, conflicts block `--yes`, backups, hash-tracked managed files | Fixture tests |
| Secrets | Templates ship only `.env.example`; package `files` allowlist; tarball scanned in release check | Release test |
| Install-time scripts | pnpm blocks dependency build scripts by default. Recipes declare the exact packages that need them (e.g. Prisma, esbuild), **verified for pnpm 12 config syntax** | Recipe tests |
| Generated tests hitting prod DBs | Test configs use in-memory or `localhost` test DBs and refuse to run if `NODE_ENV=production` or the URI is non-local | Template tests |
| Upstream drift | Exact generator pins, shape preconditions, scheduled canary | CI |
| Malicious template content | Templates are only first-party files from the tarball in v1; no remote templates | — |
| Hooks are bypassable | Documented as best-effort; real enforcement via `permissions.ask`, CI, branch protection | Docs |

---

## 7. Testing strategy

| Layer | What | Where it runs |
|---|---|---|
| Unit | name/path validation, PM detection, plan building, settings merge, manifest schemas, hook scripts | every PR, all OS |
| CLI integration | run the built CLI (`node dist/...`) in temp dirs: flags, `--dry-run`, `--yes`, invalid input, existing dir, simulated cancellation, process failure, exit codes, `--json` output | every PR, ubuntu + windows |
| Recipe generation (fast) | generate with `--no-install`, assert files, manifest, config shape | every PR |
| Recipe verification (full) | generate → install (npm, pnpm) → typecheck → lint → test → build → smoke (HTTP `/health`; Playwright + axe at 3 viewports for Vite) | nightly + release + label-triggered |
| DB-backed | Express integration tests on mongodb-memory-server; Compose files checked with `docker compose config` | CI (Docker **BLOCKED locally**) |
| Add-on | compatibility resolution, conflicts, idempotent re-run, update, failure recovery from backups | every PR |
| AI workflow | §5.6 | every PR |
| Package distribution | `npm pack` → inspect file list → install the tarball in a clean dir → run `create`/`list`/`doctor` from it → confirm assets resolve and the shebang/bin work | every PR (ubuntu), release (all OS) |
| Security | `npm audit --omit=dev` (CLI deps) + generated projects; secret scan of the tarball | every PR / release |

CI matrix: Node 22/24/26 × ubuntu/windows/macOS for unit + CLI. The full recipe matrix runs on Node 24 × ubuntu + windows to keep cost sane. Reports always list NOT RUN/BLOCKED explicitly.

---

## 8. Roadmap

Each phase ends with the AGENTS.md §13/§14 handoff. Detailed acceptance criteria for each task go into `docs/TASKS.md` on approval.

| Phase | Tasks (IDs) | Depends on | Acceptance (summary) | MVP? |
|---|---|---|---|---|
| **P0** Audit & baseline | T0.1 audit ✅ · T0.2 this proposal ✅ · T0.3 split into source-of-truth docs after approval | — | Owner approval recorded in DECISIONS.md | ✔ |
| **P1** CLI core | T1.1 package scaffold (tsconfig, eslint, prettier, vitest, scripts) · T1.2 TS 6 vs 7 compatibility check · T1.3 errors/logger/exit codes · T1.4 fs-safe + staging · T1.5 exec + pm adapters · T1.6 `create` skeleton with prompts, flags, `--dry-run`, cancellation · T1.7 `list` · T1.8 `doctor` (Node/PM/git versions, project state) · T1.9 pack-and-install smoke test | P0 | All CLI integration tests above pass on Windows + Linux; packed tarball runs `list` | ✔ |
| **P2** Express + Mongoose | T2.1 template · T2.2 recipe plan + options · T2.3 generated-project tests · T2.4 full verify (npm + pnpm) | P1 | Generated project: typecheck, lint, unit + integration tests, build, `/health` smoke all PASS | ✔ |
| **P3** Add-on engine + AI workflows | T3.1 project inspector + state · T3.2 add-on engine (plan/preview/backup/apply/verify) · T3.3 AI assets: 10 skills, 6 agents, 3 hooks, `orchestrate` · T3.4 Claude Code adapter + settings merge · T3.5 managed-file update · T3.6 validators + fixture tests · T3.7 `docs/AI-WORKFLOWS.md` incl. manual checklist | P1 | §5.6 automated checks PASS; installing twice is a no-op; user-edited file is preserved | ✔ |
| **P4** Vite + React + Tailwind | T4.1 upstream+overlay adapter · T4.2 theme/a11y example page · T4.3 Playwright + axe at 3 viewports · T4.4 full verify | P1 (P3 for opt-in AI) | build/typecheck/lint/test PASS; Tailwind classes present in built CSS; axe zero serious violations on the example page | ✔ |
| **P5** CI + release readiness v0.1 | T5.1 CI workflows (tiered) · T5.2 canary job · T5.3 README/CONTRIBUTING/CHANGELOG/PUBLISHING/RELEASE · T5.4 release-readiness report | P2–P4 | Everything in brief §10 "Release verification" with evidence; **no publish** | ✔ |
| **P6** Next.js recipe | T6.x | P5 | as P4 + loading/error/not-found routes | v0.2 |
| **P7** NestJS + Postgres + Prisma | T7.x (Prisma line decided at start) | P5 | build/test PASS; Prisma generate/migrate against CI Postgres service | v0.2 |
| **P8** More add-ons, recipes, other agent adapters | — | demand | — | later |

The order differs from the brief: the add-on engine and AI workflows (P3) come **before** Vite because `add ai-workflows` is the first real add-on and the product's differentiator. The engine is built against a real consumer instead of hypothetically.

---

## 9. Package naming and release strategy

- **Needs your decision (Q1).** `create-stackforge` and `stackforge` are taken by a similar product. Options:
  - **A. New brand (recommended).** Unscoped `create-<brand>`, so users run `npm create <brand>@latest`. Names that were free on npm on 2026-10-26: `create-stacksmith`, `create-keelstack`, `create-stackwright`, `create-anvilstack`, `create-stackgate`. GitHub org, domain and trademark availability were **not** checked.
  - **B. Keep "StackForge", scoped.** `@<your-scope>/create-stackforge`, so users run `npm create @<your-scope>/stackforge`. This works technically but lives next to an unrelated `create-stackforge` that does similar things, which will confuse users and search.
- **Bins:** one package with two bins, `create-<brand>` (scaffold) and `<brand>` (`list`/`doctor`/`add`). Subcommands also work as `npx create-<brand> doctor`, which needs no global install.
- **Release:** ESM-only, Node ≥ 22.12, `files` allowlist (`dist`, `assets`, README, LICENSE), SemVer starting `0.1.0`, npm trusted publishing (OIDC) from a separate, manually triggered GitHub Actions workflow with provenance and minimal `permissions`.
- **Approval required for:** final name, license (Q6), author/repo metadata, any `npm publish`, creating the GitHub repo or release, pushing workflows that can publish.

---

## 10. Open questions (decisions that change the build)

- **Q1 — Name:** new brand (which?) or a scoped `@scope/create-stackforge`?
- **Q2 — MVP size:** v0.1 = Express + Vite (recommended), or all four recipes before the first release?
- **Q3 — Prisma line for the Nest recipe:** pin stable 7.x, or wait for 8.0 GA?
- **Q4 — Policy distribution:** your AGENTS.md is the policy. In generated projects, should StackForge (a) install your AGENTS.md verbatim as a managed, hash-tracked file (recommended: one policy, updated by `add ai-workflows --update`), or (b) install a shorter project AGENTS.md that references a versioned copy under `.stackforge/policy/`? Some sections are product-specific (e.g. Shopify, SEO); verbatim keeps them because they are already marked "when used".
- **Q5 — AI distribution channel:** managed files in `.claude/` (recommended for v1: visible, committed, works for the whole team without extra steps), or also a Claude Code plugin/marketplace later?
- **Q6 — License and identity:** MIT? Author name/email and GitHub repo URL for `package.json` (placeholders until given).
- **Q7 — Package managers:** verify npm + pnpm only in v0.1 (yarn/bun reported as unsupported with a clear message)? Bun is not installed here, so it cannot be verified locally anyway.

Low-impact defaults I will use unless told otherwise: Prettier formatting, Conventional Commits, `pino` for Express logging, Zod for validation, a light/dark/system theme in the Vite example, `--json` output mode for CI.

---

## 11. Recommended baseline

Approve **v0.1 = CLI core + Express/Mongoose + Vite/React/Tailwind + add-on engine with `ai-workflows` (Claude Code) + release readiness (no publish)**, single package, ESM, Node ≥ 22.12, npm + pnpm, under a new brand name.

It is the smallest release that proves every hard part of the product: an owned template, an upstream generator plus overlay, safe edits to existing projects, AI workflow install/update with integrity checks, and installing from the packed tarball. All of it can be verified on this machine except Docker-based checks, which run in CI. Next.js and NestJS+Prisma then become additive adapters in v0.2 rather than engine redesigns.
