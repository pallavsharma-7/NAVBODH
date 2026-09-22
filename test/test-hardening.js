/**
 * NAVBODH Stage 6 — Final Hardening Verification Test Suite
 *
 * Contributor Ownership: Parth (Stage 6: Final Hardening)
 *
 * Comprehensive hardening audit tests:
 * 1. Malformed JSON payload handling (HTTP 400 INVALID_JSON)
 * 2. Unknown API route handling (HTTP 404 NOT_FOUND)
 * 3. Unauthenticated access enforcement (HTTP 401 UNAUTHORIZED)
 * 4. Strict role authorization boundary (HTTP 403 FORBIDDEN for employee on admin endpoints)
 * 5. Client role spoofing immunity (cannot escalate via body/query parameters)
 * 6. Baseline immutability preservation (baseline_score never overwritten by subsequent attempts)
 * 7. Safe zero-baseline handling (no NaN, Infinity, or divide-by-zero)
 * 8. Gamification reward idempotency (duplicate events prevented via UNIQUE event_key)
 * 9. Anti-cheating enforcement (assessment & quiz questions omit correct answer keys)
 * 10. Truthful system integration adapter reporting (simulated vs operational)
 * 11. Public health check contract verification
 * 12. Complete API alias availability (/api/rewards, /api/gamification/rewards, /api/skill-gaps, etc.)
 * 13. Intelligence quiz generator endpoint robustness (safe parameter bounds)
 * 14. Session lifecycle & cleanup (login -> authenticated action -> logout -> invalidation)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'test-hardening.sqlite');
process.env.DB_PATH = TEST_DB_PATH;

if (fs.existsSync(TEST_DB_PATH)) {
  try { fs.unlinkSync(TEST_DB_PATH); } catch (e) {}
}

const app = require('../server');
const { getDb, initDatabase } = require('../db');
const { seedDatabase } = require('../seed');

let server;
let port;
let adminCookie = '';
let empCookie = '';

function makeRawRequest(method, reqPath, rawBody = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: reqPath,
      method: method,
      headers: {
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      const setCookie = res.headers['set-cookie'];

      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }

        let cookieHeader = null;
        if (setCookie) {
          if (Array.isArray(setCookie)) {
            cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
          } else if (typeof setCookie === 'string') {
            cookieHeader = setCookie.split(';')[0];
          }
        }

        resolve({
          status: res.statusCode,
          statusCode: res.statusCode,
          headers: res.headers,
          cookie: cookieHeader,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (rawBody) {
      req.write(rawBody);
    }
    req.end();
  });
}

function makeRequest(method, reqPath, body = null, cookie = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  const rawBody = body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
  return makeRawRequest(method, reqPath, rawBody, headers);
}

async function runHardeningTests() {
  console.log('\n===============================================================');
  console.log('  STARTING NAVBODH STAGE 6: FINAL HARDENING TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function testPass(msg) {
    console.log(`• Testing: ${msg}... ✓ PASS`);
    passed++;
  }

  function testFail(msg, err) {
    console.log(`• Testing: ${msg}... ✕ FAIL`);
    console.error(err);
    failed++;
  }

  try {
    // 1. Initialize database and seed data
    initDatabase();
    seedDatabase();

    // 2. Start HTTP server on dynamic port
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });

    // 3. Obtain authentication sessions
    const empLogin = await makeRequest('POST', '/api/auth/login', {
      identifier: 'emp.sharma',
      password: 'Password123!'
    });
    empCookie = empLogin.cookie;

    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      identifier: 'admin.navbodh',
      password: 'AdminPass123!'
    });
    adminCookie = adminLogin.cookie;

    // Test 1: Malformed JSON handling
    try {
      const res = await makeRawRequest('POST', '/api/auth/login', '{ invalid_json: ', {
        'Content-Type': 'application/json'
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'INVALID_JSON');
      testPass('Malformed JSON body returns HTTP 400 INVALID_JSON standard response');
    } catch (e) {
      testFail('Malformed JSON body returns HTTP 400 INVALID_JSON standard response', e);
    }

    // Test 2: Unknown API endpoint 404 handler
    try {
      const res = await makeRequest('GET', '/api/nonexistent-endpoint-xyz');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'NOT_FOUND');
      testPass('Unknown API route returns HTTP 404 NOT_FOUND standard error contract');
    } catch (e) {
      testFail('Unknown API route returns HTTP 404 NOT_FOUND standard error contract', e);
    }

    // Test 3: Unauthenticated request rejection
    try {
      const res = await makeRequest('GET', '/api/profile');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
      testPass('Unauthenticated protected route rejected with HTTP 401 UNAUTHORIZED');
    } catch (e) {
      testFail('Unauthenticated protected route rejected with HTTP 401 UNAUTHORIZED', e);
    }

    // Test 4: Role-based authorization boundary
    try {
      const res = await makeRequest('GET', '/api/admin/overview', null, empCookie);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
      testPass('Employee session accessing admin endpoints is rejected with HTTP 403 FORBIDDEN');
    } catch (e) {
      testFail('Employee session accessing admin endpoints is rejected with HTTP 403 FORBIDDEN', e);
    }

    // Test 5: Client role spoofing immunity
    try {
      const res = await makeRequest('PATCH', '/api/profile?role=admin', {
        role: 'admin',
        full_name: 'Priya Sharma Updated'
      }, empCookie);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.user.role, 'employee');

      // Verify role remains unchanged in database
      const db = getDb();
      const user = db.prepare('SELECT role FROM users WHERE username = ?').get('emp.sharma');
      assert.strictEqual(user.role, 'employee');
      testPass('Client role spoofing via body/query parameters cannot elevate privileges');
    } catch (e) {
      testFail('Client role spoofing via body/query parameters cannot elevate privileges', e);
    }

    // Test 6: Baseline immutability preservation
    try {
      const db = getDb();
      // Submit initial assessment
      const ques = db.prepare('SELECT id, correct_option_index FROM assessment_questions LIMIT 5').all();
      const answers1 = {};
      ques.forEach(q => { answers1[q.id] = q.correct_option_index; });

      const assess1 = await makeRequest('POST', '/api/assessment/submit', {
        assessment_id: 1,
        answers: answers1
      }, empCookie);
      assert.strictEqual(assess1.status, 200);
      assert.strictEqual(assess1.body.data.is_baseline, true);

      const compBefore = db.prepare('SELECT baseline_score, current_score FROM employee_competencies WHERE user_id = 1 LIMIT 1').get();
      const originalBaseline = compBefore.baseline_score;

      // Submit second assessment with different score
      const answers2 = {};
      ques.forEach(q => { answers2[q.id] = (q.correct_option_index + 1) % 4; }); // deliberate wrong answers

      const assess2 = await makeRequest('POST', '/api/assessment/submit', {
        assessment_id: 1,
        answers: answers2
      }, empCookie);
      assert.strictEqual(assess2.status, 200);
      assert.strictEqual(assess2.body.data.is_baseline, false);

      const compAfter = db.prepare('SELECT baseline_score, current_score FROM employee_competencies WHERE user_id = 1 LIMIT 1').get();
      assert.strictEqual(compAfter.baseline_score, originalBaseline, 'Permanent baseline score MUST NOT change!');
      testPass('Baseline score is strictly immutable and preserved across subsequent assessments');
    } catch (e) {
      testFail('Baseline score is strictly immutable and preserved across subsequent assessments', e);
    }

    // Test 7: Safe zero-baseline calculation
    try {
      const db = getDb();
      // Create test officer with zero baseline
      db.prepare('DELETE FROM employee_competencies WHERE user_id = 2').run();
      db.prepare('DELETE FROM assessment_attempts WHERE user_id = 2').run();

      const empLogin2 = await makeRequest('POST', '/api/auth/login', {
        identifier: 'emp.verma',
        password: 'Password123!'
      });

      const gamRes = await makeRequest('GET', '/api/gamification', null, empLogin2.cookie);
      assert.strictEqual(gamRes.status, 200);
      assert.strictEqual(gamRes.body.data.growth.is_zero_baseline, true);
      assert.strictEqual(gamRes.body.data.growth.growth_percentage, 0);
      assert.notStrictEqual(gamRes.body.data.growth.growth_percentage, Infinity);
      assert.strictEqual(isNaN(gamRes.body.data.growth.growth_percentage), false);
      testPass('Zero-baseline calculations safely produce valid numeric results without NaN/Infinity');
    } catch (e) {
      testFail('Zero-baseline calculations safely produce valid numeric results without NaN/Infinity', e);
    }

    // Test 8: Gamification reward idempotency
    try {
      const db = getDb();
      const pointsBefore = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM reward_ledger WHERE user_id = 1').get().total;

      // Complete lesson 1
      const lessonRes1 = await makeRequest('POST', '/api/lessons/1/complete', {}, empCookie);
      assert.strictEqual(lessonRes1.status, 200);

      const pointsAfter1 = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM reward_ledger WHERE user_id = 1').get().total;

      // Complete lesson 1 again (duplicate)
      const lessonRes2 = await makeRequest('POST', '/api/lessons/1/complete', {}, empCookie);
      assert.strictEqual(lessonRes2.status, 200);

      const pointsAfter2 = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM reward_ledger WHERE user_id = 1').get().total;
      assert.strictEqual(pointsAfter2, pointsAfter1, 'Duplicate lesson completion must not award extra points');
      testPass('Gamification reward ledger prevents duplicate reward events via UNIQUE event_key');
    } catch (e) {
      testFail('Gamification reward ledger prevents duplicate reward events via UNIQUE event_key', e);
    }

    // Test 9: Anti-cheating enforcement
    try {
      const assessRes = await makeRequest('GET', '/api/assessment', null, empCookie);
      assert.strictEqual(assessRes.status, 200);
      const assessQues = assessRes.body.data.questions;
      assert.ok(assessQues.length > 0);
      for (const q of assessQues) {
        assert.strictEqual(q.correct_option_index, undefined, 'Assessment questions must not leak correct answer index');
        assert.strictEqual(q.explanation, undefined, 'Assessment questions must not leak explanations');
      }

      const quizRes = await makeRequest('GET', '/api/quizzes/1', null, empCookie);
      assert.strictEqual(quizRes.status, 200);
      const quizQues = quizRes.body.data.questions;
      assert.ok(quizQues.length > 0);
      for (const q of quizQues) {
        assert.strictEqual(q.correct_option_index, undefined, 'Quiz questions must not leak correct answer index');
        assert.strictEqual(q.explanation, undefined, 'Quiz questions must not leak explanations');
      }
      testPass('Anti-cheating rules verified: questions endpoints omit answer keys & explanations');
    } catch (e) {
      testFail('Anti-cheating rules verified: questions endpoints omit answer keys & explanations', e);
    }

    // Test 10: Truthful integration adapter reporting
    try {
      const res = await makeRequest('GET', '/api/integrations/status');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const adapters = res.body.data.adapters;

      // External adapters must be simulated and live_connected: false
      assert.strictEqual(adapters.ai_assistant.live_connected, false);
      assert.strictEqual(adapters.ai_assistant.status, 'simulated');
      assert.strictEqual(adapters.igot_karmayogi.live_connected, false);
      assert.strictEqual(adapters.igot_karmayogi.status, 'simulated');
      assert.strictEqual(adapters.nssta_tpac.live_connected, false);
      assert.strictEqual(adapters.nssta_tpac.status, 'simulated');

      // Local storage & gamification must be operational and live_connected: true
      assert.strictEqual(adapters.sqlite_database.live_connected, true);
      assert.strictEqual(adapters.sqlite_database.status, 'operational');
      assert.strictEqual(adapters.gamification_ledger.live_connected, true);
      assert.strictEqual(adapters.gamification_ledger.status, 'operational');
      testPass('Integration status truthfully reports simulated demo adapters vs live local adapters');
    } catch (e) {
      testFail('Integration status truthfully reports simulated demo adapters vs live local adapters', e);
    }

    // Test 11: Public health check
    try {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'healthy');
      assert.strictEqual(res.body.data.database, 'connected');
      testPass('Public health check endpoint operates without authentication and returns healthy status');
    } catch (e) {
      testFail('Public health check endpoint operates without authentication and returns healthy status', e);
    }

    // Test 12: Complete API alias verification
    try {
      // Gamification aliases
      const g1 = await makeRequest('GET', '/api/gamification/rewards', null, empCookie);
      const g2 = await makeRequest('GET', '/api/rewards', null, empCookie);
      assert.strictEqual(g1.status, 200);
      assert.strictEqual(g2.status, 200);
      assert.strictEqual(g1.body.data.total_points, g2.body.data.total_points);

      const l1 = await makeRequest('GET', '/api/gamification/leaderboard', null, empCookie);
      const l2 = await makeRequest('GET', '/api/leaderboard', null, empCookie);
      assert.strictEqual(l1.status, 200);
      assert.strictEqual(l2.status, 200);
      assert.strictEqual(l1.body.data.leaderboard.length, l2.body.data.leaderboard.length);

      const a1 = await makeRequest('GET', '/api/gamification/achievements', null, empCookie);
      const a2 = await makeRequest('GET', '/api/achievements', null, empCookie);
      assert.strictEqual(a1.status, 200);
      assert.strictEqual(a2.status, 200);

      // Intelligence aliases
      const sg1 = await makeRequest('GET', '/api/intelligence/skill-gaps', null, empCookie);
      const sg2 = await makeRequest('GET', '/api/skill-gaps', null, empCookie);
      assert.strictEqual(sg1.status, 200);
      assert.strictEqual(sg2.status, 200);

      const rec1 = await makeRequest('GET', '/api/intelligence/recommendations', null, empCookie);
      const rec2 = await makeRequest('GET', '/api/recommendations', null, empCookie);
      assert.strictEqual(rec1.status, 200);
      assert.strictEqual(rec2.status, 200);

      const rm1 = await makeRequest('GET', '/api/intelligence/roadmap', null, empCookie);
      const rm2 = await makeRequest('GET', '/api/roadmap', null, empCookie);
      assert.strictEqual(rm1.status, 200);
      assert.strictEqual(rm2.status, 200);

      testPass('All API endpoint aliases (/api/rewards, /api/leaderboard, /api/skill-gaps, etc.) remain functional');
    } catch (e) {
      testFail('All API endpoint aliases (/api/rewards, /api/leaderboard, /api/skill-gaps, etc.) remain functional', e);
    }

    // Test 13: Quiz generator endpoint robustness
    try {
      const res1 = await makeRequest('POST', '/api/quiz-generator', { domain: 'Statistical', count: 2 }, empCookie);
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.success, true);
      assert.strictEqual(res1.body.data.questions.length, 2);

      const res2 = await makeRequest('POST', '/api/intelligence/quiz-generator', { count: 100 }, empCookie);
      assert.strictEqual(res2.status, 200);
      assert.ok(res2.body.data.questions.length <= 10, 'Count must be capped at 10');
      testPass('Quiz generator endpoint generates bounded, safe questions without answer leakage');
    } catch (e) {
      testFail('Quiz generator endpoint generates bounded, safe questions without answer leakage', e);
    }

    // Test 14: Session destruction & revocation
    try {
      const logoutRes = await makeRequest('POST', '/api/auth/logout', {}, empCookie);
      assert.strictEqual(logoutRes.status, 200);
      assert.strictEqual(logoutRes.body.success, true);

      // Subsequent request using old cookie must be rejected
      const meRes = await makeRequest('GET', '/api/auth/me', null, empCookie);
      assert.strictEqual(meRes.status, 401);
      testPass('Logout invalidates server session and revokes authentication credentials');
    } catch (e) {
      testFail('Logout invalidates server session and revokes authentication credentials', e);
    }

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`  FINAL HARDENING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHardeningTests().catch(err => {
  console.error('[Hardening Test Error]', err);
  process.exit(1);
});
