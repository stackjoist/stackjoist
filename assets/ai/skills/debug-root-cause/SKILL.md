---
name: debug-root-cause
description: Reproduce, isolate and fix a failure at its root cause - failing tests, runtime errors, CI failures, flaky behaviour. Use when something is broken and the cause is not yet proven.
---

# Debug to the root cause

## Steps

1. **Capture.** Get the exact error, command, environment (OS, runtime and tool versions) and the first point of failure in the log, not the last.
2. **Reproduce.** Make it fail locally with the smallest command. For CI failures, run the same command CI runs, with the same package manager and Node version. If it cannot be reproduced, say so and collect more evidence instead of guessing.
3. **Classify.** Introduced by the current change, pre-existing, or environmental (network, credentials, missing tool)? Compare with the last green commit or CI run, without stashing, resetting or otherwise disturbing the user's uncommitted work.
4. **Isolate.** Form one hypothesis at a time and test it with a minimal experiment (a log line, a narrower test, a bisect). Record what each experiment showed.
5. **Fix the cause**, not the symptom. Add a regression test that fails without the fix (see the `tdd` skill).
6. **Verify.** Re-run the failing command, then the full verification sequence from AGENTS.md section 10.

## Stop rule

After three focused attempts without progress, stop changing code. Report the exact error, the commands run, the hypotheses tested and what you need (access, a decision, more information).

## Safety

- Do not disable tests, lint rules, type checks or security controls to make a failure disappear.
- Do not run destructive commands (resets, data deletion, force pushes) while debugging without approval.

## Done when

The root cause is stated with evidence, a regression test covers it, and the verification results are reported honestly.
