const { verifyToken } = require('../auth/tokens');
const { findPublicUser } = require('../auth/users');
const { sendError } = require('../errors');

// Checks the "Authorization: Bearer <token>" header and puts the logged-in
// user on req.user. Responds 401 when the token is missing or invalid.
//
// The user is loaded from the database on every request, so the role always
// comes from the account and a deleted account loses access immediately.
function createRequireAuth({ db, jwtSecret }) {
  return function requireAuth(req, res, next) {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Bu işlem için giriş yapmalısınız.');
    }

    let payload;
    try {
      payload = verifyToken(token, jwtSecret);
    } catch (err) {
      const expired = err.name === 'TokenExpiredError';
      return sendError(
        res,
        401,
        expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        expired ? 'Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.' : 'Geçersiz oturum, lütfen tekrar giriş yapın.'
      );
    }

    const user = findPublicUser(db, Number(payload.sub));
    if (!user) {
      return sendError(res, 401, 'INVALID_TOKEN', 'Geçersiz oturum, lütfen tekrar giriş yapın.');
    }

    req.user = user;
    return next();
  };
}

module.exports = { createRequireAuth };
