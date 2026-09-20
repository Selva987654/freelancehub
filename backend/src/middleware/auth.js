const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiError');
const db = require('../db');

// Verifies the JWT and attaches the current user to req.user. Required for protected routes.
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'You need to be signed in to do that.');
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, email, name, role, avatar_url, is_active FROM users WHERE id = ?').get(payload.sub);
    if (!user || !user.is_active) throw new ApiError(401, 'Your session is no longer valid. Please sign in again.');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, 'Your session is no longer valid. Please sign in again.'));
  }
}

// Attaches req.user if a valid token is present, but never blocks the request.
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, email, name, role, avatar_url, is_active FROM users WHERE id = ?').get(payload.sub);
    if (user && user.is_active) req.user = user;
    next();
  } catch {
    next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'You need to be signed in to do that.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do that.'));
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
