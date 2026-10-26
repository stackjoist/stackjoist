import type { Plan } from '../core/plan.js';
import type { PackageManagerId } from '../core/pm.js';

export interface RecipeContext {
  projectName: string;
  packageManager: PackageManagerId;
}

/** A package.json script that must pass for the generated project to count as verified. */
export interface VerifyStep {
  name: string;
  script: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  packageManagers: readonly PackageManagerId[];
  /** Describes every file and command needed to generate the project. Reads, never writes. */
  plan(ctx: RecipeContext): Promise<Plan>;
  /** Commands shown to the user after a successful create. */
  nextSteps(ctx: RecipeContext): string[];
  verify: readonly VerifyStep[];
}
