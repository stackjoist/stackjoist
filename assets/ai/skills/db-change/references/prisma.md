# Prisma reference

- Check the installed Prisma major version before following any guide: configuration and client generation differ between majors (for example Prisma 7 uses `prisma.config.ts` and requires an explicit generator output and a driver adapter). Prefer the project's existing setup and the official docs for that version.
- Development: `prisma migrate dev` creates and applies a migration and regenerates the client. Review the generated SQL before committing it when the change is risky.
- Deployment: `prisma migrate deploy` applies committed migrations only. Never use `migrate dev`, `db push` or `migrate reset` against shared or production databases.
- `prisma migrate reset` and `db push --force-reset` delete data: they always need explicit approval and a verified local target.
- Handle known errors at the application boundary (for example unique constraint `P2002` → 409 Conflict); never return raw Prisma errors to clients.
- Use `select` to fetch only needed fields, `include` deliberately, and pagination for lists.
