/**
 * NAVBODH - Gamification Module Route Boundary
 * 
 * Contributor Ownership: Pallav (Stage 4: Gamification)
 * Responsibilities:
 *  - Growth-based leaderboard calculation: ((Current - Baseline) / Baseline) * 100
 *  - Reward point distribution and ledger tracking
 *  - Achievement unlocking logic
 *  - Milestones and badges display
 * 
 * Note: Core Foundation provides schema tables (reward_ledger, achievement_definitions,
 * employee_achievements, employee_competencies with baseline_score and current_score).
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * Basic Achievements definition listing (Reads definitions seeded in Core)
 */
router.get('/achievements', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const achievements = db.prepare(`
      SELECT id, code, title, description, icon, category
      FROM achievement_definitions
      ORDER BY id ASC
    `).all();

    return res.json({
      success: true,
      data: {
        achievements,
        note: 'Achievement definitions foundation provided. Full unlocking logic scheduled for Stage 4 (Owner: Pallav).'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch achievement definitions.'
      }
    });
  }
});

// Placeholder for Stage 4 - Growth Leaderboard
router.get('/leaderboard', requireAuth, (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Growth-based leaderboard is scheduled for Stage 4 (Owner: Pallav).'
    }
  });
});

module.exports = router;
