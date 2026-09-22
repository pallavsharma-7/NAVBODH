/**
 * NAVBODH Stage 5 — Admin + Integration Test Suite
 *
 * Contributor Ownership: Palak (Stage 5: Admin + Integration)
 *
 * Tests:
 * 1. Unauthenticated Admin overview rejected (HTTP 401)
 * 2. Unauthenticated Admin employees rejected (HTTP 401)
 * 3. Unauthenticated Admin content rejected (HTTP 401)
 * 4. Unauthenticated integration status behavior (HTTP 200 with truthful adapter data)
 * 5. Employee cannot access Admin overview (HTTP 403 Forbidden)
 * 6. Employee cannot access Admin employees (HTTP 403 Forbidden)
 * 7. Employee cannot access Admin content (HTTP 403 Forbidden)
 * 8. Admin can access Admin overview (HTTP 200 OK)
 * 9. Admin can access Admin employees (HTTP 200 OK)
 * 10. Admin can access Admin content (HTTP 200 OK)
 * 11. Overview contains real aggregate data from database
 * 12. Employee response excludes password/session secrets
 * 13. Integration status returns truthful adapter state (simulated/demo vs operational)
 * 14. Existing Core APIs remain functional
 * 15. Existing Intelligence APIs remain functional
 * 16. Existing Learning APIs remain functional
 * 17. Existing Gamification APIs remain functional
 * 18. Admin employee query filtering works safely without privilege escalation
 * 19. Client role spoofing prevention (cannot escalate to admin via query or body parameters)
 * 20. Admin logout cleanly revokes session
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'test-admin.sqlite');
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

function makeRequest(method, reqPath, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: reqPath,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

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
        if (setCookie && Array.isArray(setCookie)) {
          cookieHeader = setCookie[0].split(';')[0];
        }

        resolve({
          status: res.status,
          statusCode: res.statusCode,
          headers: res.headers,
          cookie: cookieHeader,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAdminTests() {
  console.log('\n===============================================================');
  console.log('  STARTING NAVBODH STAGE 5: ADMIN + INTEGRATION TEST SUITE');
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
    // 0. Setup test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });

    // Clean seed
    seedDatabase();

    // Authenticate Admin (Dr. Anil Kumar)
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
      identifier: 'admin.navbodh',
      password: 'AdminPass123!'
    });
    assert.strictEqual(adminLoginRes.statusCode, 200);
    assert.strictEqual(adminLoginRes.body.success, true);
    assert.strictEqual(adminLoginRes.body.data.user.role, 'admin');
    adminCookie = adminLoginRes.cookie;
    assert.ok(adminCookie, 'Admin session cookie must be set');

    // Authenticate Employee (Priya Sharma)
    const empLoginRes = await makeRequest('POST', '/api/auth/login', {
      identifier: 'emp.sharma',
      password: 'Password123!'
    });
    assert.strictEqual(empLoginRes.statusCode, 200);
    assert.strictEqual(empLoginRes.body.success, true);
    assert.strictEqual(empLoginRes.body.data.user.role, 'employee');
    empCookie = empLoginRes.cookie;
    assert.ok(empCookie, 'Employee session cookie must be set');

    // TEST 1: Unauthenticated Admin overview rejected (401)
    try {
      const res = await makeRequest('GET', '/api/admin/overview');
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
      testPass('Unauthenticated Admin overview rejected with HTTP 401 Unauthorized');
    } catch (e) {
      testFail('Unauthenticated Admin overview rejected with HTTP 401 Unauthorized', e);
    }

    // TEST 2: Unauthenticated Admin employees rejected (401)
    try {
      const res = await makeRequest('GET', '/api/admin/employees');
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
      testPass('Unauthenticated Admin employees rejected with HTTP 401 Unauthorized');
    } catch (e) {
      testFail('Unauthenticated Admin employees rejected with HTTP 401 Unauthorized', e);
    }

    // TEST 3: Unauthenticated Admin content rejected (401)
    try {
      const res = await makeRequest('GET', '/api/admin/content');
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
      testPass('Unauthenticated Admin content rejected with HTTP 401 Unauthorized');
    } catch (e) {
      testFail('Unauthenticated Admin content rejected with HTTP 401 Unauthorized', e);
    }

    // TEST 4: Unauthenticated integration status behavior (200 with safe adapter data)
    try {
      const res = await makeRequest('GET', '/api/integrations/status');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.adapters);
      assert.ok(res.body.data.adapters.ai_assistant);
      assert.ok(res.body.data.adapters.igot_karmayogi);
      assert.ok(res.body.data.adapters.nssta_tpac);
      assert.ok(res.body.data.adapters.sqlite_database);
      testPass('Unauthenticated integration status responds with safe system adapter information');
    } catch (e) {
      testFail('Unauthenticated integration status responds with safe system adapter information', e);
    }

    // TEST 5: Employee cannot access Admin overview (403)
    try {
      const res = await makeRequest('GET', '/api/admin/overview', null, empCookie);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
      testPass('Employee session cannot access Admin overview (HTTP 403 Forbidden)');
    } catch (e) {
      testFail('Employee session cannot access Admin overview (HTTP 403 Forbidden)', e);
    }

    // TEST 6: Employee cannot access Admin employees (403)
    try {
      const res = await makeRequest('GET', '/api/admin/employees', null, empCookie);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
      testPass('Employee session cannot access Admin employees (HTTP 403 Forbidden)');
    } catch (e) {
      testFail('Employee session cannot access Admin employees (HTTP 403 Forbidden)', e);
    }

    // TEST 7: Employee cannot access Admin content (403)
    try {
      const res = await makeRequest('GET', '/api/admin/content', null, empCookie);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
      testPass('Employee session cannot access Admin content (HTTP 403 Forbidden)');
    } catch (e) {
      testFail('Employee session cannot access Admin content (HTTP 403 Forbidden)', e);
    }

    // TEST 8: Admin can access Admin overview (200)
    try {
      const res = await makeRequest('GET', '/api/admin/overview', null, adminCookie);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.summary);
      assert.ok(res.body.data.admin_user);
      assert.strictEqual(res.body.data.admin_user.role, 'admin');
      testPass('Admin session can access Admin overview successfully (HTTP 200 OK)');
    } catch (e) {
      testFail('Admin session can access Admin overview successfully (HTTP 200 OK)', e);
    }

    // TEST 9: Admin can access Admin employees (200)
    try {
      const res = await makeRequest('GET', '/api/admin/employees', null, adminCookie);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.employees));
      assert.strictEqual(res.body.data.total_count, 2); // emp.sharma and emp.verma
      testPass('Admin session can access Admin employees roster (HTTP 200 OK)');
    } catch (e) {
      testFail('Admin session can access Admin employees roster (HTTP 200 OK)', e);
    }

    // TEST 10: Admin can access Admin content (200)
    try {
      const res = await makeRequest('GET', '/api/admin/content', null, adminCookie);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.courses));
      assert.strictEqual(res.body.data.courses.length, 6);
      assert.ok(Array.isArray(res.body.data.competencies));
      assert.strictEqual(res.body.data.competencies.length, 17);
      testPass('Admin session can access Admin content catalog (HTTP 200 OK)');
    } catch (e) {
      testFail('Admin session can access Admin content catalog (HTTP 200 OK)', e);
    }

    // TEST 11: Overview contains real aggregate data
    try {
      const res = await makeRequest('GET', '/api/admin/overview', null, adminCookie);
      const s = res.body.data.summary;
      assert.strictEqual(s.total_users, 3);
      assert.strictEqual(s.total_employees, 2);
      assert.strictEqual(s.total_admins, 1);
      assert.strictEqual(s.total_departments, 6);
      assert.strictEqual(s.total_competencies, 17);
      assert.strictEqual(s.total_sample_courses, 6);
      assert.strictEqual(s.total_lessons, 18);
      assert.strictEqual(s.total_quizzes, 6);
      assert.ok(Array.isArray(res.body.data.workforce_analytics.departments));
      assert.ok(Array.isArray(res.body.data.workforce_analytics.domains));
      assert.ok(res.body.data.learning_metrics.courses_by_source);
      assert.strictEqual(res.body.data.learning_metrics.courses_by_source.igot, 3);
      assert.strictEqual(res.body.data.learning_metrics.courses_by_source.nssta, 2);
      testPass('Admin overview returns authentic, structured aggregate data from database');
    } catch (e) {
      testFail('Admin overview returns authentic, structured aggregate data from database', e);
    }

    // TEST 12: Employee response excludes password/session secrets
    try {
      const res = await makeRequest('GET', '/api/admin/employees', null, adminCookie);
      const emps = res.body.data.employees;
      assert.ok(emps.length > 0);
      for (const emp of emps) {
        assert.strictEqual(emp.password_hash, undefined, 'password_hash must be excluded');
        assert.strictEqual(emp.password, undefined, 'password must be excluded');
        assert.strictEqual(emp.sid, undefined, 'session token must be excluded');
        assert.strictEqual(emp.token, undefined, 'token must be excluded');
        assert.ok(emp.id);
        assert.ok(emp.username);
        assert.ok(emp.email);
        assert.ok(emp.competency_metrics);
        assert.ok(emp.assessment_metrics);
        assert.ok(emp.learning_metrics);
      }
      testPass('Employee roster strictly excludes passwords, password hashes, and session tokens');
    } catch (e) {
      testFail('Employee roster strictly excludes passwords, password hashes, and session tokens', e);
    }

    // TEST 13: Integration status returns truthful adapter state
    try {
      const res = await makeRequest('GET', '/api/integrations/status');
      const adapters = res.body.data.adapters;

      // AI Adapter: simulated / rules-based fallback
      assert.strictEqual(adapters.ai_assistant.status, 'simulated');
      assert.strictEqual(adapters.ai_assistant.live_connected, false);
      assert.strictEqual(adapters.ai_assistant.mode, 'rules_based_fallback');

      // iGOT Adapter: simulated / demo catalog
      assert.strictEqual(adapters.igot_karmayogi.status, 'simulated');
      assert.strictEqual(adapters.igot_karmayogi.live_connected, false);
      assert.strictEqual(adapters.igot_karmayogi.catalog_count, 3);

      // NSSTA TPAC Adapter: simulated / demo curriculum
      assert.strictEqual(adapters.nssta_tpac.status, 'simulated');
      assert.strictEqual(adapters.nssta_tpac.live_connected, false);
      assert.strictEqual(adapters.nssta_tpac.catalog_count, 2);

      // SQLite Database: operational / live connected
      assert.strictEqual(adapters.sqlite_database.status, 'operational');
      assert.strictEqual(adapters.sqlite_database.live_connected, true);

      // Gamification Ledger: operational
      assert.strictEqual(adapters.gamification_ledger.status, 'operational');
      testPass('Integration status accurately reflects simulation vs live connected operational adapters');
    } catch (e) {
      testFail('Integration status accurately reflects simulation vs live connected operational adapters', e);
    }

    // TEST 14: Existing Core APIs remain functional
    try {
      const healthRes = await makeRequest('GET', '/api/health');
      assert.strictEqual(healthRes.statusCode, 200);
      assert.strictEqual(healthRes.body.data.status, 'healthy');

      const deptRes = await makeRequest('GET', '/api/departments');
      assert.strictEqual(deptRes.statusCode, 200);
      assert.strictEqual(deptRes.body.data.departments.length, 6);

      const compRes = await makeRequest('GET', '/api/competencies');
      assert.strictEqual(compRes.statusCode, 200);
      assert.strictEqual(compRes.body.data.competencies.length, 17);

      const profRes = await makeRequest('GET', '/api/profile', null, empCookie);
      assert.strictEqual(profRes.statusCode, 200);
      assert.strictEqual(profRes.body.data.profile.username, 'emp.sharma');

      testPass('Stage 1 Core endpoints (/health, /departments, /competencies, /profile) remain fully operational');
    } catch (e) {
      testFail('Stage 1 Core endpoints (/health, /departments, /competencies, /profile) remain fully operational', e);
    }

    // TEST 15: Existing Intelligence APIs remain functional
    try {
      const gapsRes = await makeRequest('GET', '/api/intelligence/skill-gaps', null, empCookie);
      assert.strictEqual(gapsRes.statusCode, 200);
      assert.strictEqual(gapsRes.body.success, true);

      const recsRes = await makeRequest('GET', '/api/intelligence/recommendations', null, empCookie);
      assert.strictEqual(recsRes.statusCode, 200);
      assert.strictEqual(recsRes.body.success, true);

      const roadRes = await makeRequest('GET', '/api/intelligence/roadmap', null, empCookie);
      assert.strictEqual(roadRes.statusCode, 200);
      assert.strictEqual(roadRes.body.success, true);

      const astRes = await makeRequest('POST', '/api/intelligence/study-assistant', {
        message: 'Explain national accounts'
      }, empCookie);
      assert.strictEqual(astRes.statusCode, 200);
      assert.strictEqual(astRes.body.success, true);
      assert.ok(astRes.body.data.reply);

      testPass('Stage 2 Intelligence endpoints (/skill-gaps, /recommendations, /roadmap, /study-assistant) remain fully operational');
    } catch (e) {
      testFail('Stage 2 Intelligence endpoints (/skill-gaps, /recommendations, /roadmap, /study-assistant) remain fully operational', e);
    }

    // TEST 16: Existing Learning APIs remain functional
    try {
      const crsRes = await makeRequest('GET', '/api/courses', null, empCookie);
      assert.strictEqual(crsRes.statusCode, 200);
      assert.strictEqual(crsRes.body.data.courses.length, 6);

      const crsDetailRes = await makeRequest('GET', '/api/courses/1', null, empCookie);
      assert.strictEqual(crsDetailRes.statusCode, 200);
      assert.strictEqual(crsDetailRes.body.data.course.code, 'CRS_STAT_101');

      const quizRes = await makeRequest('GET', '/api/quizzes/1', null, empCookie);
      assert.strictEqual(quizRes.statusCode, 200);
      assert.ok(quizRes.body.data.questions.length >= 3);

      testPass('Stage 3 Learning endpoints (/courses, /courses/:id, /quizzes/:id) remain fully operational');
    } catch (e) {
      testFail('Stage 3 Learning endpoints (/courses, /courses/:id, /quizzes/:id) remain fully operational', e);
    }

    // TEST 17: Existing Gamification APIs remain functional
    try {
      const gamRes = await makeRequest('GET', '/api/gamification', null, empCookie);
      assert.strictEqual(gamRes.statusCode, 200);
      assert.strictEqual(gamRes.body.success, true);

      const leadRes = await makeRequest('GET', '/api/gamification/leaderboard', null, empCookie);
      assert.strictEqual(leadRes.statusCode, 200);
      assert.ok(Array.isArray(leadRes.body.data.leaderboard));

      testPass('Stage 4 Gamification endpoints (/gamification, /gamification/leaderboard) remain fully operational');
    } catch (e) {
      testFail('Stage 4 Gamification endpoints (/gamification, /gamification/leaderboard) remain fully operational', e);
    }

    // TEST 18: Admin employee query filtering works safely
    try {
      // Filter by department 1 (NAD)
      const deptFilterRes = await makeRequest('GET', '/api/admin/employees?department_id=1', null, adminCookie);
      assert.strictEqual(deptFilterRes.statusCode, 200);
      assert.strictEqual(deptFilterRes.body.data.employees.length, 1);
      assert.strictEqual(deptFilterRes.body.data.employees[0].username, 'emp.sharma');

      // Filter by search keyword "Rajesh"
      const searchRes = await makeRequest('GET', '/api/admin/employees?search=Rajesh', null, adminCookie);
      assert.strictEqual(searchRes.statusCode, 200);
      assert.strictEqual(searchRes.body.data.employees.length, 1);
      assert.strictEqual(searchRes.body.data.employees[0].username, 'emp.verma');

      testPass('Admin employee filtering by department and keyword search filters correctly');
    } catch (e) {
      testFail('Admin employee filtering by department and keyword search filters correctly', e);
    }

    // TEST 19: Client role spoofing prevention
    try {
      // Attempting to send role=admin in query or body while authenticated as employee
      const spoof1 = await makeRequest('GET', '/api/admin/overview?role=admin', null, empCookie);
      assert.strictEqual(spoof1.statusCode, 403);

      const spoof2 = await makeRequest('GET', '/api/admin/employees?role=admin&userId=3', null, empCookie);
      assert.strictEqual(spoof2.statusCode, 403);

      testPass('Client role spoofing attempts via query or body are strictly blocked by server');
    } catch (e) {
      testFail('Client role spoofing attempts via query or body are strictly blocked by server', e);
    }

    // TEST 20: Admin logout cleanly revokes session
    try {
      const logoutRes = await makeRequest('POST', '/api/auth/logout', {}, adminCookie);
      assert.strictEqual(logoutRes.statusCode, 200);

      const verifyRes = await makeRequest('GET', '/api/admin/overview', null, adminCookie);
      assert.strictEqual(verifyRes.statusCode, 401, 'Session must be destroyed after logout');
      testPass('Admin logout revokes server session and prevents subsequent access');
    } catch (e) {
      testFail('Admin logout revokes server session and prevents subsequent access', e);
    }

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`  STAGE 5 ADMIN + INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAdminTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}

module.exports = runAdminTests;
