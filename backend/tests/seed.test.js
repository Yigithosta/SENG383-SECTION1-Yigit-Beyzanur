const bcrypt = require('bcryptjs');
const { openDb } = require('../src/db');
const { seed, DEMO_PASSWORD, USERS } = require('../src/db/seed');

describe('seed', () => {
  let db;

  beforeEach(() => {
    db = openDb(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('creates one account per demo user with a hashed password', () => {
    seed(db);

    const users = db.prepare('SELECT email, password_hash FROM users').all();
    expect(users).toHaveLength(USERS.length);
    for (const u of users) {
      expect(u.password_hash).not.toBe(DEMO_PASSWORD);
      expect(bcrypt.compareSync(DEMO_PASSWORD, u.password_hash)).toBe(true);
    }
  });

  it('links the teacher and psychologist to the child but not the doctor', () => {
    seed(db);

    const linked = db.prepare(
      `SELECT u.email FROM child_specialists cs JOIN users u ON u.id = cs.specialist_id ORDER BY u.email`
    ).all().map((r) => r.email);

    expect(linked).toEqual(['psychologist@demo.test', 'teacher@demo.test']);
  });

  it('can be run twice without duplicating data', () => {
    seed(db);
    seed(db);

    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBe(USERS.length);
    expect(db.prepare('SELECT COUNT(*) AS n FROM children').get().n).toBe(1);
  });
});
