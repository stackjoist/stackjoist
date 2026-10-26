import { mkdtemp, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach } from 'vitest';
import type { CommandContext } from '../src/commands/context.js';
import type { ProcessRunner, RunOptions, RunResult } from '../src/core/exec.js';
import type { Output } from '../src/core/output.js';
import type { Prompter } from '../src/core/prompter.js';

const created: string[] = [];

/** A fresh temp directory, removed after each test. */
export async function tempDir(): Promise<string> {
  const dir = await realpath(await mkdtemp(path.join(os.tmpdir(), 'stackjoist-test-')));
  created.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(created.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

export interface RecordedCall {
  file: string;
  args: readonly string[];
  options: RunOptions;
}

export function okResult(stdout = ''): RunResult {
  return { exitCode: 0, stdout, stderr: '', failed: false, message: '', cancelled: false };
}

export function failResult(message = 'boom'): RunResult {
  return { exitCode: 1, stdout: '', stderr: message, failed: true, message, cancelled: false };
}

/** Records every call; `respond` decides the result (default: success). */
export function fakeRunner(
  respond: (call: RecordedCall) => RunResult = () => okResult(),
): ProcessRunner & {
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  return {
    calls,
    run(file, args, options) {
      const call = { file, args, options };
      calls.push(call);
      return Promise.resolve(respond(call));
    },
  };
}

export interface CapturedOutput extends Output {
  messages: Array<{ level: string; message: string }>;
  results: unknown[];
}

export function captureOutput(): CapturedOutput {
  const messages: CapturedOutput['messages'] = [];
  const results: unknown[] = [];
  const push = (level: string) => (message: string) => {
    messages.push({ level, message });
  };
  return {
    json: false,
    messages,
    results,
    info: push('info'),
    success: push('success'),
    warn: push('warn'),
    step: push('step'),
    result: (data) => {
      results.push(data);
    },
    error: (e) => {
      messages.push({ level: 'error', message: String(e) });
    },
  };
}

export function makeContext(
  overrides: Partial<CommandContext> & { cwd: string },
): CommandContext & { output: CapturedOutput } {
  return {
    env: {},
    output: captureOutput(),
    runner: fakeRunner(),
    prompter: undefined,
    signal: new AbortController().signal,
    debug: false,
    ...overrides,
  } as CommandContext & { output: CapturedOutput };
}

/** Answers prompts from a queue, in order. */
export function scriptedPrompter(answers: Array<string | boolean>): Prompter {
  const next = () => {
    if (answers.length === 0) throw new Error('No scripted answer left');
    return answers.shift();
  };
  return {
    text: () => Promise.resolve(String(next())),
    select: <T extends string>() => Promise.resolve(next() as T),
    confirm: () => Promise.resolve(Boolean(next())),
  };
}
