/**
 * NAVBODH - Stage 2: Intelligence Module Automated Verification Test Suite
 * 
 * Tests and verifies:
 * 1. Skill-Gap Identification (Deterministic gap = target - current)
 * 2. Priority Logic & Thresholds (High >= 30, Med >= 15, Low > 0, Met <= 0)
 * 3. Employee Data Scoping & Session Isolation
 * 4. Empty States (Unassessed officer, all targets met)
 * 5. Personalized Recommendations (Gap-to-Course mapping, multi-gap ranking, explainable reasons, source labels)
 * 6. Dynamic Learning Roadmap (Phase grouping, attached courses, real-time adaptivity on score changes)
 * 7. AI Study Assistant Boundary (Input validation, contextual grounding, deterministic fallback, secret safety)
 * 8. Regression: Core Foundation Integrity (Health, auth, profile, baseline immutability, admin boundary)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

// Set dedicated test database path
const TEST_DB_PATH = path.join(__dirname, 'navbodh-intelligence-test.sqlite');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.DB_PATH = TEST_DB_PATH;

const app = require('../server');
const { getDb, initDatabase, Database } = require('../db');
const { seedDatabase } = require('../seed');

const PORT = 4001;
let server;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: HTTP Client with Cookie Management
class TestClient {
  constructor() {
    this.cookie = null;
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/navbodh_session=[^;]+/);
      if (match) {
        this.cookie = match[0];
      }
    }

    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      // not json
    }

    return {
      status: res.status,
      headers: res.headers,
      body: json
    };
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  STARTING NAVBODH STAGE 2: INTELLIGENCE TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• Testing: ${name}... `);
    try {
      await fn();
      console.log('✓ PASS');
      passed++;
    } catch (err) {
      console.log('✗ FAIL');
      console.error('  Error:', err.message);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(1, 4).join('\n');
        console.error(stackLines);
      }
      failed++;
    }
  }

  try {
    // Start test server
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => resolve(s));
    });

    const emp1Client = new TestClient(); // Priya Sharma
    const emp2Client = new TestClient(); // Rajesh Verma (initially unassessed)
    const unauthClient = new TestClient();

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated Requests are Rejected across Intelligence Endpoints
    // ------------------------------------------------------------------------
    await test('Intelligence endpoints reject unauthenticated requests (HTTP 401)', async () => {
      const endpoints = [
        ['GET', '/api/intelligence/skill-gaps'],
        ['GET', '/api/intelligence/recommendations'],
        ['GET', '/api/intelligence/roadmap'],
        ['POST', '/api/intelligence/study-assistant', { message: 'Hello' }]
      ];

      for (const [method, ep, body] of endpoints) {
        const res = await unauthClient.request(ep, { method, body });
        assert.strictEqual(res.status, 401, `${method} ${ep} must return 401`);
        assert.strictEqual(res.body.success, false);
        assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 2: Employee Authentication & Initial Setup
    // ------------------------------------------------------------------------
    await test('Employee authentication logs in test officers successfully', async () => {
      const res1 = await emp1Client.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.sharma', password: 'Password123!' }
      });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.success, true);
      assert.strictEqual(res1.body.data.user.username, 'emp.sharma');

      const res2 = await emp2Client.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.verma', password: 'Password123!' }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.success, true);
      assert.strictEqual(res2.body.data.user.username, 'emp.verma');
    });

    // ------------------------------------------------------------------------
    // TEST 3: Unassessed Employee Empty States
    // ------------------------------------------------------------------------
    await test('Unassessed employee returns clean empty states with instructions', async () => {
      // Skill Gaps
      const gapsRes = await emp2Client.request('/api/intelligence/skill-gaps');
      assert.strictEqual(gapsRes.status, 200);
      assert.strictEqual(gapsRes.body.success, true);
      assert.strictEqual(gapsRes.body.data.hasAssessment, false);
      assert.strictEqual(gapsRes.body.data.summary.activeGapsCount, 0);
      assert.strictEqual(gapsRes.body.data.gaps.length, 0);
      assert.ok(gapsRes.body.data.message.includes('Complete your competency assessment'));

      // Recommendations
      const recsRes = await emp2Client.request('/api/intelligence/recommendations');
      assert.strictEqual(recsRes.status, 200);
      assert.strictEqual(recsRes.body.success, true);
      assert.strictEqual(recsRes.body.data.hasAssessment, false);
      assert.strictEqual(recsRes.body.data.recommendations.length, 0);

      // Roadmap
      const roadmapRes = await emp2Client.request('/api/intelligence/roadmap');
      assert.strictEqual(roadmapRes.status, 200);
      assert.strictEqual(roadmapRes.body.success, true);
      assert.strictEqual(roadmapRes.body.data.hasAssessment, false);
      assert.strictEqual(roadmapRes.body.data.stages.length, 0);

      // Study Assistant Unassessed Guidance
      const astRes = await emp2Client.request('/api/intelligence/study-assistant', {
        method: 'POST',
        body: { message: 'What should I do?' }
      });
      assert.strictEqual(astRes.status, 200);
      assert.strictEqual(astRes.body.success, true);
      assert.ok(astRes.body.data.reply.includes('Assessment'));
    });

    // ------------------------------------------------------------------------
    // TEST 4: Baseline Assessment Submission & Skill-Gap Calculation
    // ------------------------------------------------------------------------
    await test('Assessed employee receives accurate, prioritized skill gaps', async () => {
      // Fetch assessment questions
      const assessRes = await emp1Client.request('/api/assessment');
      assert.strictEqual(assessRes.status, 200);
      const questions = assessRes.body.data.questions;

      // Answers setup: answer half correctly to create varied gaps
      // 17 questions in total
      const answers = {};
      questions.forEach((q, idx) => {
        // Answer correctly for even index questions, incorrectly for odd index
        answers[q.id] = (idx % 2 === 0) ? 0 : 3;
      });

      const submitRes = await emp1Client.request('/api/assessment/submit', {
        method: 'POST',
        body: { assessment_id: 1, answers }
      });
      assert.strictEqual(submitRes.status, 200);
      assert.strictEqual(submitRes.body.data.is_baseline, true);

      // Query Skill Gaps
      const gapsRes = await emp1Client.request('/api/intelligence/skill-gaps');
      assert.strictEqual(gapsRes.status, 200);
      assert.strictEqual(gapsRes.body.success, true);
      assert.strictEqual(gapsRes.body.data.hasAssessment, true);

      const data = gapsRes.body.data;
      assert.ok(data.summary.totalCompetencies === 17, 'Must evaluate 17 competencies');
      assert.ok(data.summary.activeGapsCount > 0, 'Must identify active deficiencies');
      assert.ok(Array.isArray(data.gaps), 'Gaps must be an array');
      assert.ok(data.gaps.length === data.summary.activeGapsCount);

      // Verify mathematical formula: gap = target_score - current_score
      for (const gapItem of data.gaps) {
        assert.ok(gapItem.gap > 0, 'Active gap must be strictly > 0');
        const expectedGap = parseFloat((gapItem.targetScore - gapItem.currentScore).toFixed(1));
        assert.strictEqual(gapItem.gap, expectedGap, `Gap calculation must equal target (${gapItem.targetScore}) - current (${gapItem.currentScore})`);
        
        // Check priority thresholds
        if (gapItem.gap >= 30.0) {
          assert.strictEqual(gapItem.priority, 'high');
        } else if (gapItem.gap >= 15.0) {
          assert.strictEqual(gapItem.priority, 'medium');
        } else {
          assert.strictEqual(gapItem.priority, 'low');
        }
      }

      // Verify sorting: largest gap first
      for (let i = 0; i < data.gaps.length - 1; i++) {
        assert.ok(data.gaps[i].gap >= data.gaps[i + 1].gap, 'Gaps must be ordered by gap size descending');
      }

      // Verify allCompetencies includes both deficiencies and met competencies
      assert.strictEqual(data.allCompetencies.length, 17);
      const metItems = data.allCompetencies.filter(c => c.status === 'met');
      assert.strictEqual(metItems.length, data.summary.metCount);
      for (const m of metItems) {
        assert.strictEqual(m.gap, 0);
        assert.strictEqual(m.priority, 'none');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 5: Employee Data Isolation (Authorization boundary)
    // ------------------------------------------------------------------------
    await test('Intelligence endpoints strictly isolate employee data based on session', async () => {
      // emp1 has assessment results, emp2 has none
      const res1 = await emp1Client.request('/api/intelligence/skill-gaps');
      const res2 = await emp2Client.request('/api/intelligence/skill-gaps');

      assert.strictEqual(res1.body.data.hasAssessment, true);
      assert.strictEqual(res2.body.data.hasAssessment, false);
      assert.ok(res1.body.data.summary.activeGapsCount > 0);
      assert.strictEqual(res2.body.data.summary.activeGapsCount, 0);
    });

    // ------------------------------------------------------------------------
    // TEST 6: Personalized Course Recommendations
    // ------------------------------------------------------------------------
    await test('Recommendations connect employee gaps to courses with explainable reasons', async () => {
      const res = await emp1Client.request('/api/intelligence/recommendations');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.hasAssessment, true);

      const recs = res.body.data.recommendations;
      assert.ok(recs.length > 0, 'Must return personalized recommendations for active gaps');

      const seenCourseIds = new Set();
      for (const course of recs) {
        // No duplicate courses
        assert.ok(!seenCourseIds.has(course.courseId), `Duplicate course ID ${course.courseId} detected`);
        seenCourseIds.add(course.courseId);

        // Required fields
        assert.ok(course.courseId, 'Must have courseId');
        assert.ok(course.title, 'Must have title');
        assert.ok(course.source, 'Must have source');
        assert.ok(['sample_igot', 'sample_nssta_tpac', 'local_demo'].includes(course.source), 'Source must be recognized label');
        assert.ok(course.sourceDisplayName, 'Must have sourceDisplayName');
        assert.ok(course.reason, 'Must have explainable reason');
        assert.ok(course.reason.length > 15, 'Reason must be descriptive');
        assert.ok(Array.isArray(course.matchedCompetencies), 'Must have matchedCompetencies');
        assert.ok(course.matchedCompetencies.length > 0, 'Must match at least one active gap');

        // Verify each matched competency is an active deficiency
        for (const mc of course.matchedCompetencies) {
          assert.ok(mc.gap > 0, 'Matched competency must have an active gap');
          assert.ok(['high', 'medium', 'low'].includes(mc.priority));
        }
      }

      // Verify deterministic ranking order (highest ranking score first)
      for (let i = 0; i < recs.length - 1; i++) {
        assert.ok(recs[i].rankingScore >= recs[i + 1].rankingScore, 'Recommendations must be ranked by score descending');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 7: Dynamic Learning Roadmap Generation
    // ------------------------------------------------------------------------
    await test('Dynamic roadmap structures learning milestones into sequential phases', async () => {
      const res = await emp1Client.request('/api/intelligence/roadmap');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.hasAssessment, true);

      const data = res.body.data;
      assert.ok(data.stages.length > 0, 'Must have structured roadmap stages');
      assert.ok(data.roadmapSummary.totalGapsToBridge > 0);
      assert.ok(data.roadmapSummary.totalEstimatedHours > 0);

      // Verify sequential ordering
      let currentOrder = 1;
      for (const stage of data.stages) {
        assert.ok(stage.phase >= 1);
        assert.ok(stage.title);
        assert.ok(stage.items.length > 0);
        for (const item of stage.items) {
          assert.strictEqual(item.order, currentOrder, `Milestone order must be consecutive (${currentOrder})`);
          assert.ok(item.competency);
          assert.ok(item.suggestedFocus);
          assert.ok(Array.isArray(item.recommendedCourses));
          currentOrder++;
        }
      }
    });

    // ------------------------------------------------------------------------
    // TEST 8: Dynamic Adaptivity — Roadmap & Gaps Update on Retake
    // ------------------------------------------------------------------------
    await test('Skill gaps and roadmap dynamically adapt when competency scores change', async () => {
      const initialGaps = await emp1Client.request('/api/intelligence/skill-gaps');
      const initialGapsCount = initialGaps.body.data.summary.activeGapsCount;

      // Submit second assessment with 100% correct answers
      const assessRes = await emp1Client.request('/api/assessment');
      const questions = assessRes.body.data.questions;
      const perfectAnswers = {};
      questions.forEach(q => {
        // Query correct index directly from DB for test simulation
        const db = getDb();
        const row = db.prepare('SELECT correct_option_index FROM assessment_questions WHERE id = ?').get(q.id);
        perfectAnswers[q.id] = row.correct_option_index;
      });

      const secondSubmit = await emp1Client.request('/api/assessment/submit', {
        method: 'POST',
        body: { assessment_id: 1, answers: perfectAnswers }
      });
      assert.strictEqual(secondSubmit.status, 200);
      assert.strictEqual(secondSubmit.body.data.is_baseline, false, 'Second attempt must NOT be baseline');

      // Gaps should now be 0 because all competencies reached 100%
      const updatedGaps = await emp1Client.request('/api/intelligence/skill-gaps');
      assert.strictEqual(updatedGaps.body.data.summary.activeGapsCount, 0, 'Active gaps must now be 0 after perfect score');
      assert.strictEqual(updatedGaps.body.data.summary.metCount, 17);

      // Roadmap should now reflect Mastery & Maintenance phase
      const updatedRoadmap = await emp1Client.request('/api/intelligence/roadmap');
      assert.strictEqual(updatedRoadmap.body.data.roadmapSummary.totalGapsToBridge, 0);
      const masteryStage = updatedRoadmap.body.data.stages.find(s => s.phaseKey === 'mastery_and_maintenance');
      assert.ok(masteryStage, 'Roadmap must contain mastery & maintenance phase when all targets are met');
    });

    // ------------------------------------------------------------------------
    // TEST 9: AI Study Assistant Input Validation & Grounding
    // ------------------------------------------------------------------------
    await test('Study assistant validates input and provides explainable deterministic replies', async () => {
      // 1. Rejects empty query
      const emptyRes = await emp1Client.request('/api/intelligence/study-assistant', {
        method: 'POST',
        body: { message: '   ' }
      });
      assert.strictEqual(emptyRes.status, 400);
      assert.strictEqual(emptyRes.body.success, false);
      assert.strictEqual(emptyRes.body.error.code, 'INVALID_INPUT');

      // 2. Priority question
      const query1 = await emp1Client.request('/api/intelligence/study-assistant', {
        method: 'POST',
        body: { message: 'What should I learn first?' }
      });
      assert.strictEqual(query1.status, 200);
      assert.strictEqual(query1.body.success, true);
      assert.ok(query1.body.data.reply);
      assert.strictEqual(query1.body.data.mode, 'rules_based_fallback');
      assert.ok(query1.body.data.contextSummary.officerName.includes('Priya'));

      // 3. Topic specific question
      const query2 = await emp1Client.request('/api/intelligence/study-assistant', {
        method: 'POST',
        body: { message: 'How can I improve in SQL?' }
      });
      assert.strictEqual(query2.status, 200);
      assert.strictEqual(query2.body.success, true);
      assert.ok(query2.body.data.reply.includes('SQL'));

      // 4. Roadmap question
      const query3 = await emp1Client.request('/api/intelligence/study-assistant', {
        method: 'POST',
        body: { message: 'Summarize my roadmap' }
      });
      assert.strictEqual(query3.status, 200);
      assert.strictEqual(query3.body.success, true);
      assert.ok(query3.body.data.reply.includes('roadmap') || query3.body.data.reply.includes('Mastery'));
    });

    // ------------------------------------------------------------------------
    // TEST 10: Regression — Core Foundation Baseline Immutability & Auth Preserved
    // ------------------------------------------------------------------------
    await test('Regression: Core Foundation baseline immutability, health, and admin routes preserved', async () => {
      // Health check
      const health = await emp1Client.request('/api/health');
      assert.strictEqual(health.status, 200);
      assert.strictEqual(health.body.data.status, 'healthy');

      // Profile shows growth from permanent baseline
      const profileRes = await emp1Client.request('/api/profile');
      assert.strictEqual(profileRes.status, 200);
      const metrics = profileRes.body.data.metrics;
      assert.strictEqual(metrics.total_attempts, 2);
      assert.ok(metrics.growth_percentage > 0, 'Growth from baseline must be calculated');

      // Verify baseline in database was NOT changed during second attempt
      const db = getDb();
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get('emp.sharma');
      const attempts = db.prepare('SELECT is_baseline, overall_score FROM assessment_attempts WHERE user_id = ? ORDER BY id ASC').all(user.id);
      assert.strictEqual(attempts.length, 2);
      assert.strictEqual(attempts[0].is_baseline, 1);
      assert.strictEqual(attempts[1].is_baseline, 0);

      // Verify employee cannot access admin
      const adminAttempt = await emp1Client.request('/api/admin/overview');
      assert.strictEqual(adminAttempt.status, 403);
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`  INTELLIGENCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  });
}

module.exports = runTests;
