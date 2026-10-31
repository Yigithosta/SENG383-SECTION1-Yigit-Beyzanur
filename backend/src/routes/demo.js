const express = require('express');

// Walking skeleton only: shows that React, Express and SQLite are connected.
// It is public, so it must never return emails or password hashes.
// Remove it once M1 and M2 provide real, access-controlled screens.
function createDemoRouter({ db }) {
  const router = express.Router();

  router.get('/summary', (req, res) => {
    const roleCounts = db.prepare('SELECT role, COUNT(*) AS count FROM users GROUP BY role').all();
    const users = { parent: 0, child: 0, specialist: 0 };
    for (const row of roleCounts) {
      users[row.role] = row.count;
    }

    const children = db.prepare(
      `SELECT c.id, c.name, c.birth_date AS birthDate, p.name AS parentName
       FROM children c JOIN users p ON p.id = c.parent_id
       ORDER BY c.id`
    ).all();

    const specialists = db.prepare(
      `SELECT u.name, u.specialist_type AS type
       FROM users u
       WHERE u.role = 'specialist'
         AND EXISTS (
           SELECT 1 FROM child_specialists cs
           WHERE cs.specialist_id = u.id AND cs.child_id = ?
         ) = ?
       ORDER BY u.name`
    );

    res.json({
      users,
      children: children.map(({ id, ...child }) => ({
        ...child,
        linkedSpecialists: specialists.all(id, 1),
        unlinkedSpecialists: specialists.all(id, 0),
      })),
    });
  });

  return router;
}

module.exports = { createDemoRouter };
