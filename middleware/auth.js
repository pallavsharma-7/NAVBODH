const crypto = require('crypto');
const { getDb } = require('../db');

const COOKIE_NAME = 'navbodh_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a server-side session for a user and sets the HttpOnly cookie.
 */
function createSession(res, userId) {
  const db = getDb();
  const sid = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  // Clean up any stale sessions for this user or globally expired
  db.prepare(`DELETE FROM sessions WHERE user_id = ? OR expires_at < datetime('now')`).run(userId);

  // Insert new session
  db.prepare(`
    INSERT INTO sessions (sid, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sid, userId, expiresAt);

  // Set HttpOnly cookie
  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS
  });

  return sid;
}

/**
 * Destroys a session in the database and clears the cookie.
 */
function destroySession(req, res) {
  const sid = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (sid) {
    const db = getDb();
    db.prepare(`DELETE FROM sessions WHERE sid = ?`).run(sid);
  }
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Middleware that inspects the session cookie and attaches user info to req.user.
 */
function attachUser(req, res, next) {
  req.user = null;
  const sid = req.cookies ? req.cookies[COOKIE_NAME] : null;

  if (!sid) {
    return next();
  }

  try {
    const db = getDb();
    const session = db.prepare(`
      SELECT s.sid, s.user_id, s.expires_at,
             u.id, u.username, u.email, u.role, u.full_name, u.designation,
             u.department_id, u.cadre, u.phone, u.bio, u.avatar_url,
             d.name as department_name, d.code as department_code
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE s.sid = ? AND s.expires_at > datetime('now')
    `).get(sid);

    if (session) {
      req.user = {
        id: session.id,
        username: session.username,
        email: session.email,
        role: session.role,
        full_name: session.full_name,
        designation: session.designation,
        department_id: session.department_id,
        department_name: session.department_name,
        department_code: session.department_code,
        cadre: session.cadre,
        phone: session.phone,
        bio: session.bio,
        avatar_url: session.avatar_url
      };
    } else {
      // Expired or invalid session in cookie
      res.clearCookie(COOKIE_NAME, { path: '/' });
    }
  } catch (err) {
    console.error('[Auth Middleware] Session lookup error:', err.message);
  }

  next();
}

/**
 * Middleware requiring that the request is authenticated.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in to access this resource.'
      }
    });
  }
  next();
}

/**
 * Middleware requiring a specific role (e.g. 'admin' or 'employee').
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires role: ${roles.join(' or ')}.`
        }
      });
    }

    next();
  };
}

module.exports = {
  COOKIE_NAME,
  createSession,
  destroySession,
  attachUser,
  requireAuth,
  requireRole
};
