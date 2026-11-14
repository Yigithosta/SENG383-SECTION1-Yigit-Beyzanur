const express = require('express');
const { createAuthRouter } = require('./routes/auth');
const { createRequireAuth } = require('./middleware/requireAuth');
const { createRequireChildAccess } = require('./middleware/requireChildAccess');
const { createChildrenListRouter, createChildProfileRouter } = require('./routes/children');
const { createTasksRouter } = require('./routes/tasks');
const { createSpecialistsRouter } = require('./routes/specialists');
const { sendError } = require('./errors');

// jwtSecret is passed in (not read from process.env here) so tests can use
// their own secret. server.js reads it from JWT_SECRET in backend/.env.
function createApp({ db, jwtSecret }) {
  if (!jwtSecret) {
    throw new Error('createApp needs a jwtSecret (JWT_SECRET in backend/.env).');
  }

  const app = express();
  app.use(express.json());

  // Module routers that need a logged-in user receive this middleware,
  // for example: createEventsRouter({ db, requireAuth }).
  const requireAuth = createRequireAuth({ db, jwtSecret });

  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'ok' });
  });

  app.use('/api/auth', createAuthRouter({ db, jwtSecret, requireAuth }));

  app.use('/api/children', createChildrenListRouter({ db, requireAuth }));

  // Everything under /api/children/:childId passes requireAuth and
  // requireChildAccess first, so req.user, req.child and req.childRelation
  // are always set. Add module routers here, for example:
  //   childScope.use('/events', createEventsRouter({ db }));
  // and narrow each route with allowRelations(...) from the SDD access table.
  const childScope = express.Router({ mergeParams: true });
  childScope.use('/specialists', createSpecialistsRouter({ db }));
  childScope.use('/tasks', createTasksRouter({ db }));
  childScope.use('/', createChildProfileRouter());
  app.use('/api/children/:childId', requireAuth, createRequireChildAccess({ db }), childScope);

  // Unknown /api paths get a JSON 404 instead of Express's HTML page.
  app.use('/api', (req, res) => sendError(res, 404, 'NOT_FOUND', 'İstenen kaynak bulunamadı.'));

  // Express recognises an error handler by its four parameters, so keep `next`.
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err.type === 'entity.parse.failed') {
      return sendError(res, 400, 'INVALID_JSON', 'İstek gövdesi geçerli JSON değil.');
    }
    console.error(err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Beklenmeyen bir hata oluştu.');
  });

  return app;
}

module.exports = { createApp };
