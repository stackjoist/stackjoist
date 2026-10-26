import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ASSETS_ROOT, listFiles } from '../../core/assets.js';
import { readFileInside } from '../../core/fs-safe.js';
import type { Addon, AddonCheck, FileChange } from '../types.js';
import { mergeClaudeMd, mergeSettings } from './settings.js';
import { validateAgent, validatePolicy, validateSkill } from './validate.js';

const AI_ROOT = path.join(ASSETS_ROOT, 'ai');
const READ_ONLY_AGENTS = new Set(['planner', 'code-reviewer', 'security-reviewer', 'ui-reviewer']);

interface WorkflowManifest {
  version: string;
}

async function readAsset(relative: string): Promise<string> {
  return readFile(path.join(AI_ROOT, relative), 'utf8');
}

export async function workflowVersion(): Promise<string> {
  return (JSON.parse(await readAsset('workflow.json')) as WorkflowManifest).version;
}

/** Maps the neutral asset layout to Claude Code's project layout. */
async function claudeCodeFiles(): Promise<Array<{ asset: string; target: string }>> {
  const files = await listFiles(AI_ROOT);
  const mapped: Array<{ asset: string; target: string }> = [
    { asset: 'AGENTS.md', target: 'AGENTS.md' },
  ];
  for (const file of files) {
    if (file.startsWith('skills/') || file.startsWith('agents/') || file.startsWith('hooks/')) {
      mapped.push({ asset: file, target: `.claude/${file}` });
    }
  }
  return mapped;
}

export async function verifyInstalled(root: string): Promise<AddonCheck[]> {
  const checks: AddonCheck[] = [];
  const policy = await readFileInside(root, 'AGENTS.md');
  const policyProblems = policy === undefined ? ['AGENTS.md is missing'] : validatePolicy(policy);
  checks.push({
    name: 'policy (AGENTS.md)',
    status: policyProblems.length === 0 ? 'PASS' : 'FAIL',
    ...(policyProblems.length ? { detail: policyProblems.join('; ') } : {}),
  });

  const claudeMd = await readFileInside(root, 'CLAUDE.md');
  const imports = claudeMd?.split(/\r?\n/).some((l) => l.trim() === '@AGENTS.md') ?? false;
  checks.push({ name: 'CLAUDE.md imports AGENTS.md', status: imports ? 'PASS' : 'FAIL' });

  const assets = await claudeCodeFiles();
  const problems: string[] = [];
  for (const { target } of assets) {
    const text = await readFileInside(root, target);
    if (text === undefined) continue; // reported as sidecar/conflict by the engine
    const skill = /^\.claude\/skills\/([^/]+)\/SKILL\.md$/.exec(target);
    if (skill?.[1]) {
      const dir = `.claude/skills/${skill[1]}/`;
      const siblings = assets
        .filter((a) => a.target.startsWith(dir))
        .map((a) => a.target.slice(dir.length));
      problems.push(...validateSkill(skill[1], text, siblings).map((p) => `${target}: ${p}`));
    }
    const agent = /^\.claude\/agents\/([^/]+)\.md$/.exec(target);
    if (agent?.[1]) {
      const readOnly = READ_ONLY_AGENTS.has(agent[1]);
      problems.push(...validateAgent(text, { readOnly }).map((p) => `${target}: ${p}`));
    }
  }
  checks.push({
    name: 'skills and agents',
    status: problems.length === 0 ? 'PASS' : 'FAIL',
    ...(problems.length ? { detail: problems.join('; ') } : {}),
  });

  const settings = await readFileInside(root, '.claude/settings.json');
  let settingsOk: boolean;
  try {
    const parsed = JSON.parse(settings ?? '{}') as { hooks?: Record<string, unknown> };
    settingsOk = ['PreToolUse', 'SessionStart'].every((e) => Array.isArray(parsed.hooks?.[e]));
  } catch {
    settingsOk = false;
  }
  checks.push({ name: '.claude/settings.json hooks', status: settingsOk ? 'PASS' : 'FAIL' });
  checks.push({
    name: 'skills trigger and behave well in Claude Code',
    status: 'NOT RUN',
    detail: 'qualitative; see the manual checklist in the StackJoist docs',
  });
  return checks;
}

export const aiWorkflows: Addon = {
  id: 'ai-workflows',
  title: 'AI workflow for Claude Code',
  description: 'AGENTS.md policy, 11 skills, 6 subagents and 3 safety hooks for Claude Code',
  version: '0.1.0',
  incompatibility: () => undefined,
  async changes() {
    const changes: FileChange[] = [];
    for (const { asset, target } of await claudeCodeFiles()) {
      changes.push({ kind: 'managed', path: target, content: await readAsset(asset) });
    }
    changes.push(
      {
        kind: 'merge',
        path: 'CLAUDE.md',
        description: 'add "@AGENTS.md" import line',
        edit: mergeClaudeMd,
      },
      {
        kind: 'merge',
        path: '.claude/settings.json',
        description: 'add StackJoist hooks and "ask" permission rules',
        edit: mergeSettings,
      },
    );
    return changes;
  },
  verify: verifyInstalled,
  limitations: [
    'Claude Code only; other agents are planned separately.',
    'Hooks are best-effort safety nets; permission rules, CI and review remain the real controls.',
    'Read-only reviewers cannot use Edit/Write, but Bash could still change files; review their commands.',
    'Removal is not automated: delete the files listed in .stackjoist/state.json and the stackjoist hooks in .claude/settings.json.',
  ],
  nextSteps: [
    'Restart Claude Code in this project so it loads the new skills, agents and hooks.',
    'Review .claude/settings.json and commit AGENTS.md, CLAUDE.md, .claude/ and .stackjoist/state.json.',
    'Try /orchestrate <task> or /release-prep; other skills load automatically when relevant.',
  ],
};
