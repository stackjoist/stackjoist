# Progress

## Current phase
P0 — Baseline. Owner answered Q2–Q7 on 2026-10-26 (recorded in [DECISIONS.md](DECISIONS.md)). **Waiting on the package name (ADR-007) and explicit go-ahead for P1.** No implementation has started.

## Last completed
- T0.1 Repository audit.
- T0.2 Baseline proposal: [PROPOSAL.md](PROPOSAL.md) (Bangla translation: [PROPOSAL.bn.md](PROPOSAL.bn.md)).
- Decisions ADR-001…006 recorded; ADR-007 (name) open.

## Name research (2026-10-26)
Method: npm registry lookups (`create-<n>` and `<n>`), GitHub `users/<n>` API, domain RDAP (Verisign `.com`, Google Registry `.dev`, Identity Digital `.io`), web search for existing products. **Not done:** formal trademark search (USPTO / WIPO Global Brand Database / Bangladesh DPDT); these must be checked by the owner before release.

| Name | npm `create-x` / `x` | GitHub name | .com | .dev | .io | Existing products found |
|---|---|---|---|---|---|---|
| **stackmason** | free / free | taken (empty org since 2019) | taken | free | free | none found ("Mason", "Stonemason" are different) |
| **plinthkit** | free / free | free | taken | free | free | "Plinth" = old FreedomBox UI name, some NuGet libs |
| **stackjoist** | free / free | free | free | free | free | "Joist" contractor app, `joist` TS ORM (possible confusion) |
| keelstack | free / free | taken | taken | taken | taken | many "Keel" products incl. a backend platform on npm |
| lintelkit | free / free | free | taken | free | free | sounds like a linter (misleading) |
| trussjs | **rejected by npm** (differs from `truss.js` only by punctuation) | | | | | |

Registry checks only show current registration status; availability can change at any time.

## Verification
- No code yet, so build/lint/test: NOT RUN.
- Docker and Bun not installed locally (BLOCKED for checks that need them).

## Next
Owner picks the name → T0.3 (split PROPOSAL into PRD/ARCHITECTURE/TASKS/TESTING/SECURITY/COMPATIBILITY with the updated four-recipe scope) → P1 CLI core.
