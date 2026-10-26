import { describe, expect, it } from 'vitest';
import { validateProjectName } from '../../src/core/names.js';

describe('validateProjectName', () => {
  it.each(['my-app', 'app', 'a1', 'my.app', 'my_app', 'x'.repeat(214)])('accepts %j', (name) => {
    expect(validateProjectName(name)).toEqual({ ok: true });
  });

  it.each([
    ['', 'empty'],
    [' my-app', 'leading space'],
    ['my-app ', 'trailing space'],
    ['My-App', 'uppercase'],
    ['.hidden', 'leading dot'],
    ['_private', 'leading underscore'],
    ['../escape', 'traversal'],
    ['..', 'parent dir'],
    ['a/b', 'slash'],
    ['a\\b', 'backslash'],
    ['/abs', 'absolute posix'],
    ['C:\\abs', 'absolute windows'],
    ['@scope/app', 'scoped'],
    ['my app', 'space inside'],
    ['app!', 'special char'],
    ['node_modules', 'npm blocklist'],
    ['fs', 'core module'],
    ['con', 'windows reserved'],
    ['nul.txt', 'windows reserved with extension'],
    ['com1', 'windows reserved COM port'],
    ['app.', 'trailing dot'],
    ['x'.repeat(215), 'too long'],
    ['emoji-😀', 'non url-safe'],
  ])('rejects %j (%s)', (name) => {
    const result = validateProjectName(name);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.length).toBeGreaterThan(0);
  });
});
