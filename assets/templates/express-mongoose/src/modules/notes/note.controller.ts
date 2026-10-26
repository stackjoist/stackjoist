import type { Request, Response } from 'express';
import { parseInput } from '../../lib/http-error.js';
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteParamsSchema,
  updateNoteSchema,
} from './note.schemas.js';
import * as notes from './note.service.js';

// Express 5 forwards rejected promises to the error handler, so no try/catch is needed here.

export async function list(req: Request, res: Response) {
  res.json(await notes.listNotes(parseInput(listNotesQuerySchema, req.query)));
}

export async function get(req: Request, res: Response) {
  const { id } = parseInput(noteParamsSchema, req.params);
  res.json(await notes.getNote(id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await notes.createNote(parseInput(createNoteSchema, req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = parseInput(noteParamsSchema, req.params);
  res.json(await notes.updateNote(id, parseInput(updateNoteSchema, req.body)));
}

export async function remove(req: Request, res: Response) {
  const { id } = parseInput(noteParamsSchema, req.params);
  await notes.deleteNote(id);
  res.status(204).end();
}
