/**
 * NAVBODH - Learning Module Route Boundary & API Implementation
 * 
 * Contributor Ownership: Pathika (Stage 3: Learning)
 * Responsibilities:
 *  - Course catalogue browsing and progress tracking
 *  - Course detail, syllabus, and lesson delivery
 *  - Persistent lesson completion and course progress calculation (SQLite)
 *  - Interactive knowledge verification quizzes with server-side scoring
 *  - Learning materials integration
 *  - Intelligence recommendation -> Learning course navigation
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 *  - BASELINE IMMUTABILITY: Learning progress and quizzes MUST NEVER modify or overwrite
 *    employee_competencies.baseline_score.
 *  - SESSION-SCOPED IDENTITY: All operations derive the employee from req.user.id.
 *  - ANTI-CHEATING: Quiz questions endpoint NEVER exposes correct answers or explanations prior to submission.
 *  - SERVER-SIDE EVALUATION: All quiz scoring is calculated strictly server-side.
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * Helper: Human-readable source label description
 */
function getSourceDisplayName(sourceLabel) {
  switch (sourceLabel) {
    case 'sample_igot':
      return 'Sample iGOT-Karmayogi Catalog (Demo)';
    case 'sample_nssta_tpac':
      return 'Sample NSSTA TPAC Training Module (Demo)';
    case 'local_demo':
      return 'NAVBODH Local Statistical Academy';
    default:
      return 'Official Course Catalog';
  }
}

/**
 * GET /api/courses and GET /api/learning/courses
 * Lists all active courses with mapped competencies, lesson counts, and authenticated user progress.
 */
router.get('/courses', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch all active courses
    const courses = db.prepare(`
      SELECT id, code, title, description, source_label, duration_hours, difficulty_level, domain, created_at
      FROM courses
      WHERE is_active = 1
      ORDER BY id ASC
    `).all();

    // Fetch all course-competency mappings
    const compMappings = db.prepare(`
      SELECT cc.course_id, cc.growth_impact_score, c.id as competency_id, c.code as competency_code,
             c.name as competency_name, c.domain as competency_domain
      FROM course_competencies cc
      JOIN competencies c ON cc.competency_id = c.id
      ORDER BY cc.course_id, c.id ASC
    `).all();

    const courseCompsMap = {};
    for (const cm of compMappings) {
      if (!courseCompsMap[cm.course_id]) {
        courseCompsMap[cm.course_id] = [];
      }
      courseCompsMap[cm.course_id].push({
        competency_id: cm.competency_id,
        code: cm.competency_code,
        name: cm.competency_name,
        domain: cm.competency_domain,
        growth_impact_score: cm.growth_impact_score
      });
    }

    // Fetch lesson counts per course
    const lessonCounts = db.prepare(`
      SELECT course_id, COUNT(*) as total_lessons, SUM(duration_minutes) as total_duration_minutes
      FROM lessons
      GROUP BY course_id
    `).all();

    const lessonCountMap = {};
    for (const lc of lessonCounts) {
      lessonCountMap[lc.course_id] = {
        total_lessons: lc.total_lessons,
        total_duration_minutes: lc.total_duration_minutes || 0
      };
    }

    // Fetch user's completed lessons per course
    const completedLessonCounts = db.prepare(`
      SELECT l.course_id, COUNT(DISTINCT lc.lesson_id) as completed_lessons
      FROM lesson_completions lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE lc.user_id = ?
      GROUP BY l.course_id
    `).all(userId);

    const completedMap = {};
    for (const cl of completedLessonCounts) {
      completedMap[cl.course_id] = cl.completed_lessons;
    }

    // Fetch user's learning progress records
    const progressRecords = db.prepare(`
      SELECT course_id, status, progress_percent, started_at, completed_at, last_activity_at
      FROM learning_progress
      WHERE user_id = ?
    `).all(userId);

    const progressMap = {};
    for (const pr of progressRecords) {
      progressMap[pr.course_id] = pr;
    }

    // Assemble rich course list
    const enrichedCourses = courses.map(c => {
      const lessonInfo = lessonCountMap[c.id] || { total_lessons: 0, total_duration_minutes: 0 };
      const completedCount = completedMap[c.id] || 0;
      const totalLessons = lessonInfo.total_lessons;

      // Real-time progress calculation derived from persisted lesson completions
      let progressPercent = 0.0;
      let status = 'enrolled';

      if (totalLessons > 0) {
        progressPercent = parseFloat(Math.min(100, (completedCount / totalLessons) * 100).toFixed(1));
        if (progressPercent >= 100.0) {
          status = 'completed';
        } else if (completedCount > 0) {
          status = 'in_progress';
        }
      }

      const rawProgress = progressMap[c.id];

      return {
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        source_label: c.source_label,
        source_display_name: getSourceDisplayName(c.source_label),
        duration_hours: c.duration_hours,
        difficulty_level: c.difficulty_level,
        domain: c.domain,
        competencies: courseCompsMap[c.id] || [],
        total_lessons: totalLessons,
        total_duration_minutes: lessonInfo.total_duration_minutes,
        progress: {
          status: rawProgress ? rawProgress.status : status,
          progress_percent: progressPercent,
          completed_lessons: completedCount,
          total_lessons: totalLessons,
          started_at: rawProgress ? rawProgress.started_at : null,
          completed_at: rawProgress ? rawProgress.completed_at : null,
          last_activity_at: rawProgress ? rawProgress.last_activity_at : null
        }
      };
    });

    return res.json({
      success: true,
      data: {
        courses: enrichedCourses,
        total_courses: enrichedCourses.length
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error fetching courses:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch course catalogue.'
      }
    });
  }
});

