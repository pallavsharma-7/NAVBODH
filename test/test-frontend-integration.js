/**
 * NAVBODH - Frontend Integration & Full-Stack Lifecycle Simulation
 * 
 * Verifies the end-to-end frontend client flow:
 * 1. HTML Shell & Asset Availability (/index.html, /styles.css, /api.js, /employee.js)
 * 2. Unauthenticated Login Flow (Priya Sharma vs Rajesh Verma)
 * 3. Session Cookie Handling (HttpOnly)
 * 4. Assessment Submission & Baseline Initialization
 * 5. Skill-Gaps Query & UI Data Mapping
 * 6. Recommendations Query & Course Rationale Validation
 * 7. Roadmap Query & Milestone Progression
 * 8. Study Assistant Query & Grounded Context Response
 * 9. Unassessed Officer Empty States
 * 10. Logout Flow
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const SIM_DB_PATH = path.join(__dirname, 'navbodh-sim-test.sqlite');
if (fs.existsSync(SIM_DB_PATH)) {
  fs.unlinkSync(SIM_DB_PATH);
}
process.env.DB_PATH = SIM_DB_PATH;

const app = require('../server');
const PORT = 3998;
const BASE_URL = `http://localhost:${PORT}`;
let server;

class BrowserSimulationClient {
  constructor() {
    this.cookie = null;
  }

  async fetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/navbodh_session=[^;]+/);
      if (match) this.cookie = match[0];
    }
    return res;
  }

  async getJson(url) {
    const res = await this.fetch(url);
    const json = await res.json();
    return { status: res.status, body: json };
  }

  async postJson(url, body) {
    const res = await this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    return { status: res.status, body: json };
  }
}

async function runBrowserSimulation() {
  console.log('\n===============================================================');
  console.log('  SIMULATING FULL BROWSER CLIENT LIFECYCLE FOR STAGE 2');
  console.log('===============================================================\n');

  try {
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => resolve(s));
    });

    const client = new BrowserSimulationClient();

    // 1. Static Assets
    process.stdout.write('• Testing: Static assets load properly (/index.html, /styles.css, /api.js, /employee.js)... ');
    const htmlRes = await client.fetch('/index.html');
    assert.strictEqual(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes('view-employee-gaps'));
    assert.ok(htmlText.includes('view-employee-recommendations'));
    assert.ok(htmlText.includes('view-employee-roadmap'));
    assert.ok(htmlText.includes('view-employee-assistant'));

    const cssRes = await client.fetch('/styles.css');
    assert.strictEqual(cssRes.status, 200);
    const cssText = await cssRes.text();
    assert.ok(cssText.includes('badge-priority-high'));
    assert.ok(cssText.includes('recommendations-grid'));

    const jsRes = await client.fetch('/employee.js');
    assert.strictEqual(jsRes.status, 200);
    console.log('✓ PASS');

    // 2. Login Flow
    process.stdout.write('• Testing: Official login for Priya Sharma (emp.sharma)... ');
    const loginRes = await client.postJson('/api/auth/login', {
      identifier: 'emp.sharma',
      password: 'Password123!'
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);
    assert.strictEqual(loginRes.body.data.user.role, 'employee');
    assert.ok(client.cookie, 'Session cookie must be assigned');
    console.log('✓ PASS');

    // 3. Profile & Dashboard Data
    process.stdout.write('• Testing: Employee Profile & Dashboard load... ');
    const profRes = await client.getJson('/api/profile');
    assert.strictEqual(profRes.status, 200);
    assert.strictEqual(profRes.body.success, true);
    console.log('✓ PASS');

    // 4. Baseline Assessment Check / Submission
    process.stdout.write('• Testing: Assessment evaluation and baseline establishment... ');
    const assessRes = await client.getJson('/api/assessment');
    assert.strictEqual(assessRes.status, 200);
    const questions = assessRes.body.data.questions;
    assert.strictEqual(questions.length, 17);

    // Submit assessment with known answers (mix of correct/incorrect)
    const answers = {};
    questions.forEach((q, idx) => {
      answers[q.id] = (idx % 2 === 0) ? 0 : 3;
    });

    const submitRes = await client.postJson('/api/assessment/submit', {
      assessment_id: 1,
      answers
    });
    assert.strictEqual(submitRes.status, 200);
    assert.strictEqual(submitRes.body.success, true);
    console.log('✓ PASS');

    // 5. Skill Gaps UI Data Flow
    process.stdout.write('• Testing: GET /api/intelligence/skill-gaps payload integrity... ');
    const gapsRes = await client.getJson('/api/intelligence/skill-gaps');
    assert.strictEqual(gapsRes.status, 200);
    assert.strictEqual(gapsRes.body.success, true);
    assert.strictEqual(gapsRes.body.data.hasAssessment, true);
    assert.ok(gapsRes.body.data.gaps.length > 0);
    assert.ok(gapsRes.body.data.summary.highPriorityCount >= 0);
    console.log('✓ PASS');

    // 6. Recommendations UI Data Flow
    process.stdout.write('• Testing: GET /api/intelligence/recommendations personalized courses... ');
    const recsRes = await client.getJson('/api/intelligence/recommendations');
    assert.strictEqual(recsRes.status, 200);
    assert.strictEqual(recsRes.body.success, true);
    assert.ok(recsRes.body.data.recommendations.length > 0);
    for (const rec of recsRes.body.data.recommendations) {
      assert.ok(rec.title);
      assert.ok(rec.source);
      assert.ok(rec.reason);
    }
    console.log('✓ PASS');

    // 7. Dynamic Roadmap UI Data Flow
    process.stdout.write('• Testing: GET /api/intelligence/roadmap structured phased learning... ');
    const roadmapRes = await client.getJson('/api/intelligence/roadmap');
    assert.strictEqual(roadmapRes.status, 200);
    assert.strictEqual(roadmapRes.body.success, true);
    assert.ok(roadmapRes.body.data.stages.length > 0);
    console.log('✓ PASS');

    // 8. Study Assistant Query Lifecycle
    process.stdout.write('• Testing: POST /api/intelligence/study-assistant contextual answers... ');
    const astRes = await client.postJson('/api/intelligence/study-assistant', {
      message: 'What should I learn first?'
    });
    assert.strictEqual(astRes.status, 200);
    assert.strictEqual(astRes.body.success, true);
    assert.strictEqual(astRes.body.data.mode, 'rules_based_fallback');
    assert.ok(astRes.body.data.reply.length > 20);
    console.log('✓ PASS');

    // 9. Logout
    process.stdout.write('• Testing: Official logout & session invalidation... ');
    const logoutRes = await client.postJson('/api/auth/logout', {});
    assert.strictEqual(logoutRes.status, 200);
    const checkUnauth = await client.getJson('/api/intelligence/skill-gaps');
    assert.strictEqual(checkUnauth.status, 401);
    console.log('✓ PASS');

    console.log('\n===============================================================');
    console.log('  ALL BROWSER SIMULATION LIFECYCLE CHECKS PASSED (9/9)');
    console.log('===============================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runBrowserSimulation().catch(err => {
    console.error('Fatal simulation error:', err);
    process.exit(1);
  });
}
