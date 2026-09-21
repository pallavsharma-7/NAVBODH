const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');
const { createSession, destroySession, requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { identifier: string, password: string }
 */
router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'Username or email identifier is required.'
      }
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'Password is required.'
      }
    });
  }

  const cleanIdentifier = identifier.trim().toLowerCase();

  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.full_name,
             u.designation, u.department_id, u.cadre, u.phone, u.bio, u.avatar_url,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE lower(u.username) = ? OR lower(u.email) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username/email or password.'
        }
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username/email or password.'
        }
      });
    }

    // Create session and set HttpOnly cookie
    createSession(res, user.id);

    // Return sanitized user object
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          designation: user.designation,
          department_id: user.department_id,
          department_name: user.department_name,
          department_code: user.department_code,
          cadre: user.cadre,
          phone: user.phone,
          bio: user.bio,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (err) {
    console.error('[Auth Route] Login error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An internal server error occurred while processing authentication.'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  try {
    destroySession(req, res);
    return res.json({
      success: true,
      data: {
        message: 'Logged out successfully.'
      }
    });
  } catch (err) {
    console.error('[Auth Route] Logout error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during logout.'
      }
    });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;
