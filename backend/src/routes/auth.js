const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken, EXPIRES_IN } = require('../auth/tokens');
const { findPublicUser } = require('../auth/users');
const { sendError } = require('../errors');

// Compared against when the email is unknown, so a wrong email and a wrong
// password take about the same time and cannot be told apart.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function createAuthRouter({ db, jwtSecret, requireAuth }) {
  const router = express.Router();

  // M1 (FR-M1-01, FR-M1-02): email and password login. The role comes from
  // the account; the client cannot choose it.
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};

      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'E-posta ve şifre zorunludur.');
      }

      const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?')
        .get(email.trim().toLowerCase());

      const passwordOk = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);
      if (!row || !passwordOk) {
        // Same answer for both cases: do not reveal which emails are registered.
        return sendError(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
      }

      const user = findPublicUser(db, row.id);
      return res.json({ token: signToken(user, jwtSecret), expiresIn: EXPIRES_IN, user });
    } catch (err) {
      // Express 4 does not catch errors thrown in async handlers by itself.
      return next(err);
    }
  });

  // M1 (FR-M1-03): the client calls this after a reload to restore the
  // session and pick the screens for the user's role.
  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = { createAuthRouter };
