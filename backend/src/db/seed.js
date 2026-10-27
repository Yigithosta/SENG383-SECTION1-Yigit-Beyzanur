const bcrypt = require('bcryptjs');
const { openDb } = require('./index');

// Synthetic demo data only. No real personal data may be used in this project.
// Every demo account uses the same password.
const DEMO_PASSWORD = 'Demo1234!';

const USERS = [
  { key: 'parent', name: 'Deniz Örnek', email: 'parent@demo.test', role: 'parent' },
  { key: 'child', name: 'Ege Örnek', email: 'child@demo.test', role: 'child' },
  { key: 'teacher', name: 'Selin Öğretmen', email: 'teacher@demo.test', role: 'specialist', specialistType: 'teacher' },
  { key: 'psychologist', name: 'Murat Psikolog', email: 'psychologist@demo.test', role: 'specialist', specialistType: 'psychologist' },
  // Registered but not linked to the child: useful for testing M2 access rules.
  { key: 'doctor', name: 'Aylin Doktor', email: 'doctor@demo.test', role: 'specialist', specialistType: 'doctor' },
];

function seed(db) {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, specialist_type)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertChild = db.prepare(
    'INSERT INTO children (parent_id, user_id, name, birth_date) VALUES (?, ?, ?, ?)'
  );
  const linkSpecialist = db.prepare(
    'INSERT INTO child_specialists (child_id, specialist_id) VALUES (?, ?)'
  );

  const run = db.transaction(() => {
    db.exec('DELETE FROM child_specialists; DELETE FROM children; DELETE FROM users;');

    const ids = {};
    for (const u of USERS) {
      ids[u.key] = insertUser.run(u.name, u.email, passwordHash, u.role, u.specialistType || null).lastInsertRowid;
    }

    const childId = insertChild.run(ids.parent, ids.child, 'Ege Örnek', '2018-04-12').lastInsertRowid;
    linkSpecialist.run(childId, ids.teacher);
    linkSpecialist.run(childId, ids.psychologist);
  });

  run();
}

if (require.main === module) {
  const db = openDb();
  seed(db);
  db.close();
  console.log(`Seeded ${USERS.length} demo users. Password for all: ${DEMO_PASSWORD}`);
}

module.exports = { seed, DEMO_PASSWORD, USERS };
