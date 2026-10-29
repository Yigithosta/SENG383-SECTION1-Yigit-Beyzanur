const { createApp } = require('./app');
const { openDb } = require('./db');

const PORT = process.env.PORT || 3001;

const db = openDb();

createApp({ db }).listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
