---
name: plan-task
description: Turn a request into a small, approved, verifiable plan with acceptance criteria and a docs/TASKS.md entry. Use before any change that touches more than one file, changes behaviour or contracts, or when the request is ambiguous.
---

# Plan a task

## Steps

1. Run the `repo-discovery` skill if you have not inspected the affected area in this session.
2. Restate the request in one or two sentences. List what is explicitly out of scope.
3. Ask only the questions whose answers change architecture, data, security, cost or user-facing behaviour. Use sensible, stated defaults for the rest.
4. Split the work into tasks that can each be reviewed and verified on their own. For each task write:
   - goal and context,
   - files or modules expected to change,
   - acceptance criteria that can be checked (prefer observable behaviour and test names),
   - dependencies,
   - verification plan: the exact commands, plus UI, theme, accessibility or security checks where relevant.
5. Mark decisions that need human approval (see AGENTS.md section 5): contract changes, new dependencies, migrations, destructive or externally visible actions, cost, security trade-offs.
6. Add or update the entries in `docs/TASKS.md` (status `Todo`). Record consequential decisions in `docs/DECISIONS.md`.
7. Present the plan and wait for approval of anything in step 5. Routine, reversible work inside the approved scope does not need further approval.

## Safety

- Planning changes only documentation. Do not start implementing in the same step.
- Do not silently expand scope; if the work grows, re-plan.

## Done when

Every task has checkable acceptance criteria and a verification plan, approvals are explicit, and `docs/TASKS.md` matches what was agreed.
