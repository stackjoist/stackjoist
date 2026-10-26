---
name: db-change
description: Plan and review database schema changes, migrations, indexes and queries safely. Use when adding or changing models, collections, tables, migrations, indexes, or queries on data that grows.
---

# Database change

Read the reference for the project's data layer first:

- Prisma: [references/prisma.md](references/prisma.md)
- Mongoose / MongoDB: [references/mongoose.md](references/mongoose.md)

## Steps

1. Inspect the current schema, migration history and the code paths that read and write the affected data.
2. Model from access patterns: which queries run, how often, with which filters and sort orders. Add indexes for them; avoid indexes nobody queries.
3. Plan compatibility: can the old code run against the new schema during deployment? Prefer additive changes (add, backfill, switch, then remove later) over breaking ones.
4. For data that changes shape, write and test a backfill. Consider locking and runtime on large tables or collections.
5. Write down rollback or recovery steps before anything irreversible.
6. Use the project's migration workflow. Never edit a migration that has already been applied anywhere.
7. Check queries for N+1 patterns, unbounded result sets and missing limits.
8. Test against a disposable local or in-memory database.

## Approval required

Ask before: destructive migrations (drop, rename, type narrowing), resets, seeding or migrating any non-test environment, and anything touching production data. Verify the target database URL first and say which one it is.

## Done when

Migration and code changes are reviewed together, tests pass against a test database, operational steps (order, backfill, rollback) are documented, and nothing ran against a non-test database without explicit approval.
