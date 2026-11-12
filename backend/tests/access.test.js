const request = require('supertest');
const bcrypt = require('bcryptjs');
const { DEMO_PASSWORD } = require('../src/db/seed');
const { createTestApp, openSeededDb, loginAs } = require('./helpers');

// M2 access control (FR-M2-03, FR-M2-04) through GET /api/children and
// GET /api/children/:childId. Every module route under /api/children/:childId
// goes through the same requireChildAccess middleware.
describe('M2 child access control', () => {
  let db;
  let app;
  let childId;
  let otherChildId;
  const tokens = {};

  beforeAll(async () => {
    db = openSeededDb();
    app = createTestApp(db);
    childId = db.prepare('SELECT id FROM children').get().id;

    // A second family the demo accounts have nothing to do with.
    const otherParentId = db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES ('Diğer Ebeveyn', 'other-parent@demo.test', ?, 'parent')"
    ).run(bcrypt.hashSync(DEMO_PASSWORD, 4)).lastInsertRowid;
    otherChildId = db.prepare(
      "INSERT INTO children (parent_id, name, birth_date) VALUES (?, 'Diğer Çocuk', '2019-01-01')"
    ).run(otherParentId).lastInsertRowid;

    for (const who of ['parent', 'child', 'teacher', 'psychologist', 'doctor', 'other-parent']) {
      tokens[who] = await loginAs(app, `${who}@demo.test`);
    }
  });

  afterAll(() => {
    db.close();
  });

  const get = (path, who) => request(app).get(path).set('Authorization', `Bearer ${tokens[who]}`);

  describe('GET /api/children', () => {
    it('lists the parent\'s own children only', async () => {
      const res = await get('/api/children', 'parent');

      expect(res.status).toBe(200);
      expect(res.body.children).toEqual([
        { id: childId, name: 'Ege Örnek', birthDate: '2018-04-12', relation: 'parent' },
      ]);
    });

    it('lists the children linked to a specialist', async () => {
      const res = await get('/api/children', 'teacher');

      expect(res.body.children.map((c) => [c.id, c.relation])).toEqual([[childId, 'specialist']]);
    });

    it('gives an unlinked specialist an empty list', async () => {
      const res = await get('/api/children', 'doctor');

      expect(res.status).toBe(200);
      expect(res.body.children).toEqual([]);
    });

    it('gives a child only their own profile', async () => {
      const res = await get('/api/children', 'child');

      expect(res.body.children.map((c) => [c.id, c.relation])).toEqual([[childId, 'self']]);
    });

    it('requires login', async () => {
      const res = await request(app).get('/api/children');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/children/:childId', () => {
    it.each([
      ['parent', 'parent'],
      ['teacher', 'specialist'],
      ['child', 'self'],
    ])('lets %s read the child profile as %s', async (who, relation) => {
      const res = await get(`/api/children/${childId}`, who);

      expect(res.status).toBe(200);
      expect(res.body.child).toEqual({ id: childId, name: 'Ege Örnek', birthDate: '2018-04-12', relation });
    });

    it('rejects an unlinked specialist with 403, even when they know the id', async () => {
      const res = await get(`/api/children/${childId}`, 'doctor');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: { code: 'NO_ACCESS', message: expect.any(String) } });
    });

    it('rejects another family\'s parent with 403', async () => {
      const res = await get(`/api/children/${childId}`, 'other-parent');

      expect(res.status).toBe(403);
    });

    it('does not let a parent open someone else\'s child', async () => {
      const res = await get(`/api/children/${otherChildId}`, 'parent');

      expect(res.status).toBe(403);
    });

    it('does not let a child open another child\'s profile', async () => {
      const res = await get(`/api/children/${otherChildId}`, 'child');

      expect(res.status).toBe(403);
    });

    it.each(['999999', 'abc', '0', '-1', '1.5'])('returns 404 for child id %s', async (id) => {
      const res = await get(`/api/children/${id}`, 'parent');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHILD_NOT_FOUND');
    });

    it('requires login before anything else', async () => {
      const res = await request(app).get(`/api/children/${childId}`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for an unknown path under an accessible child', async () => {
      const res = await get(`/api/children/${childId}/does-not-exist`, 'parent');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
