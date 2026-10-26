---
name: repo-discovery
description: Inspect a repository before changing it - instructions, git state, scripts, structure and existing conventions. Use at the start of a session, before the first change in an unfamiliar area, or when documentation and code may disagree.
---

# Repository discovery

Goal: know what exists, what is in progress and which commands are real before touching anything.

## Steps

1. Read `AGENTS.md` and any more specific instruction files in the directories you will touch. They override this skill.
2. Run `git status` and `git log --oneline -10`. Note every uncommitted change: it belongs to the user, not to you.
3. Read `docs/PROGRESS.md` and `docs/TASKS.md` if they exist. Treat them as claims to verify, not facts.
4. Inspect the root: `package.json` (scripts, dependencies, `engines`, `packageManager`), lockfile (decides the package manager), workspace config, `tsconfig*.json`, CI workflows in `.github/workflows/`.
5. Map the relevant source: entry points, module boundaries, where tests live, how errors and validation are done. Read nearby code before proposing new abstractions.
6. Compare docs with code. Write down every discrepancy.

## Output

A short report:

- Project type and stack (with versions from the lockfile, not from memory).
- Verified commands (only scripts that exist) and the package manager.
- Pre-existing uncommitted changes.
- Discrepancies between docs and code, and which source you will trust and why.
- Open questions that block the task.

## Safety

- Read only. Do not install, build, format or "fix" anything during discovery.
- Never print the contents of `.env` files or other secrets.

## Done when

The report exists and every statement in it was checked against the repository, not assumed.
