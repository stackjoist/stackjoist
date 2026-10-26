import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aiWorkflows, workflowVersion } from '../../src/addons/ai-workflows/addon.js';
import { ASK_RULES, mergeClaudeMd, mergeSettings } from '../../src/addons/ai-workflows/settings.js';
import {
  parseFrontmatter,
  validateAgent,
  validatePolicy,
  validateSkill,
} from '../../src/addons/ai-workflows/validate.js';
import { ASSETS_ROOT, listFiles } from '../../src/core/assets.js';

const AI = path.join(ASSETS_ROOT, 'ai');
const READ_ONLY = ['planner', 'code-reviewer', 'security-reviewer', 'ui-reviewer'];

describe('shipped AI assets', () => {
  it('ship the owner AGENTS.md byte for byte (ADR-003)', async () => {
    const shipped = await readFile(path.join(AI, 'AGENTS.md'));
    const source = await readFile(new URL('../../AGENTS.md', import.meta.url));
    expect(shipped.equals(source)).toBe(true);
    expect(validatePolicy(shipped.toString('utf8'))).toEqual([]);
  });

  it('keep the add-on version in sync with workflow.json', async () => {
    expect(aiWorkflows.version).toBe(await workflowVersion());
  });

  it('have 11 valid skills with intact references', async () => {
    const files = await listFiles(path.join(AI, 'skills'));
    const skills = files.filter((f) => f.endsWith('/SKILL.md')).map((f) => f.split('/')[0] ?? '');
    expect(skills).toHaveLength(11);
    for (const skill of skills) {
      const text = await readFile(path.join(AI, 'skills', skill, 'SKILL.md'), 'utf8');
      const siblings = files
        .filter((f) => f.startsWith(`${skill}/`))
        .map((f) => f.slice(skill.length + 1));
      expect(validateSkill(skill, text, siblings), skill).toEqual([]);
    }
  });

  it('only let users start side-effect workflows', async () => {
    for (const skill of ['release-prep', 'orchestrate']) {
      const text = await readFile(path.join(AI, 'skills', skill, 'SKILL.md'), 'utf8');
      expect(parseFrontmatter(text).fields['disable-model-invocation']).toBe('true');
    }
  });

  it('have 6 valid agents, reviewers without edit tools', async () => {
    const agents = (await listFiles(path.join(AI, 'agents'))).map((f) => f.replace(/\.md$/, ''));
    expect(agents.sort()).toEqual([
      'code-reviewer',
      'implementer',
      'planner',
      'security-reviewer',
      'test-engineer',
      'ui-reviewer',
    ]);
    for (const agent of agents) {
      const text = await readFile(path.join(AI, 'agents', `${agent}.md`), 'utf8');
      expect(validateAgent(text, { readOnly: READ_ONLY.includes(agent) }), agent).toEqual([]);
      expect(parseFrontmatter(text).fields['name']).toBe(agent);
    }
  });
});

describe('validators catch mistakes', () => {
  it('rejects bad skills', () => {
    expect(validateSkill('x', 'no frontmatter', [])).toEqual([
      'frontmatter must start on the first line with ---',
    ]);
    const problems = validateSkill(
      'my-skill',
      `---\nname: other\ndescripton: typo\nallowed-tools: Bash\n---\nSee [ref](references/missing.md)\n`,
      [],
    );
    expect(problems.join('\n')).toMatch(/unknown frontmatter field "descripton"/);
    expect(problems.join('\n')).toMatch(/name must equal/);
    expect(problems.join('\n')).toMatch(/description is required/);
    expect(problems.join('\n')).toMatch(/allowed-tools/);
    expect(problems.join('\n')).toMatch(/broken reference: references\/missing\.md/);
    expect(
      validateSkill('long', `---\nname: long\ndescription: ${'x'.repeat(1537)}\n---\n`, []),
    ).toEqual([expect.stringMatching(/1537 chars/)]);
  });

  it('rejects bad agents', () => {
    const problems = validateAgent(
      '---\nname: bad:name\npermissionMode: bypassPermissions\ntools: Read, Edit, Agent\n---\n',
      { readOnly: true },
    );
    const text = problems.join('\n');
    expect(text).toMatch(/name must not contain/);
    expect(text).toMatch(/description is required/);
    expect(text).toMatch(/permissionMode/);
    expect(text).toMatch(/must not spawn/);
    expect(text).toMatch(/read-only agent must not have the Edit tool/);
  });

  it('detects an altered policy', () => {
    expect(validatePolicy('# My own rules').length).toBeGreaterThan(0);
  });
});

describe('mergeSettings', () => {
  const parse = (s: string) =>
    JSON.parse(s) as {
      permissions: { allow?: string[]; ask: string[]; defaultMode?: string };
      hooks: Record<string, Array<{ matcher: string; hooks: Array<{ args: string[] }> }>>;
      model?: string;
    };

  it('creates settings with hooks in exec form and ask rules only', () => {
    const s = parse(mergeSettings(undefined));
    expect(s.permissions.ask).toEqual(ASK_RULES);
    expect(s.permissions.allow).toBeUndefined();
    expect(s.permissions.defaultMode).toBeUndefined();
    const bash = s.hooks['PreToolUse']?.[0];
    expect(bash?.matcher).toBe('Bash');
    expect(bash?.hooks[0]?.args[0]).toBe(
      '${CLAUDE_PROJECT_DIR}/.claude/hooks/stackjoist-bash-guard.mjs',
    );
  });

  it('preserves user settings and never widens permissions', () => {
    const user = JSON.stringify({
      model: 'opus',
      permissions: { allow: ['Bash(ls *)'], ask: ['Bash(rm *)'], defaultMode: 'plan' },
      hooks: { PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'mine' }] }] },
    });
    const s = parse(mergeSettings(user));
    expect(s.model).toBe('opus');
    expect(s.permissions.allow).toEqual(['Bash(ls *)']);
    expect(s.permissions.defaultMode).toBe('plan');
    expect(s.permissions.ask[0]).toBe('Bash(rm *)');
    expect(s.hooks['PreToolUse']?.[0]?.matcher).toBe('Write');
    expect(s.hooks['PreToolUse']).toHaveLength(3);
  });

  it('is idempotent and replaces its own old hooks instead of duplicating', () => {
    const once = mergeSettings('{}');
    expect(mergeSettings(once)).toBe(once);
    const old = JSON.parse(once) as { hooks: { PreToolUse: Array<{ matcher: string }> } };
    if (old.hooks.PreToolUse[0]) old.hooks.PreToolUse[0].matcher = 'OldMatcher';
    expect(mergeSettings(JSON.stringify(old))).toBe(once);
  });

  it.each(['{not json', '[]', '{"hooks": []}', '{"permissions": {"ask": "x"}}'])(
    'refuses to merge %s',
    (bad) => {
      expect(() => mergeSettings(bad)).toThrow();
    },
  );
});

describe('mergeClaudeMd', () => {
  it.each([
    [undefined, '@AGENTS.md\n'],
    ['', '@AGENTS.md\n'],
    ['@AGENTS.md', '@AGENTS.md'],
    ['# Notes\n\nKeep this.\n', '# Notes\n\nKeep this.\n\n@AGENTS.md\n'],
  ])('%j -> %j', (input, expected) => {
    expect(mergeClaudeMd(input)).toBe(expected);
    expect(mergeClaudeMd(expected)).toBe(expected);
  });
});
