const express = require('express');
const { allowRelations } = require('../middleware/requireChildAccess');
const { sendError } = require('../errors');

const AREAS = new Set([
  'language',
  'motor',
  'cognitive',
  'social_emotional',
  'self_care',
]);

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function nextWeek(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 7));
  return date.toISOString().slice(0, 10);
}

function formatTask(task) {
  return {
    id: task.id,
    childId: task.childId,
    title: task.title,
    description: task.description,
    area: task.area,
    dueDate: task.dueDate,
    status: task.completedAt ? 'completed' : 'pending',
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    assignedBy: {
      id: task.assignedById,
      name: task.assignedByName,
    },
  };
}

function createTasksRouter({ db }) {
  const router = express.Router({ mergeParams: true });

  const columns = `
    t.id,
    t.child_id AS childId,
    t.title,
    t.description,
    t.area,
    t.due_date AS dueDate,
    t.completed_at AS completedAt,
    t.created_at AS createdAt,
    u.id AS assignedById,
    u.name AS assignedByName
  `;

  const listTasks = db.prepare(`
    SELECT ${columns}
    FROM tasks t
    JOIN users u ON u.id = t.assigned_by
    WHERE t.child_id = ?
    ORDER BY t.due_date, t.created_at, t.id
  `);

  const listWeeklyTasks = db.prepare(`
    SELECT ${columns}
    FROM tasks t
    JOIN users u ON u.id = t.assigned_by
    WHERE t.child_id = ?
      AND t.due_date >= ?
      AND t.due_date < ?
    ORDER BY t.due_date, t.created_at, t.id
  `);

  const findTask = db.prepare(`
    SELECT ${columns}
    FROM tasks t
    JOIN users u ON u.id = t.assigned_by
    WHERE t.id = ? AND t.child_id = ?
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (child_id, assigned_by, title, description, area, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const completeTask = db.prepare(`
    UPDATE tasks
    SET completed_at = COALESCE(completed_at, datetime('now'))
    WHERE id = ? AND child_id = ?
  `);

  // GET /api/children/:childId/tasks?week=YYYY-MM-DD
  router.get(
    '/',
    allowRelations('parent', 'specialist', 'self'),
    (req, res) => {
      const childId = req.child.id;
      const { week } = req.query;

      if (week !== undefined) {
        if (!isValidDate(week)) {
          return sendError(
            res,
            400,
            'VALIDATION_ERROR',
            'Geçerli bir hafta tarihi giriniz.'
          );
        }

        const start = new Date(`${week}T00:00:00Z`);
        const weekday = (start.getUTCDay() + 6) % 7;
        start.setUTCDate(start.getUTCDate() - weekday);

        const monday = start.toISOString().slice(0, 10);
        const tasks = listWeeklyTasks.all(
          childId,
          monday,
          nextWeek(monday)
        );

        return res.json(tasks.map(formatTask));
      }

      return res.json(listTasks.all(childId).map(formatTask));
    }
  );

  // POST /api/children/:childId/tasks
  router.post(
    '/',
    allowRelations('parent', 'specialist'),
    (req, res) => {
      const { title, description, area, dueDate } = req.body || {};

      if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof description !== 'string' ||
        !description.trim() ||
        !AREAS.has(area) ||
        !isValidDate(dueDate)
      ) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Başlık, açıklama, gelişim alanı ve geçerli bitiş tarihi zorunludur.'
        );
      }

      const result = insertTask.run(
        req.child.id,
        req.user.id,
        title.trim(),
        description.trim(),
        area,
        dueDate
      );

      const task = findTask.get(result.lastInsertRowid, req.child.id);
      return res.status(201).json(formatTask(task));
    }
  );

  // PATCH /api/children/:childId/tasks/:taskId/complete
  router.patch(
    '/:taskId/complete',
    allowRelations('self'),
    (req, res) => {
      const taskId = Number(req.params.taskId);

      if (!Number.isSafeInteger(taskId) || taskId <= 0) {
        return sendError(res, 404, 'TASK_NOT_FOUND', 'Görev bulunamadı.');
      }

      const existing = findTask.get(taskId, req.child.id);

      if (!existing) {
        return sendError(res, 404, 'TASK_NOT_FOUND', 'Görev bulunamadı.');
      }

      completeTask.run(taskId, req.child.id);

      const updated = findTask.get(taskId, req.child.id);
      return res.json(formatTask(updated));
    }
  );

  return router;
}

module.exports = { createTasksRouter };