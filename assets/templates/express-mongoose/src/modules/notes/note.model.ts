import { model, Schema, type InferSchemaType } from 'mongoose';

const noteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: '', maxlength: 10_000 },
  },
  { timestamps: true },
);

// Supports the default "newest first" listing without a collection scan.
noteSchema.index({ createdAt: -1 });

export type Note = InferSchemaType<typeof noteSchema>;

export const NoteModel = model('Note', noteSchema);
