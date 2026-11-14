// Turns a users row into the public shape sent to the client.
// Never include password_hash here.
function findPublicUser(db, id) {
  const row = db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.specialist_type AS specialistType,
            c.id AS childId
     FROM users u
     LEFT JOIN children c ON c.user_id = u.id
     WHERE u.id = ?`
  ).get(id);

  if (!row) {
    return null;
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  if (row.role === 'specialist') {
    user.specialistType = row.specialistType;
  }
  if (row.role === 'child') {
    // The child's own profile, so the client can load "my tasks" and "my schedule".
    user.childId = row.childId;
  }
  return user;
}

module.exports = { findPublicUser };
