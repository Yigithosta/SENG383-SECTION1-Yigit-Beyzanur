const express = require('express');
const { createDemoRouter } = require('./routes/demo');

function createApp({ db }) {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'ok' });
  });

  app.use('/api/demo', createDemoRouter({ db }));

  return app;
}

module.exports = { createApp };
