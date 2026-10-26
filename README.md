# StackJoist

Scaffold verified TypeScript projects, add capabilities to existing ones, and install a versioned AI development workflow for coding agents.

> **Status: early development, not yet published to npm.** One template is available: `express-mongoose` (Express 5 + MongoDB/Mongoose API), verified with npm and pnpm on Windows. The `add` command offers `ai-workflows` (Claude Code skills, subagents and safety hooks) and `ci-github`. More templates are in progress; see [docs/PROGRESS.md](docs/PROGRESS.md).

## Planned for v0.1

- Templates still to come: Vite + React + Tailwind CSS, Next.js + Tailwind CSS, NestJS + PostgreSQL + Prisma.

Supported today: npm and pnpm, Node.js 22.12 or newer. The planned items above are not available yet. See [docs/PRD.md](docs/PRD.md) for scope and [docs/TASKS.md](docs/TASKS.md) for status.

## Usage (once published)

```bash
npm create stackjoist@latest my-app
pnpm create stackjoist my-app
npx create-stackjoist list
npx create-stackjoist doctor

# inside an existing project
npx create-stackjoist add ai-workflows --dry-run
npx create-stackjoist add ai-workflows
npx create-stackjoist add ci-github
```

`add` never overwrites files: changed files are backed up in `.stackjoist/backups/`, and your own edits are kept (new versions go to `*.stackjoist-new`). See [docs/AI-WORKFLOWS.md](docs/AI-WORKFLOWS.md).

Useful flags for `create`: `--template <id>`, `--pm npm|pnpm`, `--yes` (never prompt), `--dry-run` (show the plan, write nothing), `--no-install`, `--no-git`, `--json`.

Exit codes: `0` success, `1` unexpected error, `2` invalid usage, `3` failed precondition (for example, a non-empty target directory), `4` an external tool failed, `130` cancelled.

## Safety

StackJoist never writes outside the target directory, never overwrites existing files, and removes only its own temporary directory when generation fails. Commands run without a shell. Details: [docs/SECURITY.md](docs/SECURITY.md).

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

[MIT](LICENSE) © Khaled Siddique
