#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command, CommanderError } from 'commander';
import { addons } from '../addons/registry.js';
import type { CommandContext } from '../commands/context.js';
import { runAdd } from '../commands/add.js';
import { runCreate } from '../commands/create.js';
import { runDoctor } from '../commands/doctor.js';
import { runList } from '../commands/list.js';
import { ExitCode, exitCodeFor } from '../core/errors.js';
import { execaRunner } from '../core/exec.js';
import { createJsonOutput, createPrettyOutput } from '../core/output.js';
import { clackPrompter } from '../core/prompter.js';
import { recipes } from '../recipes/registry.js';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  version: string;
};

interface CommonFlags {
  json?: boolean;
  debug?: boolean;
  yes?: boolean;
}

const controller = new AbortController();
// Set by the running command so the top-level error handler uses the same output mode.
const mode = { json: false, debug: false };

function context(flags: CommonFlags): CommandContext {
  mode.json = flags.json === true;
  mode.debug = flags.debug === true;
  const interactive =
    process.stdin.isTTY && process.stdout.isTTY && !mode.json && flags.yes !== true;
  return {
    cwd: process.cwd(),
    env: process.env,
    output: mode.json ? createJsonOutput() : createPrettyOutput(),
    runner: execaRunner,
    prompter: interactive ? clackPrompter : undefined,
    signal: controller.signal,
    debug: mode.debug,
  };
}

const program = new Command()
  .name('create-stackjoist')
  .description('Scaffold verified TypeScript projects and add capabilities to existing ones.')
  .version(pkg.version, '-v, --version')
  .exitOverride()
  .showHelpAfterError('(run with --help for usage)');

program
  .command('create [name]', { isDefault: true })
  .description('create a new project (default command)')
  .option('-t, --template <id>', 'template to use (see "list")')
  .option('--pm <name>', 'package manager: npm or pnpm')
  .option('--dir <path>', 'directory to create the project in (default: ./<name>)')
  .option('--no-install', 'skip dependency installation')
  .option('--no-git', 'skip git init')
  .option('-y, --yes', 'never prompt; fail if required options are missing')
  .option('--dry-run', 'show what would be created without writing anything')
  .option('--json', 'machine-readable output')
  .option('--debug', 'show stack traces')
  .addHelpText(
    'after',
    `
Examples:
  npm create stackjoist@latest my-app
  pnpm create stackjoist my-app
  npx create-stackjoist my-api --template <id> --pm pnpm --yes
  npx create-stackjoist my-app --template <id> --dry-run

Run "create-stackjoist list" to see available template ids.`,
  )
  .action(
    async (
      name: string | undefined,
      opts: CommonFlags & {
        template?: string;
        pm?: string;
        dir?: string;
        install: boolean;
        git: boolean;
        dryRun?: boolean;
      },
    ) => {
      await runCreate(
        {
          ...(name === undefined ? {} : { name }),
          ...(opts.template === undefined ? {} : { template: opts.template }),
          ...(opts.pm === undefined ? {} : { pm: opts.pm }),
          ...(opts.dir === undefined ? {} : { dir: opts.dir }),
          install: opts.install,
          git: opts.git,
          dryRun: opts.dryRun === true,
        },
        context(opts),
        recipes,
      );
    },
  );

program
  .command('list')
  .description('list available templates and add-ons')
  .option('--json', 'machine-readable output')
  .action((opts: CommonFlags) => {
    runList(context(opts), recipes, addons);
  });

program
  .command('add <id>')
  .description('add a capability to an existing project (see "list")')
  .option('--dir <path>', 'project directory (default: current directory)')
  .option('--dry-run', 'show what would change without writing anything')
  .option('-y, --yes', 'apply without asking; refuses if files conflict')
  .option('--json', 'machine-readable output')
  .option('--debug', 'show stack traces')
  .addHelpText(
    'after',
    `
Examples:
  npx create-stackjoist add ai-workflows --dry-run
  npx create-stackjoist add ai-workflows
  npx create-stackjoist add ci-github --yes

Existing files are never overwritten. Replaced files are backed up in .stackjoist/backups/.`,
  )
  .action(async (id: string, opts: CommonFlags & { dir?: string; dryRun?: boolean }) => {
    await runAdd(
      {
        id,
        ...(opts.dir === undefined ? {} : { dir: opts.dir }),
        dryRun: opts.dryRun === true,
        yes: opts.yes === true,
      },
      context(opts),
      addons,
    );
  });

program
  .command('doctor')
  .description('check that your environment can run StackJoist')
  .option('--json', 'machine-readable output')
  .action(async (opts: CommonFlags) => {
    await runDoctor(context(opts));
  });

process.once('SIGINT', () => {
  controller.abort();
});

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof CommanderError) {
    // --help and --version arrive here with exit code 0; usage errors are already printed.
    process.exitCode = error.exitCode === 0 ? ExitCode.Success : ExitCode.Usage;
  } else {
    (mode.json ? createJsonOutput() : createPrettyOutput()).error(error, mode.debug);
    process.exitCode = exitCodeFor(error);
  }
}
