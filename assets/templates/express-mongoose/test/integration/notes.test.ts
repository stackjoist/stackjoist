import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { isDatabaseReady } from '../../src/db/mongoose.js';
import { createLogger } from '../../src/lib/logger.js';
import { useMemoryMongo } from '../helpers/memory-mongo.js';

useMemoryMongo();

const app = createApp({
  logger: createLogger('silent'),
  corsOrigins: ['https://allowed.example'],
  isDatabaseReady,
});

async function createNote(body: object = { title: 'First', body: 'Hello' }) {
  const res = await request(app).post('/api/notes').send(body).expect(201);
  return res.body as { id: string; title: string; body: string };
}

describe('notes API', () => {
  it('creates, reads, updates and deletes a note', async () => {
    const created = await createNote();
    expect(created).toMatchObject({ title: 'First', body: 'Hello' });
    expect(created).not.toHaveProperty('_id');
    expect(created).not.toHaveProperty('__v');

    await request(app)
      .get(`/api/notes/${created.id}`)
      .expect(200, { ...created });

    const updated = await request(app)
      .patch(`/api/notes/${created.id}`)
      .send({ title: 'Renamed' })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, title: 'Renamed', body: 'Hello' });

    await request(app).delete(`/api/notes/${created.id}`).expect(204);
    await request(app).get(`/api/notes/${created.id}`).expect(404);
  });

  it('lists newest first with pagination', async () => {
    for (const title of ['a', 'b', 'c']) await createNote({ title });
    const res = await request(app).get('/api/notes?limit=2&page=1').expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 2, total: 3 });
    expect((res.body as { items: { title: string }[] }).items.map((n) => n.title)).toEqual([
      'c',
      'b',
    ]);
  });

  it.each([
    [{}, 'missing title'],
    [{ title: '' }, 'empty title'],
    [{ title: 'x'.repeat(201) }, 'title too long'],
    [{ title: 'ok', isAdmin: true }, 'unknown field'],
    [{ title: 42 }, 'wrong type'],
  ])('rejects invalid create input (%s)', async (body, _label) => {
    const res = await request(app).post('/api/notes').send(body).expect(400);
    expect(res.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects an empty update', async () => {
    const { id } = await createNote();
    await request(app).patch(`/api/notes/${id}`).send({}).expect(400);
  });

  it('rejects malformed ids and returns 404 for unknown ones', async () => {
    await request(app).get('/api/notes/not-an-id').expect(400);
    const res = await request(app).get('/api/notes/0123456789abcdef01234567').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Note not found' } });
  });

  it.each(['limit=0', 'limit=101', 'page=0', 'limit=abc'])('rejects query %s', async (query) => {
    await request(app).get(`/api/notes?${query}`).expect(400);
  });

  it('rejects malformed JSON and oversized bodies', async () => {
    const bad = await request(app)
      .post('/api/notes')
      .set('content-type', 'application/json')
      .send('{"title":')
      .expect(400);
    expect(bad.body).toMatchObject({ error: { code: 'BAD_REQUEST' } });

    const big = await request(app)
      .post('/api/notes')
      .send({ title: 'big', body: 'x'.repeat(200_000) })
      .expect(413);
    expect(big.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });
});

describe('app', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(res.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });

  it('reports liveness and readiness', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
    await request(app).get('/health/ready').expect(200, { status: 'ready' });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows only configured CORS origins', async () => {
    const allowed = await request(app).get('/health').set('origin', 'https://allowed.example');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example');
    const denied = await request(app).get('/health').set('origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
