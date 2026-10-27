const express = require('express');

function createApp({ db }) {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'ok' });
  });

  return app;
}

module.exports = { createApp };
