import { confirm, isCancel, select, text } from '@clack/prompts';
import { CancelledError } from './errors.js';

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** Interactive questions. Every method throws CancelledError when the user cancels. */
export interface Prompter {
  text(options: {
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | undefined;
  }): Promise<string>;
  select<T extends string>(options: {
    message: string;
    choices: readonly Choice<T>[];
    initial?: T;
  }): Promise<T>;
  confirm(options: { message: string; initial?: boolean }): Promise<boolean>;
}

function unwrap<T>(value: T | symbol): T {
  if (isCancel(value)) throw new CancelledError();
  return value as T;
}

export const clackPrompter: Prompter = {
  async text({ message, placeholder, validate }) {
    return unwrap<string>(
      await text({
        message,
        ...(placeholder === undefined ? {} : { placeholder }),
        ...(validate === undefined ? {} : { validate: (v) => validate(v ?? '') }),
      }),
    );
  },
  async select({ message, choices, initial }) {
    const options = choices.map((c) => ({
      value: c.value,
      label: c.label,
      ...(c.hint === undefined ? {} : { hint: c.hint }),
    }));
    const value = unwrap<string>(
      await select<string>({
        message,
        options,
        ...(initial === undefined ? {} : { initialValue: initial }),
      }),
    );
    // Map back to the typed choice instead of asserting the prompt's return type.
    const picked = choices.find((c) => c.value === value);
    if (!picked) throw new Error(`Prompt returned an unknown choice: ${value}`);
    return picked.value;
  },
  async confirm({ message, initial }) {
    return unwrap<boolean>(
      await confirm({ message, ...(initial === undefined ? {} : { initialValue: initial }) }),
    );
  },
};
