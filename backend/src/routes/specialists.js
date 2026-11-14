const express = require('express');
const { allowRelations } = require('../middleware/requireChildAccess');
const { listLinkedSpecialists, linkSpecialistByEmail, unlinkSpecialist } = require('../services/linking');
const { sendError } = require('../errors');

// Mounted at /api/children/:childId/specialists, after requireAuth and
// requireChildAccess. Access table (docs/SDD.md): the parent creates, reads
// and deletes links; a linked specialist reads them; the child has no access.
function createSpecialistsRouter({ db }) {
  const router = express.Router({ mergeParams: true });

  // FR-M2-06
  router.get('/', allowRelations('parent', 'specialist'), (req, res) => {
    res.json({ specialists: listLinkedSpecialists(db, req.child.id) });
  });

  // FR-M2-01, FR-M2-05
  router.post('/', allowRelations('parent'), (req, res) => {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email.trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Uzmanın e-posta adresi zorunludur.');
    }

    const result = linkSpecialistByEmail(db, req.child.id, email);
    if (result.error === 'SPECIALIST_NOT_FOUND') {
      return sendError(res, 404, 'SPECIALIST_NOT_FOUND', 'Bu e-posta adresiyle kayıtlı bir uzman bulunamadı.');
    }
    if (result.error === 'ALREADY_LINKED') {
      return sendError(res, 409, 'ALREADY_LINKED', 'Bu uzman çocuğa zaten bağlı.');
    }
    return res.status(201).json({ specialist: result.specialist });
  });

  // FR-M2-02. The confirmation step (FR-M2-07) happens in the client.
  router.delete('/:specialistId', allowRelations('parent'), (req, res) => {
    const specialistId = Number(req.params.specialistId);
    if (!Number.isInteger(specialistId) || !unlinkSpecialist(db, req.child.id, specialistId)) {
      return sendError(res, 404, 'LINK_NOT_FOUND', 'Bu uzman çocuğa bağlı değil.');
    }
    return res.status(204).end();
  });

  return router;
}

module.exports = { createSpecialistsRouter };
