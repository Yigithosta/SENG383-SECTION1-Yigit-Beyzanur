const crypto = require('crypto');
const { createApp } = require('./app');
const { openDb } = require('./db');

const PORT = process.env.PORT || 3001;

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  // Lets the app start straight from the README without a .env file.
  // A random secret is never guessable, but logins do not survive a restart.
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    'JWT_SECRET is not set: using a temporary secret, so users must log in again after every restart. ' +
    'Set JWT_SECRET in backend/.env (see .env.example).'
  );
}

const db = openDb();

createApp({ db, jwtSecret }).listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
