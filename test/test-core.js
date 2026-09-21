/**
 * NAVBODH - Core Foundation Automated Verification Test Suite
 * 
 * Verifies all Stage 1 Core requirements:
 * 1. Health Endpoint & Database Connectivity
 * 2. Departments & Competency Framework (4 domains, 17 competencies)
 * 3. Demo Authentication & Password Verification (Bcrypt)
 * 4. Server-Side Session Handling (HttpOnly cookies)
 * 5. Role-Based Authorization Boundary (Employee vs Admin)
 * 6. Profile Retrieval & Patch Validation
 * 7. Assessment Engine & Anti-Cheating (No answer leaks)
 * 8. Baseline Creation & Growth Persistence (Baseline immutability rule)
 * 9. SQLite Persistence Across Database Reloads
 * 10. Error Handling & Standard API Contract
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const http = require('http');

// Set dedicated test database path
const TEST_DB_PATH = path.join(__dirname, 'navbodh-test.sqlite');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.DB_PATH = TEST_DB_PATH;

const app = require('../server');
const { getDb, initDatabase } = require('../db');
const { seedDatabase } = require('../seed');

const PORT = 3999;
let server;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Custom fetch with cookie jar support
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
      // Extract session cookie
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
  console.log('  STARTING NAVBODH CORE FOUNDATION TEST SUITE');
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
      console.error(`  Error: ${err.message}`);
      if (err.actual !== undefined && err.expected !== undefined) {
        console.error(`  Expected:`, err.expected, `\n  Actual:`, err.actual);
      }
      failed++;
    }
  }

  // Start temporary server for testing
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Health Check Endpoint
    // ------------------------------------------------------------------------
    await test('GET /api/health returns 200 with standard response contract', async () => {
      const client = new TestClient();
      const res = await client.request('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'healthy');
      assert.strictEqual(res.body.data.database, 'connected');
      assert.ok(typeof res.body.data.uptime === 'number');
    });

    // ------------------------------------------------------------------------
    // TEST 2: Departments Listing
    // ------------------------------------------------------------------------
    await test('GET /api/departments returns official divisions', async () => {
      const client = new TestClient();
      const res = await client.request('/api/departments');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.departments));
      assert.ok(res.body.data.departments.length >= 5);
      const codes = res.body.data.departments.map(d => d.code);
      assert.ok(codes.includes('NAD'));
      assert.ok(codes.includes('SDRD'));
      assert.ok(codes.includes('NSSTA'));
    });

    // ------------------------------------------------------------------------
    // TEST 3: Competency Framework (4 Domains, 17 Competencies)
    // ------------------------------------------------------------------------
    await test('GET /api/competencies returns 17 competencies categorized into 4 domains', async () => {
      const client = new TestClient();
      const res = await client.request('/api/competencies');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.total_competencies, 17);

      const domains = res.body.data.domains;
      assert.ok(domains['Statistical'], 'Missing Statistical domain');
      assert.ok(domains['Technical'], 'Missing Technical domain');
      assert.ok(domains['Digital Governance'], 'Missing Digital Governance domain');
      assert.ok(domains['Behavioural / Managerial'], 'Missing Behavioural / Managerial domain');

      assert.strictEqual(domains['Statistical'].length, 5);
      assert.strictEqual(domains['Technical'].length, 5);
      assert.strictEqual(domains['Digital Governance'].length, 3);
      assert.strictEqual(domains['Behavioural / Managerial'].length, 4);
    });

    // ------------------------------------------------------------------------
    // TEST 4: Authentication - Invalid Credentials & Error Format
    // ------------------------------------------------------------------------
    await test('POST /api/auth/login rejects invalid credentials with standard error format', async () => {
      const client = new TestClient();
      
      // Missing fields
      const res1 = await client.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.sharma' }
      });
      assert.strictEqual(res1.status, 400);
      assert.strictEqual(res1.body.success, false);
      assert.strictEqual(res1.body.error.code, 'MISSING_FIELD');

      // Wrong password
      const res2 = await client.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.sharma', password: 'WrongPassword!' }
      });
      assert.strictEqual(res2.status, 401);
      assert.strictEqual(res2.body.success, false);
      assert.strictEqual(res2.body.error.code, 'INVALID_CREDENTIALS');
    });

    // ------------------------------------------------------------------------
    // TEST 5: Authentication - Valid Employee Login & Session Cookie
    // ------------------------------------------------------------------------
    const empClient = new TestClient();
    await test('POST /api/auth/login logs in employee and issues HttpOnly session cookie', async () => {
      const res = await empClient.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.sharma', password: 'Password123!' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.username, 'emp.sharma');
      assert.strictEqual(res.body.data.user.role, 'employee');
      assert.ok(empClient.cookie, 'Session cookie should have been set');
    });

    // ------------------------------------------------------------------------
    // TEST 6: Session Verification - GET /api/auth/me
    // ------------------------------------------------------------------------
    await test('GET /api/auth/me returns authenticated employee profile', async () => {
      const res = await empClient.request('/api/auth/me');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.username, 'emp.sharma');
      assert.strictEqual(res.body.data.user.full_name, 'Priya Sharma');
    });

    // ------------------------------------------------------------------------
    // TEST 7: Role Authorization - Employee accessing Admin API is Forbidden
    // ------------------------------------------------------------------------
    await test('Employee cannot access Admin endpoints (HTTP 403 Forbidden)', async () => {
      const res = await empClient.request('/api/admin/overview');
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    // ------------------------------------------------------------------------
    // TEST 8: Admin Authentication & Access to Admin API
    // ------------------------------------------------------------------------
    const adminClient = new TestClient();
    await test('POST /api/auth/login logs in admin and allows access to /api/admin/overview', async () => {
      const loginRes = await adminClient.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'admin.navbodh', password: 'AdminPass123!' }
      });
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginRes.body.data.user.role, 'admin');

      const overviewRes = await adminClient.request('/api/admin/overview');
      assert.strictEqual(overviewRes.status, 200);
      assert.strictEqual(overviewRes.body.success, true);
      assert.strictEqual(overviewRes.body.data.summary.total_admins, 1);
      assert.strictEqual(overviewRes.body.data.summary.total_competencies, 17);
    });

    // ------------------------------------------------------------------------
    // TEST 9: Profile Retrieval & Modification
    // ------------------------------------------------------------------------
    await test('GET /api/profile and PATCH /api/profile update employee profile safely', async () => {
      const getRes = await empClient.request('/api/profile');
      assert.strictEqual(getRes.status, 200);
      assert.strictEqual(getRes.body.data.profile.username, 'emp.sharma');

      // Update phone and bio
      const patchRes = await empClient.request('/api/profile', {
        method: 'PATCH',
        body: {
          phone: '+91-98765-43210',
          bio: 'Senior Official in National Accounts with focus on GDP compilation and SAM.'
        }
      });
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchRes.body.success, true);
      assert.strictEqual(patchRes.body.data.user.phone, '+91-98765-43210');
      assert.strictEqual(patchRes.body.data.user.bio, 'Senior Official in National Accounts with focus on GDP compilation and SAM.');

      // Reject invalid department
      const invalidPatch = await empClient.request('/api/profile', {
        method: 'PATCH',
        body: { department_id: 99999 }
      });
      assert.strictEqual(invalidPatch.status, 400);
      assert.strictEqual(invalidPatch.body.error.code, 'INVALID_DEPARTMENT');
    });

    // ------------------------------------------------------------------------
    // TEST 10: Assessment Anti-Cheating (No Correct Answers Exposed)
    // ------------------------------------------------------------------------
    let assessmentId = null;
    let questionsList = [];
    await test('GET /api/assessment returns questions WITHOUT exposing correct answers', async () => {
      const res = await empClient.request('/api/assessment');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.questions.length, 17);

      assessmentId = res.body.data.assessment.id;
      questionsList = res.body.data.questions;

      for (const q of questionsList) {
        assert.strictEqual(q.correct_option_index, undefined, 'CRITICAL: correct_option_index must NOT be exposed');
        assert.strictEqual(q.explanation, undefined, 'CRITICAL: explanation must NOT be exposed before submission');
        assert.ok(Array.isArray(q.options), 'Options must be an array');
        assert.strictEqual(q.options.length, 4, 'Must have 4 options');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 11: Assessment Submission & Baseline Creation (First Attempt)
    // ------------------------------------------------------------------------
    await test('POST /api/assessment/submit evaluates answers and creates permanent baseline', async () => {
      // Prepare answer map: answer some correctly, some incorrectly to verify scoring
      // In seed.js:
      // Q1 (STAT_SURVEY_DESIGN): opt 1
      // Q2 (STAT_SAMPLING): opt 2
      // Q3 (STAT_NAT_ACCOUNTS): opt 0
      // Q4 (STAT_SDG_INDICATORS): opt 1
      // Q5 (STAT_DATA_QUALITY): opt 1
      // Q6 (TECH_PYTHON): opt 1
      // Q7 (TECH_SQL): opt 1
      // Q8 (TECH_DATA_VIZ): opt 0
      // Q9 (TECH_AI_ML): opt 0
      // Q10 (TECH_APIS): opt 1
      // Q11 (GOV_CYBERSECURITY): opt 2
      // Q12 (GOV_DATA_PRIVACY): opt 1
      // Q13 (GOV_CLOUD): opt 1
      // Q14 (BEH_LEADERSHIP): opt 1
      // Q15 (BEH_COMMUNICATION): opt 1
      // Q16 (BEH_PROJECT_MGMT): opt 0
      // Q17 (BEH_ETHICS): opt 1

      // Let's answer 12 out of 17 correctly
      const correctAnswers = {
        1: 1, 2: 2, 3: 0, 4: 1, 5: 1,
        6: 1, 7: 1, 8: 0, 9: 0, 10: 1,
        11: 2, 12: 1, 13: 1, 14: 1, 15: 1, 16: 0, 17: 1
      };

      const testAnswers = {};
      questionsList.forEach((q, idx) => {
        if (idx < 12) {
          testAnswers[q.id] = correctAnswers[q.id];
        } else {
          // Intentional wrong answer
          testAnswers[q.id] = (correctAnswers[q.id] + 1) % 4;
        }
      });

      const submitRes = await empClient.request('/api/assessment/submit', {
        method: 'POST',
        body: {
          assessment_id: assessmentId,
          answers: testAnswers
        }
      });

      assert.strictEqual(submitRes.status, 200);
      assert.strictEqual(submitRes.body.success, true);
      assert.strictEqual(submitRes.body.data.is_baseline, true, 'First attempt must be marked as baseline');
      assert.strictEqual(submitRes.body.data.attempt_number, 1);
      assert.strictEqual(submitRes.body.data.total_correct, 12);
      assert.strictEqual(submitRes.body.data.total_questions, 17);
      
      const expectedScore = parseFloat(((12 / 17) * 100).toFixed(1));
      assert.strictEqual(submitRes.body.data.overall_score, expectedScore);

      // Verify baseline scores are stored in employee_competencies
      const db = getDb();
      const empComps = db.prepare('SELECT * FROM employee_competencies WHERE user_id = ?').all(submitRes.body.data.user_id || 1);
      assert.strictEqual(empComps.length, 17);
      
      for (const ec of empComps) {
        assert.strictEqual(ec.baseline_score, ec.current_score, 'Baseline and current score must match on baseline attempt');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 12: Baseline Immutability Rule on Subsequent Assessment
    // ------------------------------------------------------------------------
    await test('Second assessment updates current score while preserving permanent baseline', async () => {
      const db = getDb();
      // Record initial baseline scores
      const initialComps = db.prepare('SELECT competency_id, baseline_score, current_score FROM employee_competencies WHERE user_id = 1').all();
      const initialBaselineMap = {};
      initialComps.forEach(c => { initialBaselineMap[c.competency_id] = c.baseline_score; });

      // Submit a second attempt with 17/17 correct answers
      const allCorrectAnswers = {
        1: 1, 2: 2, 3: 0, 4: 1, 5: 1,
        6: 1, 7: 1, 8: 0, 9: 0, 10: 1,
        11: 2, 12: 1, 13: 1, 14: 1, 15: 1, 16: 0, 17: 1
      };

      const submitRes2 = await empClient.request('/api/assessment/submit', {
        method: 'POST',
        body: {
          assessment_id: assessmentId,
          answers: allCorrectAnswers
        }
      });

      assert.strictEqual(submitRes2.status, 200);
      assert.strictEqual(submitRes2.body.data.is_baseline, false, 'Second attempt must NOT be marked as baseline');
      assert.strictEqual(submitRes2.body.data.attempt_number, 2);
      assert.strictEqual(submitRes2.body.data.overall_score, 100.0);

      // CRITICAL CHECK: Verify baseline scores in DB did NOT change!
      const updatedComps = db.prepare('SELECT competency_id, baseline_score, current_score FROM employee_competencies WHERE user_id = 1').all();
      for (const uc of updatedComps) {
        assert.strictEqual(
          uc.baseline_score,
          initialBaselineMap[uc.competency_id],
          `CRITICAL RULE VIOLATION: Baseline score for competency ${uc.competency_id} was overwritten!`
        );
        assert.strictEqual(uc.current_score, 100.0, 'Current score should have updated to 100.0');
      }
    });

    // ------------------------------------------------------------------------
    // TEST 13: Assessment Result Retrieval & Question Review
    // ------------------------------------------------------------------------
    await test('GET /api/assessment/result returns latest result with complete review', async () => {
      const res = await empClient.request('/api/assessment/result');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.has_result, true);
      assert.strictEqual(res.body.data.attempt_number, 2);
      assert.strictEqual(res.body.data.overall_score, 100.0);
      assert.strictEqual(res.body.data.question_review.length, 17);
      assert.strictEqual(res.body.data.competencies.length, 17);
    });

    // ------------------------------------------------------------------------
    // TEST 14: Profile Growth Metric Calculation
    // ------------------------------------------------------------------------
    await test('GET /api/profile reflects growth percentage from baseline', async () => {
      const res = await empClient.request('/api/profile');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.has_baseline, true);
      assert.strictEqual(res.body.data.metrics.average_current_score, 100.0);
      assert.ok(res.body.data.metrics.growth_percentage > 0, 'Growth percentage should be positive');
    });

    // ------------------------------------------------------------------------
    // TEST 15: Logout & Session Invalidation
    // ------------------------------------------------------------------------
    await test('POST /api/auth/logout invalidates session and destroys cookie', async () => {
      const logoutRes = await empClient.request('/api/auth/logout', { method: 'POST' });
      assert.strictEqual(logoutRes.status, 200);

      // Attempt accessing protected endpoint
      const meRes = await empClient.request('/api/auth/me');
      assert.strictEqual(meRes.status, 401);
      assert.strictEqual(meRes.body.error.code, 'UNAUTHORIZED');
    });

    // ------------------------------------------------------------------------
    // TEST 16: Safe Scaffolding for Future Contributors
    // ------------------------------------------------------------------------
    await test('Future module routes return 501 MODULE_UNDER_DEVELOPMENT placeholders', async () => {
      const client = new TestClient();
      await client.request('/api/auth/login', {
        method: 'POST',
        body: { identifier: 'emp.sharma', password: 'Password123!' }
      });

      // Intelligence (Rucha)
      const intelRes = await client.request('/api/intelligence/skill-gaps');
      assert.strictEqual(intelRes.status, 501);
      assert.strictEqual(intelRes.body.error.code, 'MODULE_UNDER_DEVELOPMENT');

      // Learning (Pathika)
      const learnRes = await client.request('/api/learning/courses');
      assert.strictEqual(learnRes.status, 200); // course listing foundation exists
      const enrollRes = await client.request('/api/learning/courses/1/enroll', { method: 'POST' });
      assert.strictEqual(enrollRes.status, 501);

      // Gamification (Pallav)
      const gamRes = await client.request('/api/gamification/leaderboard');
      assert.strictEqual(gamRes.status, 501);
    });

    // ------------------------------------------------------------------------
    // TEST 17: SQLite Data Persistence Across Process/Connection Restart
    // ------------------------------------------------------------------------
    await test('SQLite data persists intact when database connection is re-opened', async () => {
      const Database = require('better-sqlite3');
      const freshDb = new Database(TEST_DB_PATH);
      
      const user = freshDb.prepare('SELECT id, username, full_name, phone FROM users WHERE username = ?').get('emp.sharma');
      assert.ok(user, 'User must exist in SQLite file');
      assert.strictEqual(user.phone, '+91-98765-43210', 'Modified phone number must persist');

      const attempts = freshDb.prepare('SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?').get(user.id);
      assert.strictEqual(attempts.count, 2, 'Two assessment attempts must persist');

      const baselineCheck = freshDb.prepare('SELECT COUNT(*) as count FROM employee_competencies WHERE user_id = ? AND baseline_score > 0').get(user.id);
      assert.ok(baselineCheck.count > 0, 'Baseline scores must persist in SQLite');

      freshDb.close();
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