/**
 * GET /api/courses/:id
 * Returns complete details for a single course, including lessons, progress, and quizzes.
 */
router.get('/courses/:id', requireAuth, (req, res) => {
  const courseId = Number(req.params.id);
  if (!courseId || isNaN(courseId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Invalid course identifier.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch course
    const course = db.prepare(`
      SELECT id, code, title, description, source_label, duration_hours, difficulty_level, domain, created_at
      FROM courses
      WHERE id = ? AND is_active = 1
    `).get(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: `Course with ID ${courseId} was not found.`
        }
      });
    }

    // Fetch mapped competencies
    const competencies = db.prepare(`
      SELECT cc.growth_impact_score, c.id as competency_id, c.code, c.name, c.domain, c.description,
             COALESCE(ec.baseline_score, 0) as baseline_score,
             COALESCE(ec.current_score, 0) as current_score,
             COALESCE(ec.target_score, c.target_score) as target_score
      FROM course_competencies cc
      JOIN competencies c ON cc.competency_id = c.id
      LEFT JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.user_id = ?
      WHERE cc.course_id = ?
      ORDER BY c.id ASC
    `).all(userId, courseId);

    // Fetch lessons with completion status for this user
    const lessons = db.prepare(`
      SELECT l.id, l.course_id, l.title, l.sequence_order, l.content_summary, l.duration_minutes,
             lc.completed_at,
             CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
             (SELECT COUNT(*) FROM learning_materials lm WHERE lm.lesson_id = l.id) as materials_count
      FROM lessons l
      LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.sequence_order ASC, l.id ASC
    `).all(userId, courseId);

    // Fetch quizzes attached to this course
    const quizzes = db.prepare(`
      SELECT q.id, q.course_id, q.competency_id, q.title, q.description, q.pass_percentage,
             (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as total_questions,
             (SELECT MAX(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as user_best_score,
             (SELECT MAX(qa.passed) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as user_passed,
             (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as attempts_count
      FROM quizzes q
      WHERE q.course_id = ?
      ORDER BY q.id ASC
    `).all(userId, userId, userId, courseId);

    // Calculate real-time persistent progress
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => Boolean(l.is_completed)).length;
    const progressPercent = totalLessons > 0
      ? parseFloat(Math.min(100, (completedLessons / totalLessons) * 100).toFixed(1))
      : 0.0;

    const progressRecord = db.prepare(`
      SELECT status, started_at, completed_at, last_activity_at
      FROM learning_progress
      WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId);

    let status = 'enrolled';
    if (progressPercent >= 100.0) {
      status = 'completed';
    } else if (completedLessons > 0) {
      status = 'in_progress';
    }

    return res.json({
      success: true,
      data: {
        course: {
          ...course,
          source_display_name: getSourceDisplayName(course.source_label)
        },
        competencies,
        lessons: lessons.map(l => ({
          ...l,
          is_completed: Boolean(l.is_completed)
        })),
        quizzes: quizzes.map(q => ({
          ...q,
          user_passed: Boolean(q.user_passed)
        })),
        progress: {
          status: progressRecord ? progressRecord.status : status,
          progress_percent: progressPercent,
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          started_at: progressRecord ? progressRecord.started_at : null,
          completed_at: progressRecord ? progressRecord.completed_at : null,
          last_activity_at: progressRecord ? progressRecord.last_activity_at : null
        }
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error fetching course detail:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch course detail.'
      }
    });
  }
});

/**
 * GET /api/courses/:id/lessons
 * Returns the sequential lesson curriculum for a course with attached learning materials.
 */
router.get('/courses/:id/lessons', requireAuth, (req, res) => {
  const courseId = Number(req.params.id);
  if (!courseId || isNaN(courseId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Invalid course identifier.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Check course exists
    const course = db.prepare('SELECT id, title FROM courses WHERE id = ? AND is_active = 1').get(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: `Course with ID ${courseId} was not found.`
        }
      });
    }

    // Fetch lessons
    const lessons = db.prepare(`
      SELECT l.id, l.course_id, l.title, l.sequence_order, l.content_summary, l.duration_minutes,
             lc.completed_at,
             CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
      FROM lessons l
      LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.sequence_order ASC, l.id ASC
    `).all(userId, courseId);

    // Fetch materials for all lessons in this course
    const materials = db.prepare(`
      SELECT lm.id, lm.lesson_id, lm.title, lm.material_type, lm.file_url_or_ref
      FROM learning_materials lm
      JOIN lessons l ON lm.lesson_id = l.id
      WHERE l.course_id = ?
      ORDER BY lm.id ASC
    `).all(courseId);

    const materialsMap = {};
    for (const m of materials) {
      if (!materialsMap[m.lesson_id]) {
        materialsMap[m.lesson_id] = [];
      }
      materialsMap[m.lesson_id].push({
        id: m.id,
        title: m.title,
        material_type: m.material_type,
        file_url_or_ref: m.file_url_or_ref
      });
    }

    const completedCount = lessons.filter(l => Boolean(l.is_completed)).length;
    const progressPercent = lessons.length > 0
      ? parseFloat(Math.min(100, (completedCount / lessons.length) * 100).toFixed(1))
      : 0.0;

    return res.json({
      success: true,
      data: {
        course_id: course.id,
        course_title: course.title,
        total_lessons: lessons.length,
        completed_lessons: completedCount,
        progress_percent: progressPercent,
        lessons: lessons.map(l => ({
          ...l,
          is_completed: Boolean(l.is_completed),
          materials: materialsMap[l.id] || []
        }))
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error fetching course lessons:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch course lessons.'
      }
    });
  }
});

/**
 * GET /api/lessons/:id
 * Returns a specific lesson's content, course metadata, previous/next lesson navigation, and materials.
 */
router.get('/lessons/:id', requireAuth, (req, res) => {
  const lessonId = Number(req.params.id);
  if (!lessonId || isNaN(lessonId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LESSON_NOT_FOUND',
        message: 'Invalid lesson identifier.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch lesson and course info
    const lesson = db.prepare(`
      SELECT l.id, l.course_id, l.title, l.sequence_order, l.content_summary, l.duration_minutes, l.created_at,
             c.code as course_code, c.title as course_title, c.domain as course_domain, c.source_label,
             lc.completed_at,
             CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ?
      WHERE l.id = ?
    `).get(userId, lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: `Lesson with ID ${lessonId} was not found.`
        }
      });
    }

    // Fetch attached learning materials
    const materials = db.prepare(`
      SELECT id, title, material_type, file_url_or_ref
      FROM learning_materials
      WHERE lesson_id = ?
      ORDER BY id ASC
    `).all(lessonId);

    // Find sequence siblings (previous and next lesson in course)
    const allCourseLessons = db.prepare(`
      SELECT id, sequence_order
      FROM lessons
      WHERE course_id = ?
      ORDER BY sequence_order ASC, id ASC
    `).all(lesson.course_id);

    const currentIndex = allCourseLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

    return res.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          course_id: lesson.course_id,
          title: lesson.title,
          sequence_order: lesson.sequence_order,
          content_summary: lesson.content_summary,
          duration_minutes: lesson.duration_minutes,
          is_completed: Boolean(lesson.is_completed),
          completed_at: lesson.completed_at
        },
        course: {
          id: lesson.course_id,
          code: lesson.course_code,
          title: lesson.course_title,
          domain: lesson.course_domain,
          source_label: lesson.source_label,
          source_display_name: getSourceDisplayName(lesson.source_label)
        },
        materials,
        navigation: {
          prev_lesson_id: prevLesson ? prevLesson.id : null,
          next_lesson_id: nextLesson ? nextLesson.id : null,
          current_index: currentIndex + 1,
          total_lessons: allCourseLessons.length
        }
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error fetching lesson:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch lesson details.'
      }
    });
  }
});

/**
 * POST /api/lessons/:id/complete
 * Marks a lesson as completed for the authenticated employee.
 * Persists completion in SQLite and dynamically recalculates course learning progress.
 * Safe against repeated submissions (idempotent).
 */
router.post('/lessons/:id/complete', requireAuth, (req, res) => {
  const lessonId = Number(req.params.id);
  if (!lessonId || isNaN(lessonId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'LESSON_NOT_FOUND',
        message: 'Invalid lesson identifier.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Verify lesson exists
    const lesson = db.prepare('SELECT id, course_id, title FROM lessons WHERE id = ?').get(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: `Lesson with ID ${lessonId} does not exist.`
        }
      });
    }

    const courseId = lesson.course_id;

    // Database transaction to persist completion and update course learning_progress
    const completeTransaction = db.transaction(() => {
      // 1. Persist lesson completion (idempotent INSERT OR IGNORE)
      db.prepare(`
        INSERT OR IGNORE INTO lesson_completions (user_id, lesson_id, completed_at)
        VALUES (?, ?, datetime('now'))
      `).run(userId, lessonId);

      // 2. Count total lessons in this course
      const totalLessons = db.prepare(`
        SELECT COUNT(*) as count FROM lessons WHERE course_id = ?
      `).get(courseId).count;

      // 3. Count distinct completed lessons for this employee in this course
      const completedLessons = db.prepare(`
        SELECT COUNT(DISTINCT lc.lesson_id) as count
        FROM lesson_completions lc
        JOIN lessons l ON lc.lesson_id = l.id
        WHERE lc.user_id = ? AND l.course_id = ?
      `).get(userId, courseId).count;

      // 4. Calculate progress percentage (0.0 - 100.0)
      const progressPercent = totalLessons > 0
        ? parseFloat(Math.min(100, (completedLessons / totalLessons) * 100).toFixed(1))
        : 100.0;

      const isCourseCompleted = (progressPercent >= 100.0);
      const status = isCourseCompleted ? 'completed' : 'in_progress';

      // 5. Upsert into learning_progress table
      const existingProgress = db.prepare(`
        SELECT id, started_at, completed_at FROM learning_progress WHERE user_id = ? AND course_id = ?
      `).get(userId, courseId);

      if (!existingProgress) {
        db.prepare(`
          INSERT INTO learning_progress (user_id, course_id, status, progress_percent, started_at, completed_at, last_activity_at)
          VALUES (?, ?, ?, ?, datetime('now'), ?, datetime('now'))
        `).run(userId, courseId, status, progressPercent, isCourseCompleted ? new Date().toISOString() : null);
      } else {
        db.prepare(`
          UPDATE learning_progress
          SET status = ?,
              progress_percent = ?,
              completed_at = CASE WHEN ? = 1 THEN COALESCE(completed_at, datetime('now')) ELSE completed_at END,
              last_activity_at = datetime('now')
          WHERE id = ?
        `).run(status, progressPercent, isCourseCompleted ? 1 : 0, existingProgress.id);
      }

      return {
        lesson_id: lesson.id,
        course_id: courseId,
        is_completed: true,
        progress: {
          progress_percent: progressPercent,
          status,
          completed_lessons: completedLessons,
          total_lessons: totalLessons
        }
      };
    });

    const result = completeTransaction();

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Learning Route] Error completing lesson:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not complete lesson.'
      }
    });
  }
});

/**
 * GET /api/quizzes
 * Lists all knowledge quizzes with course links, pass percentages, and user attempt summaries.
 */
router.get('/quizzes', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const quizzes = db.prepare(`
      SELECT q.id, q.course_id, q.competency_id, q.title, q.description, q.pass_percentage, q.created_at,
             c.code as course_code, c.title as course_title, c.domain as course_domain,
             comp.code as competency_code, comp.name as competency_name,
             (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as total_questions,
             (SELECT MAX(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as best_score,
             (SELECT MAX(qa.passed) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as has_passed,
             (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) as total_attempts
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN competencies comp ON q.competency_id = comp.id
      ORDER BY q.id ASC
    `).all(userId, userId, userId);

    return res.json({
      success: true,
      data: {
        quizzes: quizzes.map(q => ({
          ...q,
          has_passed: Boolean(q.has_passed)
        })),
        total_quizzes: quizzes.length
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error listing quizzes:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch quizzes catalogue.'
      }
    });
  }
});

/**
 * GET /api/quizzes/:id
 * Returns quiz details and questions for taking a quiz.
 * ANTI-CHEATING: NEVER exposes correct_option_index or explanation prior to submission!
 */
router.get('/quizzes/:id', requireAuth, (req, res) => {
  const quizId = Number(req.params.id);
  if (!quizId || isNaN(quizId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'QUIZ_NOT_FOUND',
        message: 'Invalid quiz identifier.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch quiz metadata
    const quiz = db.prepare(`
      SELECT q.id, q.course_id, q.competency_id, q.title, q.description, q.pass_percentage, q.created_at,
             c.code as course_code, c.title as course_title, c.domain as course_domain,
             comp.code as competency_code, comp.name as competency_name
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN competencies comp ON q.competency_id = comp.id
      WHERE q.id = ?
    `).get(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUIZ_NOT_FOUND',
          message: `Quiz with ID ${quizId} was not found.`
        }
      });
    }

    // Fetch questions - EXPLICITLY OMIT correct_option_index and explanation
    const questionRows = db.prepare(`
      SELECT id, quiz_id, question_text, options_json, sequence_order
      FROM quiz_questions
      WHERE quiz_id = ?
      ORDER BY sequence_order ASC, id ASC
    `).all(quizId);

    const questions = questionRows.map(q => ({
      id: q.id,
      quiz_id: q.quiz_id,
      question_text: q.question_text,
      options: JSON.parse(q.options_json),
      sequence_order: q.sequence_order
    }));

    // Fetch user prior attempts
    const attempts = db.prepare(`
      SELECT id, score, passed, attempted_at
      FROM quiz_attempts
      WHERE quiz_id = ? AND user_id = ?
      ORDER BY id DESC
    `).all(quizId, userId);

    const hasPassed = attempts.some(a => Boolean(a.passed));
    let bestScore = null;
    if (attempts.length > 0) {
      bestScore = Math.max(...attempts.map(a => a.score));
    }

    return res.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          course_id: quiz.course_id,
          course_code: quiz.course_code,
          course_title: quiz.course_title,
          course_domain: quiz.course_domain,
          competency_id: quiz.competency_id,
          competency_code: quiz.competency_code,
          competency_name: quiz.competency_name,
          title: quiz.title,
          description: quiz.description,
          pass_percentage: quiz.pass_percentage,
          total_questions: questions.length
        },
        questions,
        user_attempts: attempts.map(a => ({
          ...a,
          passed: Boolean(a.passed)
        })),
        user_best_score: bestScore,
        user_passed: hasPassed
      }
    });
  } catch (err) {
    console.error('[Learning Route] Error fetching quiz:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch quiz.'
      }
    });
  }
});

/**
 * POST /api/quizzes/:id/submit
 * Server-side evaluation of quiz answers.
 * Calculates score, determines pass/fail status, persists the attempt in SQLite,
 * and returns question-by-question review with explanations.
 * 
 * CRITICAL RULE: Learning MUST NOT overwrite or alter employee_competencies.baseline_score.
 */
router.post('/quizzes/:id/submit', requireAuth, (req, res) => {
  const quizId = Number(req.params.id);
  if (!quizId || isNaN(quizId)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'QUIZ_NOT_FOUND',
        message: 'Invalid quiz identifier.'
      }
    });
  }

  const { answers } = req.body || {};
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'An answers map (e.g. { questionId: selectedIndex }) is required.'
      }
    });
  }

  try {
    const db = getDb();
    const userId = req.user.id;

    // Verify quiz exists
    const quiz = db.prepare(`
      SELECT id, course_id, competency_id, title, pass_percentage
      FROM quizzes
      WHERE id = ?
    `).get(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUIZ_NOT_FOUND',
          message: `Quiz with ID ${quizId} was not found.`
        }
      });
    }

    // Fetch quiz questions including authoritative correct answer keys
    const questions = db.prepare(`
      SELECT id, quiz_id, question_text, options_json, correct_option_index, explanation, sequence_order
      FROM quiz_questions
      WHERE quiz_id = ?
      ORDER BY sequence_order ASC, id ASC
    `).all(quizId);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_QUIZ',
          message: 'No questions are associated with this quiz.'
        }
      });
    }

    // Evaluate answers strictly server-side
    let totalCorrect = 0;
    const questionReview = [];

    for (const q of questions) {
      const submittedOption = answers[q.id] !== undefined ? Number(answers[q.id]) : -1;
      const isCorrect = (submittedOption === q.correct_option_index);
      const options = JSON.parse(q.options_json);

      if (isCorrect) {
        totalCorrect += 1;
      }

      questionReview.push({
        question_id: q.id,
        question_text: q.question_text,
        submitted_option_index: submittedOption,
        submitted_option_text: options[submittedOption] !== undefined ? options[submittedOption] : 'Not answered',
        correct_option_index: q.correct_option_index,
        correct_option_text: options[q.correct_option_index],
        is_correct: isCorrect,
        explanation: q.explanation
      });
    }

    const totalQuestions = questions.length;
    const score = parseFloat(((totalCorrect / totalQuestions) * 100).toFixed(1));
    const passed = (score >= (quiz.pass_percentage || 70.0)) ? 1 : 0;

    // Persist attempt in quiz_attempts table
    const detailsJson = JSON.stringify({
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      pass_percentage: quiz.pass_percentage,
      question_review: questionReview
    });

    const attemptInsert = db.prepare(`
      INSERT INTO quiz_attempts (quiz_id, user_id, score, passed, details_json, attempted_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(quizId, userId, score, passed, detailsJson);

    return res.json({
      success: true,
      data: {
        attempt_id: attemptInsert.lastInsertRowid,
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        score,
        passed: Boolean(passed),
        pass_percentage: quiz.pass_percentage || 70.0,
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        question_review: questionReview
      }
    });
  } catch (err) {
    console.error('[Learning Route] Quiz submission error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while evaluating quiz answers.'
      }
    });
  }
});

/**
 * Placeholder endpoint: POST /api/courses/:id/enroll and /api/learning/courses/:id/enroll
 * Preserved for Stage 1 Core Test 16 compatibility.
 */
router.post('/courses/:id/enroll', requireAuth, (req, res) => {
  return res.status(501).json({
    success: false,
    error: {
      code: 'MODULE_UNDER_DEVELOPMENT',
      message: 'Course enrollment workflow is scheduled for Stage 3 (Owner: Pathika).'
    }
  });
});

module.exports = router;
