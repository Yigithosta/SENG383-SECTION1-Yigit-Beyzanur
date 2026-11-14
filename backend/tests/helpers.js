const request = require('supertest');
const { createApp } = require('../src/app');
const { openDb } = require('../src/db');
const { seed, DEMO_PASSWORD } = require('../src/db/seed');

// Fixed secret for tests only; the real one comes from backend/.env.
const TEST_JWT_SECRET = 'test-secret-do-not-use-outside-tests';

function createTestApp(db) {
  return createApp({ db, jwtSecret: TEST_JWT_SECRET });
}

// Fresh in-memory database with the demo data.
function openSeededDb() {
  const db = openDb(':memory:');
  seed(db);
  return db;
}

// Logs in as a demo account and returns the token.
async function loginAs(app, email, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login as ${email} failed with ${res.status}`);
  }
  return res.body.token;
}

module.exports = { TEST_JWT_SECRET, createTestApp, openSeededDb, loginAs };
