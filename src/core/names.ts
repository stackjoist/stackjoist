import { builtinModules } from 'node:module';

// npm naming rules as documented for `package.json#name`, plus filesystem rules
// so the name is also a safe directory name on Windows, macOS and Linux (ADR-010).

const MAX_LENGTH = 214;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const NPM_BLOCKLIST = new Set(['node_modules', 'favicon.ico']);

export type NameCheck = { ok: true } | { ok: false; problems: string[] };

export function validateProjectName(name: string): NameCheck {
  const problems: string[] = [];

  if (name.length === 0) {
    return { ok: false, problems: ['Name must not be empty.'] };
  }
  if (name.trim() !== name) problems.push('Name must not start or end with spaces.');
  if (name.length > MAX_LENGTH) problems.push(`Name must be at most ${MAX_LENGTH} characters.`);
  if (name.startsWith('.') || name.startsWith('_')) {
    problems.push('Name must not start with "." or "_".');
  }
  if (name.startsWith('@')) {
    problems.push('Scoped names (@scope/name) are not supported as project names.');
  }
  if (name.toLowerCase() !== name) problems.push('Name must be lowercase.');
  if (/[~'!()*]/.test(name)) problems.push("Name must not contain any of ~'!()*");
  if (encodeURIComponent(name) !== name) {
    problems.push('Name may only contain URL-safe characters (letters, digits, "-", "_", ".").');
  }
  if (NPM_BLOCKLIST.has(name)) problems.push(`"${name}" is not allowed by npm.`);
  if (builtinModules.includes(name)) problems.push(`"${name}" is a Node.js core module name.`);
  if (WINDOWS_RESERVED.test(name)) problems.push(`"${name}" is a reserved file name on Windows.`);
  if (name.endsWith('.')) problems.push('Name must not end with ".".');

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
