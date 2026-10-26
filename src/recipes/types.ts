import type { Plan } from '../core/plan.js';
import type { PackageManagerId } from '../core/pm.js';

export interface RecipeContext {
  projectName: string;
  packageManager: PackageManagerId;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  packageManagers: readonly PackageManagerId[];
  /** Pure: describes every file and command needed to generate the project. */
  plan(ctx: RecipeContext): Plan;
  /** Commands shown to the user after a successful create. */
  nextSteps(ctx: RecipeContext): string[];
}
