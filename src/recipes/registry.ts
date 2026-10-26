import { expressMongoose } from './express-mongoose/recipe.js';
import type { Recipe } from './types.js';

/** Recipes shipped with this version. Recipes are added here only once verified (see docs/TASKS.md). */
export const recipes: readonly Recipe[] = [expressMongoose];
