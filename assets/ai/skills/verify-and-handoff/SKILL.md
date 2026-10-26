---
name: verify-and-handoff
description: Run the project's real verification commands, report each result honestly as PASS/FAIL/NOT RUN/BLOCKED, review the diff, and update docs/TASKS.md and docs/PROGRESS.md. Use at the end of every task, before saying it is done.
---

# Verify and hand off

## Steps

1. Discover the real commands from `package.json` scripts, CI workflows and `docs/DEVELOPMENT.md`. Use the project's package manager. Never invent a script.
2. Run, in order, those that apply: focused tests, full test suite, lint, format check, typecheck, build, E2E, plus UI/theme/accessibility checks (`ui-verify`) and security checks (`security-review`) when the change calls for them.
3. Read each output. A command that was not run is NOT RUN; one that could not run (missing service, credentials, tool) is BLOCKED with the reason.
4. If something fails because of your change, fix it and re-run the whole sequence, not only the failed command.
5. Review `git status` and `git diff`: only intended files changed, no unrelated formatting, no secrets, no debug leftovers. Pre-existing user changes are untouched.
6. Update `docs/TASKS.md` (status, acceptance criteria met or not) and `docs/PROGRESS.md` (current state, what changed, verification results, blockers, one next task). Update other docs only where behaviour or contracts changed.

## Handoff format

- **Completed:** what changed and why.
- **Files:** main files changed.
- **Verification:** each check with command and PASS / FAIL / NOT RUN / BLOCKED.
- **Notes:** risks, limitations, assumptions.
- **Next:** one recommended next task.

## Rules

- Never claim a check passed without running it and reading the result.
- A build passing is not proof of correctness, security or accessibility.
- Do not commit, push or publish unless the user has authorized it.

## Done when

The handoff is delivered, every required check has an honest status, and the task docs match reality.
