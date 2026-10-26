#!/usr/bin/env node
// Installed by StackJoist (managed file). Claude Code PreToolUse hook for the Bash tool.
// Asks for human confirmation before destructive or externally visible commands.
// Hooks are best-effort: the real controls are permission rules, CI and code review.
// If this script cannot parse its input it allows the call (fails open) rather than
// blocking all work; the `permissions.ask` rules installed alongside still apply.

const RULES = [
  [
    /\bgit\s+push\b[^\n]*\s(--force\b|--force-with-lease\b|-f\b)/,
    'force-push rewrites remote history',
  ],
  [/\bgit\s+push\b/, 'pushing is externally visible'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard discards local changes'],
  [/\bgit\s+clean\s+-[a-z]*f/, 'git clean -f deletes untracked files'],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, 'discards all uncommitted changes'],
  [/\bgit\s+commit\b[^\n]*--amend\b/, 'amending rewrites a commit'],
  [/\bgit\s+branch\s+-D\b/, 'force-deletes a branch'],
  [
    /\b(npm|pnpm|yarn|bun)\s+(publish|unpublish|deprecate)\b/,
    'publishing to a registry is public and hard to undo',
  ],
  [
    /\bprisma\s+migrate\s+reset\b|--force-reset\b|--accept-data-loss\b/,
    'resets or drops database data',
  ],
  [/\b(drop\s+(database|table|schema)|truncate\s+table)\b/i, 'destroys database data'],
  [
    /\bdocker\s+(compose\s+down\b[^\n]*\s-v\b|volume\s+(rm|prune)\b|system\s+prune\b)/,
    'deletes Docker volumes or data',
  ],
  [
    /\b(kubectl\s+delete|terraform\s+(apply|destroy)|helm\s+(uninstall|delete))\b/,
    'changes live infrastructure',
  ],
  [/\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, 'runs a downloaded script'],
  [
    /\brm\s+-[a-z]*r[a-z]*\s+(-[a-z]+\s+)*(\/|~|\.\.|\$HOME|[a-z]:[\\/])/i,
    'recursive delete outside the project',
  ],
];

async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

function decide(command) {
  for (const [pattern, reason] of RULES) {
    if (pattern.test(command)) return reason;
  }
  return undefined;
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    return;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string') return;
  const reason = decide(command);
  if (!reason) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `StackJoist guard: ${reason}. AGENTS.md requires human approval for this.`,
      },
    }),
  );
}

await main().catch(() => undefined);
