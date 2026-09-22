/**
 * NAVBODH - System Integration Status Route Boundary
 *
 * Contributor Ownership: Palak (Stage 5: Admin + Integration)
 *
 * Responsibilities:
 *  - Honest and truthful integration adapter status reporting
 *  - Clearly distinguish simulated/demo adapters from real live connectivity
 *  - Expose health, configuration, and readiness across AI, iGOT, NSSTA, and Database layers
 */

const express = require('express');
const { getDb } = require('./db');

const router = express.Router();

/**
 * Helper: Builds truthful integration status payload
 */
function getIntegrationStatusData() {
  let dbStatus = 'operational';
  let dbError = null;
  let totalCourses = 0;
  let igotCourses = 0;
  let nsstaCourses = 0;

  try {
    const db = getDb();
    const check = db.prepare('SELECT 1 as ok').get();
    if (!check || check.ok !== 1) {
      dbStatus = 'degraded';
    }

    const courseStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN source_label = 'sample_igot' THEN 1 ELSE 0 END) as igot_count,
        SUM(CASE WHEN source_label = 'sample_nssta_tpac' THEN 1 ELSE 0 END) as nssta_count
      FROM courses
    `).get();

    totalCourses = courseStats.total || 0;
    igotCourses = courseStats.igot_count || 0;
    nsstaCourses = courseStats.nssta_count || 0;
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  return {
    status: dbStatus === 'operational' ? 'operational' : 'degraded',
    environment: process.env.NODE_ENV || 'demonstration',
    system_timestamp: new Date().toISOString(),
    adapters: {
      ai_assistant: {
        name: 'NAVBODH Explainable Intelligence Assistant',
        type: 'intelligence_engine',
        status: 'simulated',
        mode: 'rules_based_fallback',
        provider: 'Local Deterministic Intelligence Engine',
        live_connected: false,
        description: 'Explainable rules-based intelligence with deterministic competency gap bridging and statistical curriculum guidance.',
        details: 'Stage 2 deterministic fallback architecture with explainable scoring thresholds.'
      },
      igot_karmayogi: {
        name: 'iGOT-Karmayogi Civil Service Platform',
        type: 'learning_repository',
        status: 'simulated',
        mode: 'demo_catalog',
        provider: 'DoPT / Karmayogi Bharat Sample Alignment',
        live_connected: false,
        catalog_count: igotCourses,
        description: 'Sample iGOT-Karmayogi course catalog alignment for official statistical competency development.',
        details: 'Demonstration catalog mapped to official MoSPI competency frameworks.'
      },
      nssta_tpac: {
        name: 'National Statistical Systems Training Academy (NSSTA TPAC)',
        type: 'institutional_training',
        status: 'simulated',
        mode: 'demo_curriculum',
        provider: 'MoSPI / NSSTA Training Wing',
        live_connected: false,
        catalog_count: nsstaCourses,
        description: 'Sample specialized statistical training modules aligned with official MoSPI training calendar.',
        details: 'NSSTA Training Programme & Advisory Committee sample modules for induction and mid-career training.'
      },
      sqlite_database: {
        name: 'Local SQLite Embedded Storage Engine',
        type: 'relational_persistence',
        status: dbStatus,
        mode: 'wal_journal',
        live_connected: dbStatus === 'operational',
        error: dbError,
        description: 'Embedded transactional database engine with foreign key integrity and WAL persistence.',
        details: 'Active SQLite database with WAL mode and foreign key constraints enabled.'
      },
      gamification_ledger: {
        name: 'NAVBODH Gamification & Reward Ledger Engine',
        type: 'rewards_analytics',
        status: 'operational',
        mode: 'immutable_ledger',
        live_connected: true,
        description: 'Persistent, idempotent reward event ledger with milestone tracking and deterministic growth leaderboard.',
        details: 'Idempotent event-keyed reward ledger ensuring duplicate-free point distribution and baseline growth calculations.'
      }
    }
  };
}

/**
 * GET /api/integrations/status
 * Truthful system adapter and external integration status.
 */
router.get('/status', (req, res) => {
  try {
    const data = getIntegrationStatusData();
    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('[Integrations Route] Error fetching status:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTEGRATIONS_STATUS_ERROR',
        message: 'Could not fetch system integration status.'
      }
    });
  }
});

module.exports = router;
module.exports.getIntegrationStatusData = getIntegrationStatusData;
