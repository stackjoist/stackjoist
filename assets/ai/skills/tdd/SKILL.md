---
name: tdd
description: Implement or fix behaviour test-first (red, green, refactor), including regression tests for bugs. Use when adding business logic, fixing a bug, or changing behaviour that tests can describe.
---

# Test-driven development

## Steps

1. Find the existing test setup (runner, folders, helpers, naming). Follow it; do not add a new test framework without approval.
2. **Red.** Write the smallest test that describes the next piece of behaviour, or reproduces the bug through the public interface. Run it and confirm it fails for the expected reason, not because of a typo or missing import.
3. **Green.** Write the minimum code that makes it pass. Run the focused test.
4. **Refactor.** Improve names and structure with all tests green. Run the focused tests again.
5. Repeat for edge cases: empty and boundary values, invalid input, failure of dependencies, authorization, concurrency where relevant.
6. Run the whole suite to catch regressions, then the project's typecheck and lint.

## Rules

- Test behaviour through public interfaces, not private details.
- Mock only at system boundaries (network, third-party APIs, clock). Never call real third-party or production services from tests.
- A bug fix is not done without a test that failed before the fix.
- Never delete, skip or weaken an existing test to get green. If a test is wrong, explain why and get agreement.

## Done when

New tests fail without the change and pass with it, the full suite passes, and you report each command and its result (PASS / FAIL / NOT RUN / BLOCKED).
