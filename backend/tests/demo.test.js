const request = require('supertest');
const { createTestApp } = require('./helpers');
const { openDb } = require('../src/db');
const { seed } = require('../src/db/seed');

describe('GET /api/demo/summary', () => {
  let db;

  beforeEach(() => {
    db = openDb(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('returns role counts and linked and unlinked specialists', async () => {
    seed(db);

    const res = await request(createTestApp(db)).get('/api/demo/summary');

    expect(res.status).toBe(200);
    expect(res.body.users).toEqual({ parent: 1, child: 1, specialist: 3 });
    expect(res.body.children).toHaveLength(1);

    const [child] = res.body.children;
    expect(child.name).toBe('Ege Örnek');
    expect(child.parentName).toBe('Deniz Örnek');
    expect(child.linkedSpecialists.map((s) => s.type).sort()).toEqual(['psychologist', 'teacher']);
    expect(child.unlinkedSpecialists.map((s) => s.type)).toEqual(['doctor']);
  });

  it('never exposes emails or password hashes', async () => {
    seed(db);

    const res = await request(createTestApp(db)).get('/api/demo/summary');

    expect(res.text).not.toMatch(/@demo\.test/);
    expect(res.text).not.toMatch(/password|\$2[aby]\$/);
  });

  it('returns empty results before the database is seeded', async () => {
    const res = await request(createTestApp(db)).get('/api/demo/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: { parent: 0, child: 0, specialist: 0 }, children: [] });
  });
});
