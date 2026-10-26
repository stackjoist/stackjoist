# Decisions

Format: context, decision, alternatives, consequences, status. The original baseline proposal is in git history (commit `10c6bf2`, `docs/PROPOSAL.md`).

---

## ADR-000 — Baseline approved

- **Date:** 2026-10-26 · **Status:** Accepted (owner: "etai final, shuru koro")
- **Decision:** The baseline proposal is approved with the owner's answers (ADR-001…007). Implementation proceeds phase by phase per [TASKS.md](TASKS.md).

## ADR-001 — v0.1 scope includes all four initial recipes

- **Date:** 2026-10-26 · **Status:** Accepted (owner, answer to Q2)
- **Context:** The proposal recommended v0.1 = Express + Vite, with Next.js and NestJS+Prisma in v0.2.
- **Decision:** v0.1 ships all four recipes: Express+Mongoose, Vite+React+Tailwind, Next.js+Tailwind, NestJS+PostgreSQL+Prisma.
- **Alternatives:** Two recipes first (rejected by owner).
- **Consequences:** Roadmap phases P6 (Next.js) and P7 (NestJS+Prisma) move into the v0.1 MVP, and release readiness (P5) moves after them. CI cost and the verification matrix grow; each recipe must still be fully verified before release.

## ADR-002 — Prisma pinned to the stable 7.x line

- **Date:** 2026-10-26 · **Status:** Accepted (owner, Q3)
- **Context:** npm `latest` for `prisma` points to `8.0.0-rc.27`; last stable is `7.10.1`.
- **Decision:** The NestJS recipe uses Prisma 7.x stable. Prisma 7's configuration and client-generation workflow is verified against the installed version's docs during P7.
- **Consequences:** A later move to Prisma 8 is a deliberate, separately tested upgrade.

## ADR-003 — Owner's AGENTS.md is installed verbatim in generated projects

- **Date:** 2026-10-26 · **Status:** Accepted (owner, Q4)
- **Decision:** `add ai-workflows` installs the owner's `AGENTS.md` unchanged as a managed, hash-tracked file. `CLAUDE.md` gets `@AGENTS.md`. Updates follow the managed-file rule: unchanged files are replaced; user-edited files get a `.stackforge-new` sibling instead.
- **Alternatives:** A short AGENTS.md pointing to a versioned copy under `.stackforge/policy/` (rejected).
- **Consequences:** One policy text everywhere. Its stack-specific sections are already conditional ("when used").

## ADR-004 — AI workflow delivered as managed files in `.claude/`

- **Date:** 2026-10-26 · **Status:** Accepted (owner, Q5)
- **Decision:** Skills, agents and hooks are written into the project's `.claude/` folder and committed with it. A Claude Code plugin/marketplace distribution is not part of v0.1.
- **Consequences:** Works for the whole team without extra install steps. StackForge owns update and conflict handling through `.stackforge/ai-manifest.json`.

## ADR-005 — License and author

- **Date:** 2026-10-26 · **Status:** Accepted (owner, Q6)
- **Decision:** MIT license. Author: Khaled Siddique <khaledssbd@gmail.com>. Repository URL to be added once the name is final.

## ADR-006 — Supported package managers: npm and pnpm

- **Date:** 2026-10-26 · **Status:** Accepted (owner, Q7)
- **Decision:** v0.1 verifies npm and pnpm only. Yarn and Bun are detected and reported as unsupported with a clear message.

## ADR-007 — Name: StackJoist

- **Date:** 2026-10-26 · **Status:** Accepted (owner)
- **Context:** `create-stackforge`, `stackforge` and `stackforge-cli` are taken on npm by unrelated projects, one with near-identical scope. Owner prioritised SEO and a unique brand term.
- **Decision:** Brand **StackJoist**; npm package `create-stackjoist`; bins `create-stackjoist` and `stackjoist`; repository https://github.com/stackjoist/stackjoist (organization owned by the owner's personal account).
- **Checks (2026-10-26):** npm `create-stackjoist`, `stackjoist`, `stack-joist` unregistered; GitHub name `stackjoist` was free (now the org); `stackjoist.com/.dev/.io` unregistered via RDAP; no existing software found by web search.
- **Alternatives:** stackmason (owner saw it in search results), plinthkit, keelstack, lintelkit; trussjs (npm would reject: punctuation-only difference from `truss.js`).
- **Consequences / risks:** "Joist" is used by a contractor app and the `joist` TS ORM; mild confusion risk for the bare word. npm names cannot be reserved before the first publish. Formal trademark search and domain purchase are owner actions.

## ADR-008 — TypeScript 6.0.x for development

