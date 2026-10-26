import { z } from 'zod';

// Strict objects reject unknown fields, so clients cannot set fields they do not own.
export const createNoteSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(10_000).optional(),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const noteParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid note id'),
});

export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateNoteInput = z.output<typeof createNoteSchema>;
export type UpdateNoteInput = z.output<typeof updateNoteSchema>;
export type ListNotesQuery = z.output<typeof listNotesQuerySchema>;
