
const express = require('express');
const { allowRelations } = require('../middleware/requireChildAccess');
const { sendError } = require('../errors');

// Local date-time format: YYYY-MM-DDTHH:MM
function isValidDateTime(value) {
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute] = match.map(Number);

  if (year < 1 || month < 1 || month > 12 ||
      hour > 23 || minute > 59) {
    return false;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function isValidMonday(value) {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  if (!isValidDateTime(`${value}T00:00`)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return date.getUTCDay() === 1;
}

function nextMonday(week) {
  const [year, month, day] = week.split('-').map(Number);

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day + 7);
  date.setUTCHours(0, 0, 0, 0);

  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function createEventsRouter({ db }) {
  const router = express.Router({ mergeParams: true });

  // GET /api/children/:childId/events?week=2026-11-16
  // Parent, linked specialist and child can view events.
  router.get(
    '/',
    allowRelations('parent', 'specialist', 'self'),
    (req, res) => {
      const { week } = req.query;

      if (!isValidMonday(week)) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'week must be a valid Monday in YYYY-MM-DD format.'
        );
      }

      const weekStart = `${week}T00:00`;
      const weekEnd = `${nextMonday(week)}T00:00`;

      const events = db.prepare(`
        SELECT
          id,
          child_id AS childId,
          created_by AS createdBy,
          title,
          starts_at AS startsAt,
          ends_at AS endsAt,
          created_at AS createdAt
        FROM events
        WHERE child_id = ?
          AND starts_at >= ?
          AND starts_at < ?
        ORDER BY starts_at ASC, id ASC
      `).all(req.child.id, weekStart, weekEnd);

      return res.json(events);
    }
  );

  // POST /api/children/:childId/events
  // Only parent and linked specialist can create events.
  router.post(
    '/',
    allowRelations('parent', 'specialist'),
    (req, res) => {
      const { title, startsAt, endsAt } = req.body || {};

      if (typeof title !== 'string' || !title.trim()) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'title is required.'
        );
      }

      if (!isValidDateTime(startsAt) ||
          !isValidDateTime(endsAt)) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'startsAt and endsAt must use YYYY-MM-DDTHH:MM.'
        );
      }

      if (endsAt < startsAt) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'endsAt cannot be earlier than startsAt.'
        );
      }

      const result = db.prepare(`
        INSERT INTO events (
          child_id,
          created_by,
          title,
          starts_at,
          ends_at
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        req.child.id,
        req.user.id,
        title.trim(),
        startsAt,
        endsAt
      );

      const event = db.prepare(`
        SELECT
          id,
          child_id AS childId,
          created_by AS createdBy,
          title,
          starts_at AS startsAt,
          ends_at AS endsAt,
          created_at AS createdAt
        FROM events
        WHERE id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json(event);
    }
  );

  return router;
}

module.exports = { createEventsRouter };
