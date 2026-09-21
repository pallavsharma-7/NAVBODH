/**
 * NAVBODH - Stage 3: Learning Module Automated Verification Test Suite
 * 
 * Contributor Ownership: Pathika (Stage 3: Learning)
 * 
 * Verifies all Stage 3 Learning requirements:
 * 1. Course Catalogue Listing (Authenticated, metadata, competency links, progress summary)
 * 2. Course Detail Retrieval (Valid course, mapped competencies, ordered lessons, attached quizzes, 404 for invalid)
 * 3. Course Lessons & Curriculum (Sequence order, duration, completion status, attached materials)
 * 4. Lesson Content Reader & Navigation (Detail, prev/next links, materials list)
 * 5. Persistent Lesson Completion (SQLite persistence, idempotent repeated completion)
 * 6. Learning Progress Computation (Derived strictly from completed lessons, capped at 100%, surviving reconnects)
 * 7. Knowledge Verification Quiz Engine (Quiz listing, retrieval without leaking answer keys)
 * 8. Server-Side Quiz Scoring & Anti-Cheating (Scored strictly server-side, 400 for malformed, 404 for invalid)
 * 9. Quiz Attempt Persistence & Review Generation (Result accuracy, explanations provided upon submission)
 * 10. Intelligence -> Learning Bridge (Recommendations map to real active courses)
 * 11. Security & Session Scoping (401 for unauthenticated, cross-officer isolation)
 * 12. BASELINE IMMUTABILITY: Verifies that learning progression and quizzes NEVER alter baseline_score!
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

// Set dedicated test database path
const TEST_DB_PATH = path.join(__dirname, 'navbodh-learning-test.sqlite');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.DB_PATH = TEST_DB_PATH;

const app = require('../server');
const { getDb, initDatabase, Database } = require('../db');
const { seedDatabase } = require('../seed');

const PORT = 4002;
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
  console.log('  STARTING NAVBODH STAGE 3: LEARNING TEST SUITE');
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
      console.error('   ', err.message);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(1, 4).join('\n');
        console.error('   ', stackLines);
      }
      failed++;
    }
  }

  try {
    // 1. Initialize & Seed Database
    initDatabase();
    seedDatabase();

    // 2. Start HTTP Server
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => resolve(s));
    });

    // Setup Test Clients
    const unauthClient = new TestClient();
    
    // Officer 1: Priya Sharma (emp.sharma, user_id = 1)
    const empClient1 = new TestClient();
    await empClient1.request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'emp.sharma', password: 'Password123!' }
    });

    // Officer 2: Rajesh Verma (emp.verma, user_id = 2)
    const empClient2 = new TestClient();
    await empClient2.request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'emp.verma', password: 'Password123!' }
    });

    // Establish baseline assessment for Priya Sharma to enable full intelligence & baseline tracking
    const assessRes = await empClient1.request('/api/assessment');
    const qList = assessRes.body.data.questions;
    const answers = {};
    qList.forEach((q, i) => { answers[q.id] = (i % 2 === 0 ? 0 : 1); });
    await empClient1.request('/api/assessment/submit', {
      method: 'POST',
      body: { assessment_id: 1, answers }
    });

    // Record initial baseline scores in DB to test baseline immutability later
    const db = getDb();
    const initialBaselines = db.prepare('SELECT competency_id, baseline_score FROM employee_competencies WHERE user_id = 1').all();
    const initialBaselineMap = {};
    for (const b of initialBaselines) {
      initialBaselineMap[b.competency_id] = b.baseline_score;
    }

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated Requests Rejected (HTTP 401)
    // ------------------------------------------------------------------------
    await test('Unauthenticated Learning endpoints return HTTP 401 Unauthorized', async () => {
      const res1 = await unauthClient.request('/api/courses');
      assert.strictEqual(res1.status, 401);
      assert.strictEqual(res1.body.success, false);
      assert.strictEqual(res1.body.error.code, 'UNAUTHORIZED');

      const res2 = await unauthClient.request('/api/courses/1');
      assert.strictEqual(res2.status, 401);

      const res3 = await unauthClient.request('/api/courses/1/lessons');
      assert.strictEqual(res3.status, 401);

      const res4 = await unauthClient.request('/api/lessons/1/complete', { method: 'POST' });
      assert.strictEqual(res4.status, 401);

      const res5 = await unauthClient.request('/api/quizzes/1');
      assert.strictEqual(res5.status, 401);

      const res6 = await unauthClient.request('/api/quizzes/1/submit', { method: 'POST', body: { answers: {} } });
      assert.strictEqual(res6.status, 401);
    });

    // ------------------------------------------------------------------------
    // TEST 2: Course Listing with Competency Links & Progress Summary
    // ------------------------------------------------------------------------
    await test('GET /api/courses and /api/learning/courses return all active courses with competencies', async () => {
      const res = await empClient1.request('/api/courses');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.courses));
      assert.strictEqual(res.body.data.courses.length, 6);

      const course1 = res.body.data.courses[0];
      assert.strictEqual(course1.code, 'CRS_STAT_101');
      assert.strictEqual(course1.domain, 'Statistical');
      assert.ok(course1.source_display_name);
      assert.ok(course1.competencies.length > 0);
      assert.strictEqual(course1.total_lessons, 3);
      assert.ok(course1.progress);
      assert.strictEqual(course1.progress.progress_percent, 0.0);
      assert.strictEqual(course1.progress.completed_lessons, 0);

      // Verify /api/learning/courses route alias parity
      const aliasRes = await empClient1.request('/api/learning/courses');
      assert.strictEqual(aliasRes.status, 200);
      assert.strictEqual(aliasRes.body.data.courses.length, 6);
    });

    // ------------------------------------------------------------------------
    // TEST 3: Course Detail & Invalid Course Handling (404)
    // ------------------------------------------------------------------------
    await test('GET /api/courses/:id returns complete course syllabus, or 404 for invalid ID', async () => {
      // Valid course
      const res = await empClient1.request('/api/courses/1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.course.id, 1);
      assert.strictEqual(res.body.data.course.code, 'CRS_STAT_101');
      assert.strictEqual(res.body.data.lessons.length, 3);
      assert.strictEqual(res.body.data.quizzes.length, 1);
      assert.ok(res.body.data.competencies.length >= 2);

      // Invalid course ID (non-existent)
      const notFoundRes = await empClient1.request('/api/courses/9999');
      assert.strictEqual(notFoundRes.status, 404);
      assert.strictEqual(notFoundRes.body.success, false);
      assert.strictEqual(notFoundRes.body.error.code, 'COURSE_NOT_FOUND');

      // Invalid string parameter
      const badIdRes = await empClient1.request('/api/courses/not-a-number');
      assert.strictEqual(badIdRes.status, 404);
      assert.strictEqual(badIdRes.body.error.code, 'COURSE_NOT_FOUND');
    });

    // ------------------------------------------------------------------------
    // TEST 4: Course Lessons List & Attached Materials
    // ------------------------------------------------------------------------
    await test('GET /api/courses/:id/lessons returns ordered lessons with learning materials', async () => {
      const res = await empClient1.request('/api/courses/1/lessons');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.course_id, 1);
      assert.strictEqual(res.body.data.total_lessons, 3);
      assert.strictEqual(res.body.data.completed_lessons, 0);

      const lessons = res.body.data.lessons;
      assert.strictEqual(lessons[0].sequence_order, 1);
      assert.strictEqual(lessons[1].sequence_order, 2);
      assert.strictEqual(lessons[2].sequence_order, 3);
      assert.strictEqual(lessons[0].is_completed, false);
      assert.ok(lessons[0].materials.length > 0, 'Lesson 1 should have attached learning materials');
    });

    // ------------------------------------------------------------------------
    // TEST 5: Lesson Detail Reader & Sibling Navigation
    // ------------------------------------------------------------------------
    await test('GET /api/lessons/:id returns lesson content, materials, and prev/next navigation', async () => {
      const res = await empClient1.request('/api/lessons/1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.lesson.id, 1);
      assert.strictEqual(res.body.data.lesson.title, 'Principles of Probability Sampling & Frame Selection');
      assert.strictEqual(res.body.data.course.code, 'CRS_STAT_101');
      assert.strictEqual(res.body.data.navigation.next_lesson_id, 2);
      assert.strictEqual(res.body.data.navigation.prev_lesson_id, null);
      assert.ok(res.body.data.materials.length >= 2);

      // Non-existent lesson
      const badRes = await empClient1.request('/api/lessons/9999');
      assert.strictEqual(badRes.status, 404);
      assert.strictEqual(badRes.body.error.code, 'LESSON_NOT_FOUND');
    });

    // ------------------------------------------------------------------------
    // TEST 6: Lesson Completion & Persistent Learning Progress Update
    // ------------------------------------------------------------------------
    await test('POST /api/lessons/:id/complete marks lesson complete and recalculates course progress', async () => {
      // Complete lesson 1 of course 1 (1 of 3 = 33.3%)
      const res1 = await empClient1.request('/api/lessons/1/complete', { method: 'POST' });
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.success, true);
      assert.strictEqual(res1.body.data.lesson_id, 1);
      assert.strictEqual(res1.body.data.course_id, 1);
      assert.strictEqual(res1.body.data.is_completed, true);
      assert.strictEqual(res1.body.data.progress.completed_lessons, 1);
      assert.strictEqual(res1.body.data.progress.total_lessons, 3);
      assert.strictEqual(res1.body.data.progress.progress_percent, 33.3);
      assert.strictEqual(res1.body.data.progress.status, 'in_progress');

      // Verify completion state in course detail
      const courseRes1 = await empClient1.request('/api/courses/1');
      assert.strictEqual(courseRes1.body.data.progress.progress_percent, 33.3);
      assert.strictEqual(courseRes1.body.data.lessons[0].is_completed, true);
      assert.strictEqual(courseRes1.body.data.lessons[1].is_completed, false);

      // Complete lesson 2 of course 1 (2 of 3 = 66.7%)
      const res2 = await empClient1.request('/api/lessons/2/complete', { method: 'POST' });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.data.progress.completed_lessons, 2);
      assert.strictEqual(res2.body.data.progress.progress_percent, 66.7);

      // Complete lesson 3 of course 1 (3 of 3 = 100.0%, status: completed)
      const res3 = await empClient1.request('/api/lessons/3/complete', { method: 'POST' });
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.body.data.progress.completed_lessons, 3);
      assert.strictEqual(res3.body.data.progress.progress_percent, 100.0);
      assert.strictEqual(res3.body.data.progress.status, 'completed');
    });

    // ------------------------------------------------------------------------
    // TEST 7: Idempotent Repeated Lesson Completion (Safe & No Corruption)
    // ------------------------------------------------------------------------
    await test('Repeated lesson completion is idempotent and does not corrupt progress or exceed 100%', async () => {
      // Re-submit completion for lesson 1 multiple times
      const repeatRes1 = await empClient1.request('/api/lessons/1/complete', { method: 'POST' });
      assert.strictEqual(repeatRes1.status, 200);
      assert.strictEqual(repeatRes1.body.data.progress.completed_lessons, 3);
      assert.strictEqual(repeatRes1.body.data.progress.progress_percent, 100.0);
      assert.strictEqual(repeatRes1.body.data.progress.status, 'completed');

      const repeatRes2 = await empClient1.request('/api/lessons/2/complete', { method: 'POST' });
      assert.strictEqual(repeatRes2.status, 200);
      assert.strictEqual(repeatRes2.body.data.progress.progress_percent, 100.0);

      // Verify row count in SQLite database directly
      const lcCount = db.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = 1 AND lesson_id = 1').get().count;
      assert.strictEqual(lcCount, 1, 'Duplicate records must not be created in lesson_completions table');
    });

    // ------------------------------------------------------------------------
    // TEST 8: Cross-Employee Session Isolation for Learning Progress
    // ------------------------------------------------------------------------
    await test('Learning progress is strictly isolated per employee session', async () => {
      // Officer 2 (Rajesh Verma) views course 1 (should be 0% progress)
      const emp2CourseRes = await empClient2.request('/api/courses/1');
      assert.strictEqual(emp2CourseRes.status, 200);
      assert.strictEqual(emp2CourseRes.body.data.progress.completed_lessons, 0);
      assert.strictEqual(emp2CourseRes.body.data.progress.progress_percent, 0.0);
      assert.strictEqual(emp2CourseRes.body.data.lessons[0].is_completed, false);
      assert.strictEqual(emp2CourseRes.body.data.lessons[1].is_completed, false);

      // Officer 2 completes lesson 1 only
      await empClient2.request('/api/lessons/1/complete', { method: 'POST' });
      const emp2UpdatedRes = await empClient2.request('/api/courses/1');
      assert.strictEqual(emp2UpdatedRes.body.data.progress.completed_lessons, 1);
      assert.strictEqual(emp2UpdatedRes.body.data.progress.progress_percent, 33.3);

      // Verify Officer 1 still has 100% progress
      const emp1Check = await empClient1.request('/api/courses/1');
      assert.strictEqual(emp1Check.body.data.progress.completed_lessons, 3);
      assert.strictEqual(emp1Check.body.data.progress.progress_percent, 100.0);
    });

    // ------------------------------------------------------------------------
    // TEST 9: Knowledge Quiz Retrieval & Anti-Cheating (No Answer Keys Leaked)
    // ------------------------------------------------------------------------
    await test('GET /api/quizzes/:id returns questions without leaking correct_option_index or explanations', async () => {
      const res = await empClient1.request('/api/quizzes/1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.quiz.id, 1);
      assert.strictEqual(res.body.data.quiz.pass_percentage, 75.0);
      assert.ok(res.body.data.questions.length >= 3);

      for (const q of res.body.data.questions) {
        assert.ok(q.id);
        assert.ok(q.question_text);
        assert.ok(Array.isArray(q.options));
        assert.strictEqual(q.correct_option_index, undefined, 'CRITICAL ANTI-CHEAT RULE: correct_option_index must NOT be exposed before submission!');
        assert.strictEqual(q.explanation, undefined, 'CRITICAL ANTI-CHEAT RULE: explanation must NOT be exposed before submission!');
      }

      // Invalid quiz ID
      const notFoundRes = await empClient1.request('/api/quizzes/9999');
      assert.strictEqual(notFoundRes.status, 404);
      assert.strictEqual(notFoundRes.body.error.code, 'QUIZ_NOT_FOUND');
    });

    // ------------------------------------------------------------------------
    // TEST 10: Server-Side Quiz Scoring, Persistence & Review Generation
    // ------------------------------------------------------------------------
    await test('POST /api/quizzes/:id/submit evaluates answers server-side and persists attempt', async () => {
      const quizRes = await empClient1.request('/api/quizzes/1');
      const questions = quizRes.body.data.questions;

      // Submit all correct answers (in seed data, correct_option_index is 0 for all questions)
      const correctAnswers = {};
      questions.forEach(q => { correctAnswers[q.id] = 0; });

      const submitRes = await empClient1.request('/api/quizzes/1/submit', {
        method: 'POST',
        body: { answers: correctAnswers }
      });

      assert.strictEqual(submitRes.status, 200);
      assert.strictEqual(submitRes.body.success, true);
      assert.strictEqual(submitRes.body.data.quiz_id, 1);
      assert.strictEqual(submitRes.body.data.score, 100.0);
      assert.strictEqual(submitRes.body.data.passed, true);
      assert.strictEqual(submitRes.body.data.total_correct, questions.length);
      assert.strictEqual(submitRes.body.data.total_questions, questions.length);
      assert.strictEqual(submitRes.body.data.question_review.length, questions.length);

      // Verify explanations are provided in post-submission review
      for (const rev of submitRes.body.data.question_review) {
        assert.strictEqual(rev.is_correct, true);
        assert.ok(rev.explanation, 'Explanation must be included in result review');
        assert.strictEqual(rev.correct_option_index, 0);
      }

      // Verify quiz attempt was persisted in SQLite database
      const attemptRow = db.prepare('SELECT score, passed, details_json FROM quiz_attempts WHERE user_id = 1 AND quiz_id = 1').get();
      assert.ok(attemptRow);
      assert.strictEqual(attemptRow.score, 100.0);
      assert.strictEqual(attemptRow.passed, 1);

      // Submit failing attempt (all wrong answers: option 3)
      const wrongAnswers = {};
      questions.forEach(q => { wrongAnswers[q.id] = 3; });
      const failRes = await empClient1.request('/api/quizzes/1/submit', {
        method: 'POST',
        body: { answers: wrongAnswers }
      });
      assert.strictEqual(failRes.status, 200);
      assert.strictEqual(failRes.body.data.score, 0.0);
      assert.strictEqual(failRes.body.data.passed, false);
      assert.strictEqual(failRes.body.data.total_correct, 0);

      // Malformed request body
      const badPayloadRes = await empClient1.request('/api/quizzes/1/submit', {
        method: 'POST',
        body: {}
      });
      assert.strictEqual(badPayloadRes.status, 400);
      assert.strictEqual(badPayloadRes.body.error.code, 'INVALID_PAYLOAD');
    });

    // ------------------------------------------------------------------------
    // TEST 11: Intelligence Recommendation -> Learning Course Bridge
    // ------------------------------------------------------------------------
    await test('Intelligence recommendations resolve directly to valid courses in the Learning catalogue', async () => {
      const recsRes = await empClient1.request('/api/intelligence/recommendations');
      assert.strictEqual(recsRes.status, 200);
      const recs = recsRes.body.data.recommendations;
      assert.ok(recs.length > 0, 'Must have recommendations based on skill gaps');

      for (const rec of recs) {
        const courseCheck = await empClient1.request(`/api/courses/${rec.courseId}`);
        assert.strictEqual(courseCheck.status, 200, `Recommended course ${rec.courseId} (${rec.title}) must exist in /api/courses/:id`);
        assert.strictEqual(courseCheck.body.data.course.code, rec.courseCode);
      }
    });

    // ------------------------------------------------------------------------
    // TEST 12: CRITICAL BASELINE IMMUTABILITY RULE
    // ------------------------------------------------------------------------
    await test('CRITICAL: Learning progress and quizzes MUST NOT alter or overwrite baseline_score', async () => {
      const currentComps = db.prepare('SELECT competency_id, baseline_score FROM employee_competencies WHERE user_id = 1').all();

      for (const uc of currentComps) {
        assert.strictEqual(
          uc.baseline_score,
          initialBaselineMap[uc.competency_id],
          `CRITICAL RULE VIOLATION: Baseline score for competency ${uc.competency_id} was modified by Stage 3 Learning!`
        );
      }
    });

    // ------------------------------------------------------------------------
    // TEST 13: SQLite Persistence Across Database Connection Reload
    // ------------------------------------------------------------------------
    await test('Learning progress and quiz attempts persist across SQLite connection close and reopen', async () => {
      const freshDb = new Database(TEST_DB_PATH);

      const lpCount = freshDb.prepare('SELECT COUNT(*) as count FROM learning_progress WHERE user_id = 1').get().count;
      assert.ok(lpCount > 0, 'Learning progress must be persisted in SQLite file');

      const lcCount = freshDb.prepare('SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = 1').get().count;
      assert.strictEqual(lcCount, 3, '3 lesson completions must persist in SQLite file');

      const qaCount = freshDb.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = 1').get().count;
      assert.strictEqual(qaCount, 2, '2 quiz attempts must persist in SQLite file');

      freshDb.close();
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`  STAGE 3 LEARNING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
