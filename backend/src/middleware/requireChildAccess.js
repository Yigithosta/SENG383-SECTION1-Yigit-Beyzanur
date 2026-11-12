const { sendError } = require('../errors');

// M2 (FR-M2-03, FR-M2-04): every request about a child goes through this
// middleware. It runs after requireAuth, loads the child from :childId and
// works out how the logged-in user is related to it:
//
//   'parent'     the parent who owns the child
//   'specialist' a specialist linked to the child (child_specialists)
//   'self'       the child's own account
//
// Anyone else gets 403 NO_ACCESS, so knowing a child's id is never enough.
// The link is checked on every request, so unlinking takes effect at once.
//
// On success it sets:
//   req.child         { id, name, birthDate, parentId, userId }
//   req.childRelation 'parent' | 'specialist' | 'self'
function createRequireChildAccess({ db }) {
  const findChild = db.prepare(
    'SELECT id, name, birth_date AS birthDate, parent_id AS parentId, user_id AS userId FROM children WHERE id = ?'
  );
  const isLinked = db.prepare(
    'SELECT 1 FROM child_specialists WHERE child_id = ? AND specialist_id = ?'
  );

  return function requireChildAccess(req, res, next) {
    const childId = Number(req.params.childId);
    if (!Number.isInteger(childId) || childId <= 0) {
      return sendError(res, 404, 'CHILD_NOT_FOUND', 'Çocuk bulunamadı.');
    }

    const child = findChild.get(childId);
    if (!child) {
      return sendError(res, 404, 'CHILD_NOT_FOUND', 'Çocuk bulunamadı.');
    }

    const relation = relationTo(child, req.user, isLinked);
    if (!relation) {
      return sendError(res, 403, 'NO_ACCESS', 'Bu çocuğun bilgilerine erişim yetkiniz yok.');
    }

    req.child = child;
    req.childRelation = relation;
    return next();
  };
}

function relationTo(child, user, isLinked) {
  if (user.role === 'parent' && child.parentId === user.id) {
    return 'parent';
  }
  if (user.role === 'specialist' && isLinked.get(child.id, user.id)) {
    return 'specialist';
  }
  if (user.role === 'child' && child.userId === user.id) {
    return 'self';
  }
  return null;
}

// Narrows a route to some of the relations above, following the access table
// in docs/SDD.md. Use it after requireChildAccess, for example:
//   router.post('/', allowRelations('parent', 'specialist'), handler)
function allowRelations(...allowed) {
  return function checkRelation(req, res, next) {
    if (!allowed.includes(req.childRelation)) {
      return sendError(res, 403, 'FORBIDDEN', 'Bu işlem için yetkiniz yok.');
    }
    return next();
  };
}

module.exports = { createRequireChildAccess, allowRelations };
