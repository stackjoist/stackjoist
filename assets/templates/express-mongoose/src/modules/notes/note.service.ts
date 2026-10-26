import type { Types } from 'mongoose';
import { notFound } from '../../lib/http-error.js';
import { NoteModel, type Note } from './note.model.js';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from './note.schemas.js';

/** The public shape of a note. Internal fields such as `__v` never leave the service. */
export interface NoteDto {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(note: Note & { _id: Types.ObjectId }): NoteDto {
  return {
    id: note._id.toString(),
    title: note.title,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function listNotes({ page, limit }: ListNotesQuery) {
  const [items, total] = await Promise.all([
    NoteModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    NoteModel.countDocuments(),
  ]);
  return { items: items.map(toDto), page, limit, total };
}

export async function getNote(id: string): Promise<NoteDto> {
  const note = await NoteModel.findById(id).lean();
  if (!note) throw notFound('Note not found');
  return toDto(note);
}

export async function createNote(input: CreateNoteInput): Promise<NoteDto> {
  const note = await NoteModel.create(input);
  return toDto(note.toObject());
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteDto> {
  const note = await NoteModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!note) throw notFound('Note not found');
  return toDto(note);
}

export async function deleteNote(id: string): Promise<void> {
  const note = await NoteModel.findByIdAndDelete(id).lean();
  if (!note) throw notFound('Note not found');
}
