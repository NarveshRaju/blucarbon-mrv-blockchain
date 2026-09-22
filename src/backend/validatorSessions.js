const { randomBytes, createHash } = require('node:crypto');
const sessions = new Map();
const digest = token => createHash('sha256').update(token).digest('hex');
function issueSession(validatorId) {
  const now = Date.now();
  for (const [key, value] of sessions) if (value.expiresAt <= now) sessions.delete(key);
  if (sessions.size >= 10000) throw new Error('Session capacity reached. Retry later.');
  const token = randomBytes(32).toString('hex');
  sessions.set(digest(token), { validatorId, expiresAt: now + 8 * 60 * 60 * 1000 });
  return token;
}
function requireValidator(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const session = token && sessions.get(digest(token));
  if (!session || session.expiresAt <= Date.now()) return res.status(401).json({ error: 'Sign in again as a validator to approve or issue demo tokens.' });
  req.validatorSession = session;
  next();
}
module.exports = { issueSession, requireValidator };
