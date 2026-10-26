// Structural checks for Claude Code skills and subagents, based on the official docs
// (code.claude.com/docs/en/skills and /sub-agents, checked 2026-10-26). Claude Code
// silently ignores unknown frontmatter fields, so typos must be caught here.

export interface Frontmatter {
  fields: Record<string, string>;
  body: string;
}

const DESCRIPTION_LIMIT = 1536;
const SKILL_BODY_LINE_LIMIT = 500;

const SKILL_FIELDS = new Set([
  'name',
  'description',
  'when_to_use',
  'disable-model-invocation',
  'user-invocable',
  'allowed-tools',
  'argument-hint',
  'arguments',
  'disallowed-tools',
  'model',
  'effort',
  'context',
  'agent',
  'background',
  'hooks',
  'paths',
  'shell',
  'metadata',
  'license',
  'compatibility',
]);

const AGENT_FIELDS = new Set([
  'name',
  'description',
  'tools',
  'disallowedTools',
  'model',
  'permissionMode',
  'maxTurns',
  'autoCompactWindow',
  'skills',
  'mcpServers',
  'hooks',
  'memory',
  'background',
  'omitClaudeMd',
  'effort',
  'isolation',
  'color',
  'initialPrompt',
  'experimental',
]);

/** Fields StackJoist's own assets must never use: they would widen what the agent may do. */
const FORBIDDEN_SKILL_FIELDS = ['allowed-tools'];
const FORBIDDEN_AGENT_FIELDS = ['permissionMode', 'mcpServers', 'hooks'];

const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'];

/** Parses the simple `key: value` frontmatter used by StackJoist assets. */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') throw new Error('frontmatter must start on the first line with ---');
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error('frontmatter is not closed with ---');
  const fields: Record<string, string> = {};
  for (const line of lines.slice(1, end)) {
    if (line.trim() === '') continue;
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!match?.[1]) throw new Error(`unsupported frontmatter line: ${line}`);
    const key = match[1];
    const value = (match[2] ?? '').trim().replace(/^(["'])(.*)\1$/, '$2');
    if (key in fields) throw new Error(`duplicate frontmatter field: ${key}`);
    fields[key] = value;
  }
  return { fields, body: lines.slice(end + 1).join('\n') };
}

function unknownFields(fields: Record<string, string>, allowed: Set<string>): string[] {
  return Object.keys(fields)
    .filter((key) => !allowed.has(key))
    .map((key) => `unknown frontmatter field "${key}" (Claude Code would ignore it)`);
}

/** Relative Markdown links such as `[x](references/y.md)` that must exist next to the file. */
export function relativeLinks(body: string): string[] {
  return [...body.matchAll(/\]\(([^)\s#]+\.md)\)/g)]
    .map((m) => m[1] ?? '')
    .filter((link) => !/^[a-z]+:/i.test(link) && !link.startsWith('/'));
}

export function validateSkill(dirName: string, text: string, files: readonly string[]): string[] {
  let fm: Frontmatter;
  try {
    fm = parseFrontmatter(text);
  } catch (error) {
    return [(error as Error).message];
  }
  const { fields, body } = fm;
  const problems = unknownFields(fields, SKILL_FIELDS);
  if (fields['name'] !== dirName) problems.push(`name must equal the folder name "${dirName}"`);
  if (!SKILL_NAME.test(dirName)) problems.push('name must be lowercase words joined by "-"');
  const description = `${fields['description'] ?? ''}${fields['when_to_use'] ?? ''}`;
  if (!fields['description']) problems.push('description is required');
  if (description.length > DESCRIPTION_LIMIT) {
    problems.push(
      `description + when_to_use is ${description.length} chars (limit ${DESCRIPTION_LIMIT})`,
    );
  }
  for (const field of FORBIDDEN_SKILL_FIELDS) {
    if (field in fields) problems.push(`"${field}" is not allowed: it pre-approves tools`);
  }
  if (body.split('\n').length > SKILL_BODY_LINE_LIMIT) {
    problems.push(`SKILL.md body exceeds ${SKILL_BODY_LINE_LIMIT} lines`);
  }
  for (const link of relativeLinks(body)) {
    if (!files.includes(link)) problems.push(`broken reference: ${link}`);
  }
  return problems;
}

export function validateAgent(text: string, options: { readOnly: boolean }): string[] {
  let fm: Frontmatter;
  try {
    fm = parseFrontmatter(text);
  } catch (error) {
    return [(error as Error).message];
  }
  const { fields } = fm;
  const problems = unknownFields(fields, AGENT_FIELDS);
  const name = fields['name'];
  if (!name) problems.push('name is required');
  else if (name.includes(':') || name.startsWith('-') || name.length > 256) {
    problems.push('name must not contain ":", start with "-" or exceed 256 characters');
  }
  if (!fields['description']) problems.push('description is required');
  for (const field of FORBIDDEN_AGENT_FIELDS) {
    if (field in fields) problems.push(`"${field}" is not allowed in StackJoist agents`);
  }
  const tools = (fields['tools'] ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tools.length === 0) problems.push('tools must be listed explicitly');
  if (tools.includes('Agent')) problems.push('agents must not spawn further agents');
  if (options.readOnly) {
    for (const tool of tools.filter((t) => WRITE_TOOLS.includes(t))) {
      problems.push(`read-only agent must not have the ${tool} tool`);
    }
  }
  return problems;
}

/** The parts of AGENTS.md that the workflow relies on. If any is missing, the policy was altered. */
export const REQUIRED_POLICY_MARKERS = [
  'Human approval remains required',
  'Never say a check passed unless it was actually run',
  '`PASS`/`FAIL`/`NOT RUN`/`BLOCKED`',
  '## 12. Git and Change Management',
  '## 10. Verification and Definition of Done',
];

export function validatePolicy(text: string): string[] {
  return REQUIRED_POLICY_MARKERS.filter((marker) => !text.includes(marker)).map(
    (marker) => `AGENTS.md is missing required text: ${marker}`,
  );
}
