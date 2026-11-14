
const request = require('supertest');
const { createTestApp, openSeededDb, loginAs } = require('./helpers');

describe('M3 weekly events API', () => {
  let db;
  let app;
  let childId;
  const tokens = {};

  beforeAll(async () => {
    db = openSeededDb();
    app = createTestApp(db);

    childId = db.prepare('SELECT id FROM children').get().id;

    for (const who of ['parent', 'teacher', 'psychologist', 'child', 'doctor']) {
      tokens[who] = await loginAs(app, `${who}@demo.test`);
    }
  });

  afterAll(() => {
    db.close();
  });

  const get = (path, who) =>
    request(app)
      .get(path)
      .set('Authorization', `Bearer ${tokens[who]}`);

  const post = (path, who, body) =>
    request(app)
      .post(path)
      .set('Authorization', `Bearer ${tokens[who]}`)
      .send(body);

  const validEvent = {
    title: 'Speech therapy',
    startsAt: '2026-11-16T10:00',
    endsAt: '2026-11-16T11:00'
  };

  it('allows a parent to create an event', async () => {
    const res = await post(`/api/children/${childId}/events`, 'parent', validEvent);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(validEvent.title);
    expect(res.body.startsAt).toBe(validEvent.startsAt);
    expect(res.body.endsAt).toBe(validEvent.endsAt);
    expect(res.body.childId).toBe(childId);
  });

  it('allows a linked specialist to create an event', async () => {
    const res = await post(`/api/children/${childId}/events`, 'teacher', {
      title: 'Learning session',
      startsAt: '2026-11-18T14:00',
      endsAt: '2026-11-18T15:00'
    });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learning session');
  });

  it('allows a child to view weekly events', async () => {
    const res = await get(`/api/children/${childId}/events?week=2026-11-16`, 'child');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(event => event.title === 'Speech therapy')).toBe(true);
  });

  it('returns events in chronological order', async () => {
    const res = await get(`/api/children/${childId}/events?week=2026-11-16`, 'parent');

    expect(res.status).toBe(200);

    const starts = res.body.map(event => event.startsAt);
    expect(starts).toEqual([...starts].sort());
  });

  it('rejects event creation by a child', async () => {
    const res = await post(`/api/children/${childId}/events`, 'child', validEvent);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects an unlinked specialist', async () => {
    const res = await get(`/api/children/${childId}/events?week=2026-11-16`, 'doctor');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NO_ACCESS');
  });

  it('rejects a non-Monday week', async () => {
    const res = await get(`/api/children/${childId}/events?week=2026-11-17`, 'parent');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty title', async () => {
    const res = await post(`/api/children/${childId}/events`, 'parent', {
      ...validEvent,
      title: '   '
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid date', async () => {
    const res = await post(`/api/children/${childId}/events`, 'parent', {
      ...validEvent,
      startsAt: '2026-11-31T10:00'
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an end time earlier than the start time', async () => {
    const res = await post(`/api/children/${childId}/events`, 'parent', {
      ...validEvent,
      endsAt: '2026-11-16T09:00'
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/children/${childId}/events?week=2026-11-16`);

    expect(res.status).toBe(401);
  });
});
