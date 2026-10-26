#!/usr/bin/env node
// Installed by StackJoist (managed file). Claude Code PreToolUse hook for file edits.
// - Blocks writes to real environment files (.env, .env.local, ...); templates such as
//   .env.example stay editable.
// - Asks before writing content that looks like a credential.
// Fails open on unexpected input; permission rules remain the hard control.

const ENV_TEMPLATE = /^\.env\.(example|sample|template|defaults)$/i;
const ENV_FILE = /^\.env(\..+)?$/i;

const SECRET_PATTERNS = [
  [/-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY( BLOCK)?-----/, 'a private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/, 'a GitHub token'],
  [/\bsk-(ant-)?[A-Za-z0-9_-]{24,}\b/, 'an API secret key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, 'a Slack token'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'a Google API key'],
];

async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

function decision(permissionDecision, reason) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason: `StackJoist guard: ${reason}`,
    },
  });
}

function writtenContent(toolInput) {
  const parts = [toolInput.content, toolInput.new_string, toolInput.new_source];
  if (Array.isArray(toolInput.edits)) {
    for (const edit of toolInput.edits) parts.push(edit?.new_string);
  }
  return parts.filter((part) => typeof part === 'string').join('\n');
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    return;
  }
  const toolInput = input?.tool_input;
  if (typeof toolInput !== 'object' || toolInput === null) return;

  const filePath = toolInput.file_path ?? toolInput.notebook_path;
  if (typeof filePath === 'string') {
    const base = filePath.split(/[\\/]/).pop() ?? '';
    if (ENV_FILE.test(base) && !ENV_TEMPLATE.test(base)) {
      process.stdout.write(
        decision(
          'deny',
          `${base} holds real secrets and must be edited by a human. Update .env.example instead.`,
        ),
      );
      return;
    }
  }

  const content = writtenContent(toolInput);
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      process.stdout.write(
        decision('ask', `the new content looks like it contains ${label}. Never commit secrets.`),
      );
      return;
    }
  }
}

await main().catch(() => undefined);
