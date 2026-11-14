const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { DEMO_PASSWORD } = require('../src/db/seed');
const { TEST_JWT_SECRET, createTestApp, openSeededDb, loginAs } = require('./helpers');

describe('M1 authentication', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openSeededDb();
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  const userId = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;

  describe('POST /api/auth/login', () => {
    it.each([
      ['parent@demo.test', 'parent'],
      ['teacher@demo.test', 'specialist'],
      ['child@demo.test', 'child'],
    ])('logs in %s and returns a token for role %s', async (email, role) => {
      const res = await request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email, role });
      expect(res.body.expiresIn).toBe('8h');

      const payload = jwt.verify(res.body.token, TEST_JWT_SECRET, { algorithms: ['HS256'] });
      expect(payload.sub).toBe(String(userId(email)));
      expect(payload.role).toBe(role);
      expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
    });

    it('takes the role from the account, not from the request', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'child@demo.test', password: DEMO_PASSWORD, role: 'parent' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('child');
    });

    it('accepts the email with different case and surrounding spaces', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '  Parent@Demo.TEST ', password: DEMO_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('parent@demo.test');
    });

    it('returns the child profile id for a child account', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'child@demo.test', password: DEMO_PASSWORD });

      const childId = db.prepare('SELECT id FROM children WHERE user_id = ?').get(userId('child@demo.test')).id;
      expect(res.body.user.childId).toBe(childId);
    });

    it('returns the specialist type for a specialist account', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'teacher@demo.test', password: DEMO_PASSWORD });

      expect(res.body.user.specialistType).toBe('teacher');
    });

    it('never returns the password hash', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'parent@demo.test', password: DEMO_PASSWORD });

      expect(res.text).not.toMatch(/password|\$2[aby]\$/);
    });

    it('rejects a wrong password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'parent@demo.test', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: { code: 'INVALID_CREDENTIALS', message: expect.any(String) } });
      expect(res.body.token).toBeUndefined();
    });

    it('gives an unknown email the same answer as a wrong password', async () => {
      const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'parent@demo.test', password: 'wrong' });
      const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@demo.test', password: 'wrong' });

      expect(unknownEmail.status).toBe(401);
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it.each([
      ['no body', undefined],
      ['missing password', { email: 'parent@demo.test' }],
      ['missing email', { password: DEMO_PASSWORD }],
      ['blank email', { email: '   ', password: DEMO_PASSWORD }],
      ['non-string fields', { email: ['parent@demo.test'], password: 12345678 }],
    ])('rejects %s with 400', async (_name, body) => {
      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed JSON with 400 in the standard error shape', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the logged-in user', async () => {
      const token = await loginAs(app, 'psychologist@demo.test');

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: userId('psychologist@demo.test'),
        name: 'Murat Psikolog',
        email: 'psychologist@demo.test',
        role: 'specialist',
        specialistType: 'psychologist',
      });
    });

    it('rejects a request without a token with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it.each([
      ['a non-Bearer scheme', (t) => `Basic ${t}`],
      ['an empty Bearer value', () => 'Bearer '],
    ])('rejects %s with 401', async (_name, makeHeader) => {
      const token = await loginAs(app, 'parent@demo.test');

      const res = await request(app).get('/api/auth/me').set('Authorization', makeHeader(token));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects a malformed token with 401', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects a token signed with another secret', async () => {
      const forged = jwt.sign({ role: 'parent' }, 'some-other-secret', { subject: String(userId('parent@demo.test')) });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects an unsigned ("alg: none") token', async () => {
      const unsigned = jwt.sign({ role: 'parent' }, null, {
        algorithm: 'none',
        subject: String(userId('parent@demo.test')),
      });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${unsigned}`);

      expect(res.status).toBe(401);
    });

    it('rejects an expired token with TOKEN_EXPIRED', async () => {
      const expired = jwt.sign(
        { role: 'parent', exp: Math.floor(Date.now() / 1000) - 60 },
        TEST_JWT_SECRET,
        { subject: String(userId('parent@demo.test')) }
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects the token of an account that was deleted', async () => {
      const token = await loginAs(app, 'doctor@demo.test');
      db.prepare('DELETE FROM users WHERE email = ?').run('doctor@demo.test');

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('uses the role stored in the database, not the role inside the token', async () => {
      const childToken = jwt.sign({ role: 'parent' }, TEST_JWT_SECRET, { subject: String(userId('child@demo.test')) });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${childToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('child');
    });
  });

  it('answers unknown API paths with a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('refuses to start without a JWT secret', () => {
    expect(() => createApp({ db })).toThrow(/jwtSecret/);
  });
});
