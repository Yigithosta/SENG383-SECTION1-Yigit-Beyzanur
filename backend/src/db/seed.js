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
  const insertTask = db.prepare(`
  INSERT INTO tasks
    (child_id, assigned_by, title, description, area, due_date, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

  const run = db.transaction(() => {
    db.exec('DELETE FROM child_specialists; DELETE FROM children; DELETE FROM users;');
    db.exec('DELETE FROM tasks; DELETE FROM child_specialists; DELETE FROM children; DELETE FROM users;');
    const ids = {};
    for (const u of USERS) {
      // Hashed once per account, so each account gets its own salt and hash.
      const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
      ids[u.key] = insertUser.run(u.name, u.email, passwordHash, u.role, u.specialistType || null).lastInsertRowid;
    }

    const childId = insertChild.run(ids.parent, ids.child, 'Ege Örnek', '2018-04-12').lastInsertRowid;
    linkSpecialist.run(childId, ids.teacher);
    linkSpecialist.run(childId, ids.psychologist);

    const demoTasks = [
  {
    assignedBy: ids.parent,
    title: 'Hikaye anlatma',
    description: 'Resimlere bakarak kısa bir hikaye anlat.',
    area: 'language',
    dueDate: '2026-11-16',
    completedAt: null,
  },
  {
    assignedBy: ids.teacher,
    title: 'Şekilleri eşleştirme',
    description: 'Benzer şekilleri doğru kutularla eşleştir.',
    area: 'cognitive',
    dueDate: '2026-11-17',
    completedAt: null,
  },
  {
    assignedBy: ids.parent,
    title: 'Düğme ilikleme',
    description: 'Gömlekteki üç düğmeyi ilikle.',
    area: 'motor',
    dueDate: '2026-11-18',
    completedAt: null,
  },
  {
    assignedBy: ids.psychologist,
    title: 'Duyguları tanıma',
    description: 'Resimlerdeki kişilerin duygularını söyle.',
    area: 'social_emotional',
    dueDate: '2026-11-19',
    completedAt: '2026-11-13 10:30:00',
  },
  {
    assignedBy: ids.parent,
    title: 'El yıkama',
    description: 'Yemekten önce ellerini sabunla yıka.',
    area: 'self_care',
    dueDate: '2026-11-20',
    completedAt: '2026-11-13 11:00:00',
  },
  {
    assignedBy: ids.teacher,
    title: 'Kelime çalışması',
    description: 'Beş yeni kelime öğren ve cümlede kullan.',
    area: 'language',
    dueDate: '2026-11-21',
    completedAt: '2026-11-13 12:00:00',
  },
];

for (const task of demoTasks) {
  insertTask.run(
    childId,
    task.assignedBy,
    task.title,
    task.description,
    task.area,
    task.dueDate,
    task.completedAt
  );
}
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
