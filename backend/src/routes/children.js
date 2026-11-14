const express = require('express');

const CHILD_COLUMNS = 'c.id, c.name, c.birth_date AS birthDate';

// GET /api/children: the children the logged-in user may access.
// The parent sees their own children, a specialist the children linked to
// them, and a child only their own profile.
function createChildrenListRouter({ db, requireAuth }) {
  const router = express.Router();

  const queries = {
    parent: db.prepare(`SELECT ${CHILD_COLUMNS}, 'parent' AS relation FROM children c WHERE c.parent_id = ? ORDER BY c.name`),
    specialist: db.prepare(
      `SELECT ${CHILD_COLUMNS}, 'specialist' AS relation
       FROM children c JOIN child_specialists cs ON cs.child_id = c.id
       WHERE cs.specialist_id = ? ORDER BY c.name`
    ),
    child: db.prepare(`SELECT ${CHILD_COLUMNS}, 'self' AS relation FROM children c WHERE c.user_id = ?`),
  };

  // requireAuth sits on the route, not the router, so it does not run twice
  // for /api/children/:childId paths that only pass through here.
  router.get('/', requireAuth, (req, res) => {
    res.json({ children: queries[req.user.role].all(req.user.id) });
  });

  return router;
}

// GET /api/children/:childId (after requireAuth and requireChildAccess):
// every relation may read the child profile.
function createChildProfileRouter() {
  const router = express.Router({ mergeParams: true });

  router.get('/', (req, res) => {
    const { id, name, birthDate } = req.child;
    res.json({ child: { id, name, birthDate, relation: req.childRelation } });
  });

  return router;
}

module.exports = { createChildrenListRouter, createChildProfileRouter };
