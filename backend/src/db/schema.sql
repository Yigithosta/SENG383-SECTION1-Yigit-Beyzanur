-- Core tables for the walking skeleton. Module tables (events, tasks,
-- entries, documents) are added with their own modules (M3-M6).

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  role            TEXT    NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
  specialist_type TEXT    CHECK (specialist_type IN ('teacher', 'psychologist', 'doctor', 'special_education', 'coach')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK ((role = 'specialist') = (specialist_type IS NOT NULL))
);

-- A child profile is owned by a parent and may have its own login (user_id).
CREATE TABLE IF NOT EXISTS children (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT    NOT NULL,
  birth_date TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- M2: which specialists the parent has linked to which child.
CREATE TABLE IF NOT EXISTS child_specialists (
  child_id      INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  specialist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (child_id, specialist_id)
);
