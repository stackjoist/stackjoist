# StackJoist

Scaffold verified TypeScript projects, add capabilities to existing ones, and install a versioned AI development workflow for coding agents.

> **Status: early development, not yet published to npm.** The CLI core (`create`, `list`, `doctor`) works, but **no project templates ship yet**, so `create` currently explains that no recipes are available. Progress is tracked in [docs/PROGRESS.md](docs/PROGRESS.md).

## Planned for v0.1

- Templates: Express + MongoDB + Mongoose, Vite + React + Tailwind CSS, Next.js + Tailwind CSS, NestJS + PostgreSQL + Prisma.
- `add` command for existing projects, starting with an AI workflow for Claude Code (skills, subagents, hooks) and GitHub Actions CI.
- npm and pnpm support on Node.js 22.12 or newer.

None of these are available yet. See [docs/PRD.md](docs/PRD.md) for scope and [docs/TASKS.md](docs/TASKS.md) for status.

## Usage (once published)

```bash
npm create stackjoist@latest my-app
pnpm create stackjoist my-app
npx create-stackjoist list
npx create-stackjoist doctor
```

Useful flags for `create`: `--template <id>`, `--pm npm|pnpm`, `--yes` (never prompt), `--dry-run` (show the plan, write nothing), `--no-install`, `--no-git`, `--json`.

Exit codes: `0` success, `1` unexpected error, `2` invalid usage, `3` failed precondition (for example, a non-empty target directory), `4` an external tool failed, `130` cancelled.

## Safety

StackJoist never writes outside the target directory, never overwrites existing files, and removes only its own temporary directory when generation fails. Commands run without a shell. Details: [docs/SECURITY.md](docs/SECURITY.md).

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

[MIT](LICENSE) © Khaled Siddique
