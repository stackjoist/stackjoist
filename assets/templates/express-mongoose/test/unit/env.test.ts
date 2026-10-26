import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const valid = { MONGODB_URI: 'mongodb://127.0.0.1:27017/app' };

describe('loadEnv', () => {
  it('applies safe defaults', () => {
    expect(loadEnv(valid)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      CORS_ORIGINS: [],
      LOG_LEVEL: 'info',
    });
  });

  it('parses comma-separated CORS origins', () => {
    expect(
      loadEnv({ ...valid, CORS_ORIGINS: ' https://a.example, https://b.example ,' }).CORS_ORIGINS,
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it.each([
    [{}, 'MONGODB_URI'],
    [{ MONGODB_URI: 'postgres://x' }, 'MONGODB_URI'],
    [{ ...valid, PORT: 'eighty' }, 'PORT'],
    [{ ...valid, PORT: '70000' }, 'PORT'],
    [{ ...valid, LOG_LEVEL: 'loud' }, 'LOG_LEVEL'],
  ])('rejects invalid configuration %j', (source, field) => {
    expect(() => loadEnv(source)).toThrow(field);
  });
});
