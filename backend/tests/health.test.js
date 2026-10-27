const request = require('supertest');
const { createApp } = require('../src/app');
const { openDb } = require('../src/db');

describe('GET /api/health', () => {
  it('returns status ok when the database responds', async () => {
    const db = openDb(':memory:');

    const res = await request(createApp({ db })).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
    db.close();
  });
});
