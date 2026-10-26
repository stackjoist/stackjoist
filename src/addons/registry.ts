/** Minimal description used by `list`; the full add-on manifest arrives with the add-on engine (P3). */
export interface AddonSummary {
  id: string;
  title: string;
  description: string;
}

export const addons: readonly AddonSummary[] = [];
