/**
 * NAVBODH - Admin Module Route Boundary & Role Authorization
 * 
 * Contributor Ownership: Palak (Stage 5: Admin + Integration)
 * Responsibilities:
 *  - Workforce skill analytics & department matrix
 *  - Learning content curation & iGOT/NSSTA catalog management
 *  - Assessment question & quiz review
 *  - Cross-module integration hardening
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');

const router = express.Router();

// Enforce admin role for all admin routes
router.use(requireAuth);
router.use(requireRole('admin'));

/**
 * GET /api/admin/overview
 * Basic system statistics and metadata for administrator dashboard foundation.
 */
router.get('/overview', (req, res) => {
  try {
    const db = getDb();

    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as total_employees,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users
    `).get();

    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
    const compCount = db.prepare('SELECT COUNT(*) as count FROM competencies').get().count;
    const attemptCount = db.prepare('SELECT COUNT(*) as count FROM assessment_attempts').get().count;
    const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;

    const recentAttempts = db.prepare(`
      SELECT aa.id, aa.user_id, u.full_name as employee_name, u.username,
             d.name as department_name, aa.overall_score, aa.is_baseline, aa.completed_at
      FROM assessment_attempts aa
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY aa.id DESC
      LIMIT 5
    `).all();

    return res.json({
      success: true,
      data: {
        summary: {
          total_users: userStats.total_users || 0,
          total_employees: userStats.total_employees || 0,
          total_admins: userStats.total_admins || 0,
          total_departments: deptCount,
          total_competencies: compCount,
          total_assessment_attempts: attemptCount,
          total_sample_courses: courseCount
        },
        recent_assessments: recentAttempts,
        admin_user: {
          id: req.user.id,
          username: req.user.username,
          full_name: req.user.full_name,
          role: req.user.role,
          designation: req.user.designation
        }
      }
    });
  } catch (err) {
    console.error('[Admin Route] Overview error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch admin overview.'
      }
    });
  }
});

// Placeholder for Stage 5 - Workforce Insights
router.get('/workforce-insights', (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Workforce insights analytics scheduled for Stage 5 (Owner: Palak).'
    }
  });
});

// Placeholder for Stage 5 - Learning Content Management
router.get('/learning-content', (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Admin learning content curation scheduled for Stage 5 (Owner: Palak).'
    }
  });
});

// Placeholder for Stage 5 - Quiz Review
router.get('/quiz-review', (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Admin quiz review workflow scheduled for Stage 5 (Owner: Palak).'
    }
  });
});

module.exports = router;