- **Date:** 2026-10-26 · **Status:** Accepted
- **Context:** TypeScript 7.0 (native compiler) is the latest release, but `typescript-eslint@8.72` declares `typescript >=4.8.4 <6.1.0`.
- **Decision:** Use TypeScript 6.0.x. Revisit when `typescript-eslint` supports 7.x.

## ADR-009 — Single package, two bins, plain `tsc`

- **Date:** 2026-10-26 · **Status:** Accepted (part of the approved baseline)
- **Decision:** One npm package (no monorepo) exposing `create-stackjoist` and `stackjoist`, both running the same CLI. Build with plain `tsc` (no bundler). The AI workflow carries its own version in `assets/ai/workflow.json`.
- **Alternatives:** pnpm monorepo with separate packages; tsup/tsdown bundling.
- **Revisit when:** the AI workflow needs an independent release cadence, or CLI startup time measurably needs bundling.

## ADR-010 — Own npm-name validator instead of `validate-npm-package-name`

- **Date:** 2026-10-26 · **Status:** Accepted
- **Context:** `validate-npm-package-name@8` requires Node `^22.22.2 || ^24.15.0 || >=26`, narrower than our `>=22.12`. We also need extra filesystem rules (Windows reserved names, traversal) that it does not cover.
- **Decision:** Implement the documented npm naming rules plus filesystem rules in `src/core/names.ts`, covered by table-driven tests.
- **Consequences:** One fewer runtime dependency; we maintain the rules ourselves.

## ADR-011 — pnpm build-script policy in generated projects

- **Date:** 2026-10-26 · **Status:** Accepted
- **Context:** pnpm 12 fails `pnpm install` (`ERR_PNPM_IGNORED_BUILDS`) when a dependency has an install script that is not reviewed in `allowBuilds` (pnpm ≥ 10.26; the older `onlyBuiltDependencies` family was removed in pnpm 11). The Express recipe pulls in `esbuild` (via `tsx`) and `mongodb-memory-server`.
- **Decision:** For pnpm, recipes write `pnpm-workspace.yaml` with an explicit `allowBuilds` entry per package. Both are set to `false`: esbuild's script only verifies its binary, and mongodb-memory-server downloads MongoDB on first use anyway. Verified: install, tests and build pass with both denied.
- **Consequences:** Fewer scripts run on users' machines. Each new recipe must review its own install scripts. npm still runs install scripts as usual.

## ADR-012 — First-party templates shipped inside the package

- **Date:** 2026-10-26 · **Status:** Accepted
- **Decision:** Template files live in `assets/templates/<recipe>/` and are copied as-is; only listed files get `{{placeholder}}` substitution, and unknown placeholders fail generation. `package.json` is generated in code so tested version ranges live in one place. `.gitignore` is stored as `_gitignore` because npm never packs `.gitignore`.
- **Alternatives:** Downloading templates at runtime (rejected: network dependency, supply-chain risk); copying from a git repo (same).
- **Consequences:** Templates are versioned with the CLI and verified by the pack smoke test from an installed tarball.

## ADR-013 — Add-on file ownership: managed vs merged, never overwrite

- **Date:** 2026-10-26 · **Status:** Accepted
- **Decision:** Files an add-on owns are hash-tracked in `.stackjoist/state.json` and replaced on update only if unchanged since StackJoist wrote them; otherwise the new version is written as `<file>.stackjoist-new`. Files the user owns (`CLAUDE.md`, `.claude/settings.json`) only receive idempotent merges. Unmanaged differing files are conflicts: `--yes` refuses; interactive confirmation writes sidecars only. Every replaced or merged file is backed up first. One state file for all add-ons replaces the earlier `ai-manifest.json` idea.
- **Alternatives:** three-way merges (complex, error-prone for prose files); overwrite with backup (loses user intent silently).
- **Consequences:** Updates are safe but may leave `.stackjoist-new` files for the user to merge. Removal is not automated.

## ADR-014 — Claude Code hooks in exec form, failing open

- **Date:** 2026-10-26 · **Status:** Accepted
- **Decision:** Hooks are Node scripts registered as `"command": "node"` with `args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/…"]`, which the docs say runs without a shell on every OS. Scripts fail open on malformed input. Hard control comes from `permissions.ask` rules, which the docs say are evaluated before allow rules.
- **Consequences:** Works on Windows without Git Bash. A broken hook never blocks work, so hooks are documented as a safety net only.

## ADR-015 — GitHub Actions pinned to commit SHAs in generated CI

- **Date:** 2026-10-26 · **Status:** Accepted
- **Decision:** The `ci-github` add-on pins actions/checkout v7.0.1, actions/setup-node v7.1.0 and pnpm/action-setup v6.1.0 to full commit SHAs (verified via the GitHub API) with the version in a comment, uses `permissions: contents: read` and `persist-credentials: false`.
- **Consequences:** A moved tag cannot change what runs; updating actions is a deliberate change.
