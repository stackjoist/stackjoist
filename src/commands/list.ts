import type { AddonSummary } from '../addons/registry.js';
import type { Recipe } from '../recipes/types.js';
import type { CommandContext } from './context.js';

export function runList(
  ctx: CommandContext,
  recipes: readonly Recipe[],
  addons: readonly AddonSummary[],
): void {
  const section = (title: string, items: ReadonlyArray<{ id: string; description: string }>) =>
    items.length === 0
      ? `${title}: none available in this version yet.`
      : [`${title}:`, ...items.map((i) => `  ${i.id.padEnd(24)} ${i.description}`)].join('\n');

  ctx.output.info(`${section('Templates', recipes)}\n\n${section('Add-ons', addons)}`);
  ctx.output.result({
    templates: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      packageManagers: r.packageManagers,
    })),
    addons,
  });
}
