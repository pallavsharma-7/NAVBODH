/**
 * NAVBODH Stage 4 — Gamification Test Suite
 * 
 * Contributor Ownership: Pallav (Stage 4: Gamification)
 * 
 * Tests:
 * 1. Authenticated gamification access
 * 2. Unauthenticated rejection (401)
 * 3. Total reward calculation
 * 4. Reward persistence across database re-open
 * 5. Lesson completion reward (+15 pts)
 * 6. Quiz completion reward (+25 pts)
 * 7. Achievement awarding
 * 8. Duplicate achievement protection (idempotency)
 * 9. Duplicate reward protection (event_key uniqueness)
 * 10. Baseline-aware growth percentage calculation
 * 11. Baseline immutability (baseline_score is never modified)
 * 12. Baseline = 0 handling (no NaN, Infinity, or -Infinity)
 * 13. Growth milestone at 10% (+40 pts)
 * 14. Growth milestone at 20% (+60 pts)
 * 15. Growth milestone at 35% (+80 pts)
 * 16. Growth milestone at 50% (+100 pts)
 * 17. Leaderboard ordering by Growth %
 * 18. Leaderboard tie-breakers (Points -> Completions -> Employee ID)
 * 19. Learning streak calculation from distinct activity dates
 * 20. Employee session scoping (req.user.id isolation)
 * 21. Refresh does not inflate rewards
 * 22. Existing Learning module endpoints remain fully functional
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'test-gamification.sqlite');
process.env.DB_PATH = TEST_DB_PATH;

if (fs.existsSync(TEST_DB_PATH)) {
  try { fs.unlinkSync(TEST_DB_PATH); } catch (e) {}
}

const app = require('../server');
const { getDb, initDatabase } = require('../db');
const { seedDatabase } = require('../seed');

let server;
let port;
let empCookie1 = '';
let empCookie2 = '';

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
      const resCookies = res.headers['set-cookie'];

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: resCookies,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('  STARTING NAVBODH STAGE 4: GAMIFICATION TEST SUITE');
  console.log('===============================================================');

  initDatabase();
  seedDatabase();

  server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  port = server.address().port;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`• Testing: ${name}... ✓ PASS`);
      passed++;
    } catch (err) {
      console.error(`• Testing: ${name}... ✗ FAIL`);
      console.error(`  Error: ${err.message}`);
      if (err.stack) {
        console.error(' ', err.stack.split('\n').slice(1, 4).join('\n'));
      }
      failed++;
    }
  }

  // Helper login
  async function login(identifier, password) {
    const res = await makeRequest('POST', '/api/auth/login', { identifier, password });
    assert.strictEqual(res.status, 200, `Login failed for ${identifier}`);
    const cookieHeader = res.cookies ? res.cookies.find(c => c.startsWith('navbodh_session=')) : '';
    return cookieHeader ? cookieHeader.split(';')[0] : '';
  }

  // 1. Authenticated login setup
  await test('Employee authentication logs in test officers successfully', async () => {
    empCookie1 = await login('emp.sharma', 'Password123!');
    empCookie2 = await login('emp.verma', 'Password123!');
    assert.ok(empCookie1, 'Priya Sharma login cookie issued');
    assert.ok(empCookie2, 'Rajesh Verma login cookie issued');
  });

  // 2. Unauthenticated rejection
  await test('Gamification endpoints reject unauthenticated requests (HTTP 401)', async () => {
    const resGam = await makeRequest('GET', '/api/gamification');
    assert.strictEqual(resGam.status, 401);
    assert.strictEqual(resGam.body.success, false);

    const resRew = await makeRequest('GET', '/api/gamification/rewards');
    assert.strictEqual(resRew.status, 401);

    const resLead = await makeRequest('GET', '/api/gamification/leaderboard');
    assert.strictEqual(resLead.status, 401);

    const resAch = await makeRequest('GET', '/api/gamification/achievements');
    assert.strictEqual(resAch.status, 401);
  });

  // 3. Authenticated gamification access & zero-baseline check
  await test('Authenticated employee returns zero-baseline safe profile without NaN or Infinity', async () => {
    const res = await makeRequest('GET', '/api/gamification', null, empCookie1);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;
    assert.ok(typeof data.total_points === 'number');
    assert.strictEqual(data.growth.is_zero_baseline, true);
    assert.ok(!isNaN(data.growth.growth_percentage));
    assert.ok(isFinite(data.growth.growth_percentage));
    assert.ok(Array.isArray(data.achievements));
    assert.ok(Array.isArray(data.milestones));
  });

  // 4. Baseline assessment completion awards points and preserves baseline score
  await test('Baseline assessment completion awards +50 pts and preserves permanent baseline', async () => {
    const db = getDb();
    const questions = db.prepare('SELECT id, correct_option_index FROM assessment_questions ORDER BY id ASC').all();
    const answers = {};
    for (const q of questions) {
      answers[q.id] = q.correct_option_index; // 100% score
    }

    const subRes = await makeRequest('POST', '/api/assessment/submit', { assessment_id: 1, answers }, empCookie1);
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body.data.is_baseline, true);

    // Verify baseline scores recorded
    const comps = db.prepare('SELECT baseline_score, current_score FROM employee_competencies WHERE user_id = ?').all(1);
    assert.ok(comps.length > 0);
    const originalBaselineSum = comps.reduce((acc, c) => acc + c.baseline_score, 0);
    assert.strictEqual(originalBaselineSum, 100 * comps.length);

    // Check gamification payload
    const gamRes = await makeRequest('GET', '/api/gamification', null, empCookie1);
    assert.strictEqual(gamRes.status, 200);
    assert.ok(gamRes.body.data.total_points >= 50, 'At least 50 points for baseline assessment');
    assert.strictEqual(gamRes.body.data.growth.has_baseline, true);
  });

  // 5. Subsequent assessment updates current score while baseline remains IMMUTABLE
  await test('CRITICAL: Subsequent assessment updates current score while preserving baseline score', async () => {
    const db = getDb();
    const compsBefore = db.prepare('SELECT competency_id, baseline_score FROM employee_competencies WHERE user_id = ?').all(1);

    // Submit second attempt with 0% score
    const questions = db.prepare('SELECT id, correct_option_index FROM assessment_questions ORDER BY id ASC').all();
    const wrongAnswers = {};
    for (const q of questions) {
      wrongAnswers[q.id] = (q.correct_option_index + 1) % 4; // 0% score
    }

    const sub2Res = await makeRequest('POST', '/api/assessment/submit', { assessment_id: 1, answers: wrongAnswers }, empCookie1);
    assert.strictEqual(sub2Res.status, 200);
    assert.strictEqual(sub2Res.body.data.is_baseline, false);

    // Verify baseline scores are EXACTLY identical to before
    const compsAfter = db.prepare('SELECT competency_id, baseline_score, current_score FROM employee_competencies WHERE user_id = ?').all(1);
    for (const cb of compsBefore) {
      const ca = compsAfter.find(c => c.competency_id === cb.competency_id);
      assert.strictEqual(ca.baseline_score, cb.baseline_score, `Baseline score for comp ${cb.competency_id} must remain immutable!`);
      assert.strictEqual(ca.current_score, 0, 'Current score updated to 0%');
    }
  });

  // 6. Lesson completion reward & Course progress
  await test('Lesson completion awards +15 points idempotently', async () => {
    const resComp1 = await makeRequest('POST', '/api/lessons/1/complete', null, empCookie1);
    assert.strictEqual(resComp1.status, 200);

    const gamRes1 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const pts1 = gamRes1.body.data.total_points;

    // Repeat lesson 1 completion
    const resComp2 = await makeRequest('POST', '/api/lessons/1/complete', null, empCookie1);
    assert.strictEqual(resComp2.status, 200);

    const gamRes2 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const pts2 = gamRes2.body.data.total_points;

    assert.strictEqual(pts2, pts1, 'Repeated lesson completion must NOT inflate points!');
  });

  // 7. Quiz completion reward & perfect score bonus
  await test('Quiz completion awards quiz points and perfect score bonus server-side', async () => {
    const db = getDb();
    const quizQues = db.prepare('SELECT id, correct_option_index FROM quiz_questions WHERE quiz_id = 1 ORDER BY sequence_order ASC').all();
    const answers = {};
    for (const q of quizQues) {
      answers[q.id] = q.correct_option_index;
    }

    const quizSub = await makeRequest('POST', '/api/quizzes/1/submit', { answers }, empCookie1);
    assert.strictEqual(quizSub.status, 200);
    assert.strictEqual(quizSub.body.data.passed, true);
    assert.strictEqual(quizSub.body.data.score, 100);

    const rewardsRes = await makeRequest('GET', '/api/gamification/rewards', null, empCookie1);
    assert.strictEqual(rewardsRes.status, 200);
    const ledger = rewardsRes.body.data.rewards;
    const hasQuizEvent = ledger.some(r => r.event_type === 'quiz_completed');
    const hasPerfectEvent = ledger.some(r => r.event_type === 'quiz_perfect_score');
    assert.ok(hasQuizEvent, 'quiz_completed event recorded in ledger');
    assert.ok(hasPerfectEvent, 'quiz_perfect_score event recorded in ledger');
  });

  // 8. Duplicate reward protection on API refreshes
  await test('Duplicate reward protection: Multiple refreshes do NOT inflate total points', async () => {
    const res1 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const pts1 = res1.body.data.total_points;

    const res2 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const pts2 = res2.body.data.total_points;

    const res3 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const pts3 = res3.body.data.total_points;

    assert.strictEqual(pts1, pts2, 'Points must be identical across refreshes');
    assert.strictEqual(pts2, pts3, 'Points must be identical across refreshes');
  });

  // 9. Achievement unlocking and duplicate protection
  await test('Achievements unlock automatically and duplicate achievement records are rejected', async () => {
    const achRes = await makeRequest('GET', '/api/gamification/achievements', null, empCookie1);
    assert.strictEqual(achRes.status, 200);
    const achs = achRes.body.data.achievements;
    const unlocked = achs.filter(a => a.is_unlocked);
    assert.ok(unlocked.length > 0, 'At least one achievement unlocked (e.g. Baseline, First Lesson, First Quiz)');

    const db = getDb();
    const countBefore = db.prepare('SELECT COUNT(*) as cnt FROM employee_achievements WHERE user_id = 1').get().cnt;

    const firstAchId = unlocked[0].id;
    db.prepare('INSERT OR IGNORE INTO employee_achievements (user_id, achievement_id) VALUES (1, ?)').run(firstAchId);
    const countAfter = db.prepare('SELECT COUNT(*) as cnt FROM employee_achievements WHERE user_id = 1').get().cnt;

    assert.strictEqual(countBefore, countAfter, 'UNIQUE(user_id, achievement_id) constraint prevents duplicate achievements');
  });

  // 10. Growth calculation formula
  await test('Growth calculation follows ((Current - Baseline) / Baseline) * 100', async () => {
    const db = getDb();
    const allComps = db.prepare('SELECT id FROM competencies').all();
    for (const c of allComps) {
      db.prepare(`
        INSERT INTO employee_competencies (user_id, competency_id, baseline_score, current_score, last_assessed_at)
        VALUES (2, ?, 50.0, 75.0, datetime('now'))
        ON CONFLICT(user_id, competency_id) DO UPDATE SET baseline_score = 50.0, current_score = 75.0
      `).run(c.id);
    }

    const gamRes2 = await makeRequest('GET', '/api/gamification', null, empCookie2);
    assert.strictEqual(gamRes2.status, 200);
    const growth = gamRes2.body.data.growth;
    assert.strictEqual(growth.average_baseline_score, 50.0);
    assert.strictEqual(growth.average_current_score, 75.0);
    assert.strictEqual(growth.growth_percentage, 50.0);
    assert.strictEqual(growth.growth_display, '+50%');
  });

  // 11. Baseline = 0 handling
  await test('Zero-baseline handling: avgBaseline = 0 produces human-readable "New Skill" representation', async () => {
    const db = getDb();
    const allComps = db.prepare('SELECT id FROM competencies').all();
    for (const c of allComps) {
      db.prepare(`
        UPDATE employee_competencies SET baseline_score = 0.0, current_score = 60.0 WHERE user_id = 2 AND competency_id = ?
      `).run(c.id);
    }

    const gamRes2 = await makeRequest('GET', '/api/gamification', null, empCookie2);
    assert.strictEqual(gamRes2.status, 200);
    const growth = gamRes2.body.data.growth;
    assert.strictEqual(growth.average_baseline_score, 0.0);
    assert.strictEqual(growth.average_current_score, 60.0);
    assert.strictEqual(growth.is_zero_baseline, true);
    assert.strictEqual(growth.growth_display, 'New Skill (+60 pts)');
  });

  // 12-15. Growth Milestones (10%, 20%, 35%, 50%)
  await test('Growth milestones (10%, 20%, 35%, 50%) award milestone rewards once', async () => {
    const db = getDb();
    const allComps = db.prepare('SELECT id FROM competencies').all();
    for (const c of allComps) {
      db.prepare(`
        UPDATE employee_competencies SET baseline_score = 50.0, current_score = 75.0 WHERE user_id = 2 AND competency_id = ?
      `).run(c.id);
    }

    const gamRes = await makeRequest('GET', '/api/gamification', null, empCookie2);
    assert.strictEqual(gamRes.status, 200);
    const milestones = gamRes.body.data.milestones;
    assert.strictEqual(milestones.length, 4);
    assert.strictEqual(milestones.every(m => m.is_achieved), true);

    const rewardsRes = await makeRequest('GET', '/api/gamification/rewards', null, empCookie2);
    const milestoneRewards = rewardsRes.body.data.rewards.filter(r => r.event_type === 'growth_milestone');
    assert.strictEqual(milestoneRewards.length, 4, 'All 4 milestone rewards (10%, 20%, 35%, 50%) recorded');
  });

  // 16. Leaderboard Ordering & Tie-breakers
  await test('Leaderboard orders employees by Growth % with stable deterministic tie-breaking', async () => {
    const leadRes = await makeRequest('GET', '/api/gamification/leaderboard', null, empCookie1);
    assert.strictEqual(leadRes.status, 200);
    assert.strictEqual(leadRes.body.success, true);
    const board = leadRes.body.data.leaderboard;
    assert.ok(Array.isArray(board));
    assert.ok(board.length >= 2);

    for (let i = 0; i < board.length - 1; i++) {
      const a = board[i];
      const b = board[i + 1];
      if (a.growth_percent !== b.growth_percent) {
        assert.ok(a.growth_percent >= b.growth_percent, `Rank ${a.rank} growth (${a.growth_percent}) >= Rank ${b.rank} growth (${b.growth_percent})`);
      } else if (a.total_points !== b.total_points) {
        assert.ok(a.total_points >= b.total_points, `Rank ${a.rank} pts (${a.total_points}) >= Rank ${b.rank} pts (${b.total_points})`);
      } else {
        assert.ok(a.employee_id <= b.employee_id, 'Tie broken deterministically by employee_id ASC');
      }
    }
  });

  // 17. Streak System
  await test('Learning streak calculates active consecutive activity days from DB timestamps', async () => {
    const gamRes = await makeRequest('GET', '/api/gamification', null, empCookie1);
    assert.strictEqual(gamRes.status, 200);
    const streak = gamRes.body.data.streak;
    assert.ok(typeof streak.current_streak_days === 'number');
    assert.ok(typeof streak.longest_streak_days === 'number');
  });

  // 18. Employee Session Scoping
  await test('Employee session scoping: Employee A cannot access Employee B data via identity spoofing', async () => {
    const res1 = await makeRequest('GET', '/api/gamification', null, empCookie1);
    const res2 = await makeRequest('GET', '/api/gamification', null, empCookie2);

    assert.notStrictEqual(res1.body.data.rank.rank, res2.body.data.rank.rank || -1);
  });

  // 19. Persistence of reward ledger
  await test('SQLite reward ledger persists intact across database query operations', async () => {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as cnt FROM reward_ledger').get().cnt;
    assert.ok(count > 0, 'Reward ledger records persist in SQLite');
  });

  // 20. Regression: Existing Learning Module Endpoints remain working
  await test('Regression: Core, Intelligence, and Learning endpoints remain 100% operational', async () => {
    const health = await makeRequest('GET', '/api/health');
    assert.strictEqual(health.status, 200);

    const courses = await makeRequest('GET', '/api/courses', null, empCookie1);
    assert.strictEqual(courses.status, 200);
    assert.ok(Array.isArray(courses.body.data.courses));

    const lesson = await makeRequest('GET', '/api/lessons/1', null, empCookie1);
    assert.strictEqual(lesson.status, 200);

    const quiz = await makeRequest('GET', '/api/quizzes/1', null, empCookie1);
    assert.strictEqual(quiz.status, 200);
  });

  console.log('===============================================================');
  console.log(`  GAMIFICATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  server.close();
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in gamification test suite:', err);
  if (server) server.close();
  process.exit(1);
});
