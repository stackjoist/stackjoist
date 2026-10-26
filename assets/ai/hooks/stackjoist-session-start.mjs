#!/usr/bin/env node
// Installed by StackJoist (managed file). Claude Code SessionStart hook.
// Prints the "Next" section of docs/PROGRESS.md so a new session starts from the
// last handoff. Plain stdout from a SessionStart hook is added to Claude's context.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_CHARS = 2000;

async function main() {
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  let progress;
  try {
    progress = await readFile(path.join(root, 'docs', 'PROGRESS.md'), 'utf8');
  } catch {
    return;
  }
  const match = /^##\s+Next\b[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(progress);
  const next = match?.[1]?.trim();
  if (!next) return;
  const text = next.length > MAX_CHARS ? `${next.slice(0, MAX_CHARS)}…` : next;
  process.stdout.write(
    `Last handoff (docs/PROGRESS.md, "Next"):\n${text}\n\n` +
      'Before changing anything, follow AGENTS.md: verify this against the repository state.\n',
  );
}

await main().catch(() => undefined);
