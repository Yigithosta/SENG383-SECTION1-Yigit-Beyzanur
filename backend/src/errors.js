// Every API error uses the same shape (see docs/SDD.md):
// { "error": { "code": "SOME_CODE", "message": "Human readable text" } }
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

module.exports = { sendError };
