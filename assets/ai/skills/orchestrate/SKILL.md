---
name: orchestrate
description: Coordinate a task across the planner, implementer, test-engineer and reviewer subagents, choosing only the specialists the task needs. Run when the user asks for an orchestrated or multi-agent workflow.
disable-model-invocation: true
argument-hint: '<task description>'
---

# Orchestrate a task

Task: $ARGUMENTS

## 1. Size the task

- **S** - one module, no contract, data or security change: implementer, then `verify-and-handoff`.
- **M** - several modules or a behaviour change: planner → (human approval if needed) → implementer → test-engineer → code-reviewer.
- **L or sensitive** - auth, data or migrations, payments, public APIs, dependencies: M plus security-reviewer. Any UI change adds ui-reviewer.

State the size and the chosen agents, with one sentence of reasoning. Do not add agents to look thorough.

## 2. Contracts between agents

Give each agent: the goal, the approved plan or acceptance criteria, the files it may change, and the commands to run. Each agent must end with this block:

```
Scope: what was looked at or changed
Evidence: commands run and their results, files and lines
Findings: problems found (reviewers) or work done (implementer, test-engineer)
Verdict: done | changes needed | blocked (with reason)
Not run: checks that were not executed, and why
```

## 3. Rules

- **One writer at a time.** Only the implementer edits source files; the test-engineer edits test files after the implementer finishes. Never run two writing agents on overlapping files.
- Read-only reviewers (code, security, UI) may run in parallel after implementation.
- Reviewers inspect `git diff` and re-run checks themselves. They do not trust the implementer's summary.
- **Retries:** at most 3 fix cycles between implementer and reviewers. Then stop and report the open findings to the human.
- **Approval boundaries** from AGENTS.md section 5 apply to every agent: no contract changes, new dependencies, destructive commands, migrations on non-test data, commits, pushes or publishing without the human.

## 4. Finish

Run `verify-and-handoff` yourself on the combined result and report the agents used, their verdicts and every NOT RUN or BLOCKED check.
