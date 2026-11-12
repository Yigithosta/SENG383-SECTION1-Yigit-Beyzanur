const jwt = require('jsonwebtoken');

// Design decision (docs/SDD.md, Authentication): HS256, 8-hour expiry,
// payload holds only the user id and role.
const ALGORITHM = 'HS256';
const EXPIRES_IN = '8h';

function signToken(user, secret) {
  return jwt.sign({ role: user.role }, secret, {
    algorithm: ALGORITHM,
    expiresIn: EXPIRES_IN,
    subject: String(user.id),
  });
}

// Throws if the token is missing, malformed, expired or signed with another secret.
// Pinning the algorithm stops "alg: none" and algorithm-confusion tokens.
function verifyToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken, EXPIRES_IN };
