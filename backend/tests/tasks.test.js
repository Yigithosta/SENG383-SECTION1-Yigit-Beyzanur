const request = require('supertest');
const { createTestApp, openSeededDb, loginAs } = require('./helpers');

describe('SCRUM-35 Tasks API (M4)', () => {
  let db;
  let app;
  let base;
  const tokens = {};

  const taskData = {
    title: 'Reading practice',
    description: 'Read a short story aloud.',
    area: 'language',
    dueDate: '2026-11-18',
  };

  beforeEach(async () => {
    db = openSeededDb();
    app = createTestApp(db);

    const childId = db.prepare('SELECT id FROM children').get().id;
    base = `/api/children/${childId}/tasks`;

    for (const who of ['parent', 'child', 'teacher', 'doctor']) {
      tokens[who] = await loginAs(app, `${who}@demo.test`);
    }
  });

  afterEach(() => {
    db.close();
  });

  const as = (who) => ({
    get: (path) =>
      request(app).get(path)
        .set('Authorization', `Bearer ${tokens[who]}`),

    post: (path, body) =>
      request(app).post(path)
        .set('Authorization', `Bearer ${tokens[who]}`)
        .send(body),

    patch: (path) =>
      request(app).patch(path)
        .set('Authorization', `Bearer ${tokens[who]}`),
  });

  // SRS critical flow 2: assign -> child sees -> completes -> parent sees.
  it('completes critical flow 2 from assignment to completion', async () => {
    const assigned = await as('parent').post(base, taskData);

    expect(assigned.status).toBe(201);
    expect(assigned.body).toMatchObject({
      title: taskData.title,
      description: taskData.description,
      area: taskData.area,
      dueDate: taskData.dueDate,
      status: 'pending',
      completedAt: null,
      assignedBy: {
        name: expect.any(String),
      },
    });

    const taskId = assigned.body.id;

    const childList = await as('child').get(base);

    expect(childList.status).toBe(200);
    expect(
      childList.body.find((task) => task.id === taskId)
    ).toMatchObject({ status: 'pending' });

    const completed = await as('child').patch(`${base}/${taskId}/complete`);

    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe('completed');
    expect(completed.body.completedAt).toEqual(expect.any(String));

    const parentList = await as('parent').get(base);

    expect(parentList.status).toBe(200);
    expect(
      parentList.body.find((task) => task.id === taskId)
    ).toMatchObject({
      status: 'completed',
      completedAt: expect.any(String),
    });
  });

  describe('GET', () => {
    it('lets a linked specialist list tasks', async () => {
      const res = await as('teacher').get(base);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(6);
    });

    it('filters tasks by week', async () => {
      const res = await as('parent').get(`${base}?week=2026-11-18`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(6);

      for (const task of res.body) {
        expect(task.dueDate >= '2026-11-16').toBe(true);
        expect(task.dueDate < '2026-11-23').toBe(true);
      }
    });

    it('rejects an invalid week', async () => {
      const res = await as('parent').get(`${base}?week=2026-02-30`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('blocks an unlinked specialist', async () => {
      const res = await as('doctor').get(base);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NO_ACCESS');
    });
  });

  describe('POST', () => {
    it('lets a linked specialist assign a task', async () => {
      const res = await as('teacher').post(base, taskData);

      expect(res.status).toBe(201);
      expect(res.body.assignedBy.name).toEqual(expect.any(String));
      expect(res.body.status).toBe('pending');
    });

    it('does not let a child assign tasks', async () => {
      const res = await as('child').post(base, taskData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('does not let an unlinked specialist assign tasks', async () => {
      const res = await as('doctor').post(base, taskData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NO_ACCESS');
    });

    it.each([
      ['missing title', { ...taskData, title: '' }],
      ['missing description', { ...taskData, description: '' }],
      ['invalid area', { ...taskData, area: 'unknown' }],
      ['invalid date', { ...taskData, dueDate: '2026-02-30' }],
      ['wrong date format', { ...taskData, dueDate: '18/11/2026' }],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_name, body) => {
      const res = await as('parent').post(base, body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /:taskId/complete', () => {
    it.each(['parent', 'teacher'])(
      'does not let %s complete a task',
      async (who) => {
        const taskId = db.prepare('SELECT id FROM tasks LIMIT 1').get().id;

        const res = await as(who).patch(`${base}/${taskId}/complete`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    );

    it('does not let an unlinked specialist complete a task', async () => {
      const taskId = db.prepare('SELECT id FROM tasks LIMIT 1').get().id;

      const res = await as('doctor').patch(`${base}/${taskId}/complete`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NO_ACCESS');
    });

    it('returns 404 for a task that does not exist', async () => {
      const res = await as('child').patch(`${base}/999999/complete`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('keeps the completion time when the child repeats the request', async () => {
      const taskId = db.prepare(
        'SELECT id FROM tasks WHERE completed_at IS NULL LIMIT 1'
      ).get().id;

      const first = await as('child').patch(`${base}/${taskId}/complete`);
      const second = await as('child').patch(`${base}/${taskId}/complete`);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.completedAt).toBe(first.body.completedAt);
    });
  });
});