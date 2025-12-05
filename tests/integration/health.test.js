/**
 * Integration tests for Health endpoint
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = 'http://localhost:3000';

describe('GET /v1/health', () => {
  it('should return 200 OK with status ok', async () => {
    const response = await request(BASE_URL).get('/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should return JSON content type', async () => {
    const response = await request(BASE_URL).get('/v1/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
