// M2: linking specialists to a child. Route handlers check permissions;
// this module only reads and writes the data.

const SPECIALIST_COLUMNS = `u.id, u.name, u.email, u.specialist_type AS specialistType, cs.linked_at AS linkedAt`;

function listLinkedSpecialists(db, childId) {
  return db.prepare(
    `SELECT ${SPECIALIST_COLUMNS}
     FROM child_specialists cs JOIN users u ON u.id = cs.specialist_id
     WHERE cs.child_id = ?
     ORDER BY u.name`
  ).all(childId);
}

// Returns { specialist } on success, or { error: 'SPECIALIST_NOT_FOUND' | 'ALREADY_LINKED' }.
// Only accounts with the specialist role can be linked (FR-M2-05).
function linkSpecialistByEmail(db, childId, email) {
  const user = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'specialist'")
    .get(email.trim().toLowerCase());
  if (!user) {
    return { error: 'SPECIALIST_NOT_FOUND' };
  }

  const inserted = db.prepare(
    'INSERT OR IGNORE INTO child_specialists (child_id, specialist_id) VALUES (?, ?)'
  ).run(childId, user.id);
  if (inserted.changes === 0) {
    return { error: 'ALREADY_LINKED' };
  }

  const specialist = db.prepare(
    `SELECT ${SPECIALIST_COLUMNS}
     FROM child_specialists cs JOIN users u ON u.id = cs.specialist_id
     WHERE cs.child_id = ? AND cs.specialist_id = ?`
  ).get(childId, user.id);
  return { specialist };
}

// Returns true when a link was removed.
function unlinkSpecialist(db, childId, specialistId) {
  return db.prepare('DELETE FROM child_specialists WHERE child_id = ? AND specialist_id = ?')
    .run(childId, specialistId).changes > 0;
}

module.exports = { listLinkedSpecialists, linkSpecialistByEmail, unlinkSpecialist };
