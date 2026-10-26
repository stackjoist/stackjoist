# Decisions

Format: context, decision, alternatives, consequences, status. Details of each option are in [PROPOSAL.md](PROPOSAL.md) until it is split into the source-of-truth docs.

---

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

## ADR-007 — Package name
- **Date:** 2026-10-26 · **Status:** Open — owner choosing
- **Context:** `create-stackforge`, `stackforge` and `stackforge-cli` are taken on npm by unrelated projects, one with near-identical scope.
- **Candidates and checks (2026-10-26):** see the name research in PROGRESS.md. No formal trademark search (USPTO/WIPO) was done.
