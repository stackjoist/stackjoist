import { aiWorkflows } from './ai-workflows/addon.js';
import { ciGithub } from './ci-github/addon.js';
import type { Addon } from './types.js';

/** Add-ons shipped with this version. */
export const addons: readonly Addon[] = [aiWorkflows, ciGithub];
