/**
 * NAVBODH - Learning Module Route Boundary
 * 
 * Contributor Ownership: Pathika (Stage 3: Learning)
 * Responsibilities:
 *  - Course catalogue browsing and enrollment
 *  - Lesson delivery and learning progress tracking
 *  - Interactive quiz engine and attempt scoring
 *  - Learning materials integration
 * 
 * Note: Core Foundation provides schema tables (courses, course_competencies,
 * lessons, learning_materials, learning_progress, quizzes, quiz_attempts).
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * Basic Course Listing (Reads course foundation seeded in Core)
 */
router.get('/courses', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const courses = db.prepare(`
      SELECT id, code, title, description, source_label, duration_hours, difficulty_level, domain
      FROM courses
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    return res.json({
      success: true,
      data: {
        courses,
        note: 'Course catalogue foundation provided. Full learning workflow scheduled for Stage 3 (Owner: Pathika).'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch courses.'
      }
    });
  }
});

// Placeholder for Stage 3 - Course Enrollment
router.post('/courses/:id/enroll', requireAuth, (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Course enrollment workflow is scheduled for Stage 3 (Owner: Pathika).'
    }
  });
});

// Placeholder for Stage 3 - Quiz Engine
router.get('/quizzes/:id', requireAuth, (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Quiz engine is scheduled for Stage 3 (Owner: Pathika).'
    }
  });
});

module.exports = router;
