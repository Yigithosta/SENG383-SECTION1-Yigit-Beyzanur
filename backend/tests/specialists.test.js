const request = require('supertest');
const { createTestApp, openSeededDb, loginAs } = require('./helpers');

// M2 linking API (FR-M2-01, 02, 05, 06) and SRS critical flow 1.
describe('M2 /api/children/:childId/specialists', () => {
  let db;
  let app;
  let childId;
  let base;
  const tokens = {};

  beforeEach(async () => {
    db = openSeededDb();
    app = createTestApp(db);
    childId = db.prepare('SELECT id FROM children').get().id;
    base = `/api/children/${childId}/specialists`;
    for (const who of ['parent', 'child', 'teacher', 'doctor']) {
      tokens[who] = await loginAs(app, `${who}@demo.test`);
    }
  });

  afterEach(() => {
    db.close();
  });

  const as = (who) => ({
    get: (path) => request(app).get(path).set('Authorization', `Bearer ${tokens[who]}`),
    post: (path, body) => request(app).post(path).set('Authorization', `Bearer ${tokens[who]}`).send(body),
    del: (path) => request(app).delete(path).set('Authorization', `Bearer ${tokens[who]}`),
  });
  const userId = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;

  describe('GET', () => {
    it('lists the linked specialists for the parent', async () => {
      const res = await as('parent').get(base);

      expect(res.status).toBe(200);
      expect(res.body.specialists.map((s) => s.email)).toEqual(['psychologist@demo.test', 'teacher@demo.test']);
      expect(res.body.specialists[0]).toEqual({
        id: userId('psychologist@demo.test'),
        name: 'Murat Psikolog',
        email: 'psychologist@demo.test',
        specialistType: 'psychologist',
        linkedAt: expect.any(String),
      });
    });

    it('lets a linked specialist read the list', async () => {
      const res = await as('teacher').get(base);

      expect(res.status).toBe(200);
    });

    it('does not let the child read the list', async () => {
      const res = await as('child').get(base);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('does not let an unlinked specialist read the list', async () => {
      const res = await as('doctor').get(base);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NO_ACCESS');
    });
  });

  describe('POST', () => {
    it('links a registered specialist by email', async () => {
      const res = await as('parent').post(base, { email: 'doctor@demo.test' });

      expect(res.status).toBe(201);
      expect(res.body.specialist).toMatchObject({
        id: userId('doctor@demo.test'),
        email: 'doctor@demo.test',
        specialistType: 'doctor',
      });
      const list = await as('parent').get(base);
      expect(list.body.specialists.map((s) => s.email)).toContain('doctor@demo.test');
    });

    it('accepts the email with different case and spaces', async () => {
      const res = await as('parent').post(base, { email: '  Doctor@Demo.Test ' });

      expect(res.status).toBe(201);
    });

    it('returns 404 SPECIALIST_NOT_FOUND for an unregistered email and creates no link', async () => {
      const res = await as('parent').post(base, { email: 'nobody@demo.test' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SPECIALIST_NOT_FOUND');
      expect(db.prepare('SELECT COUNT(*) AS n FROM child_specialists').get().n).toBe(2);
    });

    it('does not link an account that is not a specialist', async () => {
      const res = await as('parent').post(base, { email: 'child@demo.test' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SPECIALIST_NOT_FOUND');
    });

    it('returns 409 when the specialist is already linked', async () => {
      const res = await as('parent').post(base, { email: 'teacher@demo.test' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_LINKED');
    });

    it.each([
      ['no email', {}],
      ['blank email', { email: '  ' }],
      ['non-string email', { email: 42 }],
    ])('rejects %s with 400', async (_name, body) => {
      const res = await as('parent').post(base, body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it.each(['teacher', 'child'])('does not let the %s create links', async (who) => {
      const res = await as(who).post(base, { email: 'doctor@demo.test' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('does not let an unlinked specialist link themselves', async () => {
      const res = await as('doctor').post(base, { email: 'doctor@demo.test' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NO_ACCESS');
    });
  });

  describe('DELETE', () => {
    it('unlinks a specialist', async () => {
      const res = await as('parent').del(`${base}/${userId('teacher@demo.test')}`);

      expect(res.status).toBe(204);
      const list = await as('parent').get(base);
      expect(list.body.specialists.map((s) => s.email)).toEqual(['psychologist@demo.test']);
    });

    it('returns 404 when the specialist is not linked', async () => {
      const res = await as('parent').del(`${base}/${userId('doctor@demo.test')}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('LINK_NOT_FOUND');
    });

    it('returns 404 for an invalid specialist id', async () => {
      const res = await as('parent').del(`${base}/abc`);

      expect(res.status).toBe(404);
    });

    it.each(['teacher', 'child'])('does not let the %s remove links', async (who) => {
      const res = await as(who).del(`${base}/${userId('teacher@demo.test')}`);

      expect(res.status).toBe(403);
    });
  });

  // SRS critical flow 1: link, use, unlink, lose access at once.
  it('gives access right after linking and removes it right after unlinking', async () => {
    const profile = `/api/children/${childId}`;

    expect((await as('doctor').get(profile)).status).toBe(403);

    await as('parent').post(base, { email: 'doctor@demo.test' });
    expect((await as('doctor').get(profile)).status).toBe(200);
    expect((await as('doctor').get('/api/children')).body.children).toHaveLength(1);

    await as('parent').del(`${base}/${userId('doctor@demo.test')}`);
    // The same token as before: access ends without logging out.
    expect((await as('doctor').get(profile)).status).toBe(403);
    expect((await as('doctor').get(base)).status).toBe(403);
    expect((await as('doctor').get('/api/children')).body.children).toEqual([]);
  });
});
