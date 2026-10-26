// Merges StackJoist's hooks and "ask" permission rules into .claude/settings.json.
// User keys are preserved. Allow rules, permission modes and other settings are never
// added or changed: the workflow must not give the agent more power than it had.

const HOOK_MARKER = '/.claude/hooks/stackjoist-';

export const ASK_RULES = [
  'Bash(git push *)',
  'Bash(git reset --hard *)',
  'Bash(git clean *)',
  'Bash(npm publish *)',
  'Bash(pnpm publish *)',
  'Bash(yarn publish *)',
  'Bash(npx prisma migrate reset *)',
  'Bash(prisma migrate reset *)',
  'Read(**/.env)',
  'Read(**/.env.local)',
  'Read(**/.env.production)',
  'Edit(**/.env)',
  'Edit(**/.env.local)',
  'Edit(**/.env.production)',
];

interface HookHandler {
  type: 'command';
  command: string;
  args: string[];
  timeout: number;
}

interface HookGroup {
  matcher: string;
  hooks: HookHandler[];
}

function hook(script: string): HookHandler {
  // Exec form: no shell, works the same on Windows, macOS and Linux.
  return {
    type: 'command',
    command: 'node',
    args: [`\${CLAUDE_PROJECT_DIR}/.claude/hooks/${script}`],
    timeout: 10,
  };
}

export const HOOKS: Record<string, HookGroup[]> = {
  PreToolUse: [
    { matcher: 'Bash', hooks: [hook('stackjoist-bash-guard.mjs')] },
    { matcher: 'Edit|Write|MultiEdit|NotebookEdit', hooks: [hook('stackjoist-file-guard.mjs')] },
  ],
  SessionStart: [
    { matcher: 'startup|resume|clear|compact', hooks: [hook('stackjoist-session-start.mjs')] },
  ],
};

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOurs(handler: unknown): boolean {
  if (!isObject(handler)) return false;
  const args: unknown[] = Array.isArray(handler['args']) ? handler['args'] : [];
  const parts = [handler['command'], ...args];
  return parts.some((p) => typeof p === 'string' && p.replace(/\\/g, '/').includes(HOOK_MARKER));
}

/** Removes previous StackJoist handlers so an update replaces them instead of duplicating. */
function withoutOurs(groups: unknown[]): unknown[] {
  return groups
    .map((group) => {
      if (!isObject(group) || !Array.isArray(group['hooks'])) return group;
      return { ...group, hooks: group['hooks'].filter((h) => !isOurs(h)) };
    })
    .filter(
      (group) => !isObject(group) || !Array.isArray(group['hooks']) || group['hooks'].length > 0,
    );
}

export function mergeSettings(current: string | undefined): string {
  let settings: Json = {};
  if (current !== undefined && current.trim() !== '') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(current);
    } catch {
      throw new Error(
        '.claude/settings.json is not valid JSON; fix it or merge the hooks manually',
      );
    }
    if (!isObject(parsed)) throw new Error('.claude/settings.json must contain a JSON object');
    settings = parsed;
  }

  const hooks = settings['hooks'] ?? {};
  if (!isObject(hooks)) throw new Error('"hooks" in .claude/settings.json is not an object');
  const mergedHooks: Json = { ...hooks };
  for (const [event, groups] of Object.entries(HOOKS)) {
    const existing = hooks[event] ?? [];
    if (!Array.isArray(existing)) throw new Error(`"hooks.${event}" is not an array`);
    mergedHooks[event] = [...withoutOurs(existing), ...groups];
  }

  const permissions = settings['permissions'] ?? {};
  if (!isObject(permissions))
    throw new Error('"permissions" in .claude/settings.json is not an object');
  const askValue = permissions['ask'] ?? [];
  if (!Array.isArray(askValue)) throw new Error('"permissions.ask" is not an array');
  const ask: unknown[] = askValue;
  const mergedAsk = [...ask, ...ASK_RULES.filter((rule) => !ask.includes(rule))];

  const merged: Json = {
    ...settings,
    permissions: { ...permissions, ask: mergedAsk },
    hooks: mergedHooks,
  };
  return `${JSON.stringify(merged, null, 2)}\n`;
}

/** CLAUDE.md must import AGENTS.md; anything the user already wrote stays as is. */
export function mergeClaudeMd(current: string | undefined): string {
  if (current === undefined || current.trim() === '') return '@AGENTS.md\n';
  if (current.split(/\r?\n/).some((line) => line.trim() === '@AGENTS.md')) return current;
  return `${current.replace(/\s*$/, '')}\n\n@AGENTS.md\n`;
}
