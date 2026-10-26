import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { HttpError, parseInput } from '../../src/lib/http-error.js';

describe('parseInput', () => {
  const schema = z.object({ name: z.string().min(2) });

  it('returns parsed data', () => {
    expect(parseInput(schema, { name: 'ok' })).toEqual({ name: 'ok' });
  });

  it('throws a 400 HttpError with issue paths', () => {
    try {
      parseInput(schema, { name: 'x' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
        details: [{ path: 'name' }],
      });
    }
  });
});
