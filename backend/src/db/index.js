const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_DB_FILE = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Opens the database and makes sure the schema exists.
// Pass ':memory:' for tests so every test gets a clean database.
function openDb(filename = process.env.DB_FILE || DEFAULT_DB_FILE) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

module.exports = { openDb };
