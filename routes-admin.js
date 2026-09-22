/**
 * NAVBODH - Admin Module Route Boundary & Enterprise Management Services
 *
 * Contributor Ownership: Palak (Stage 5: Admin + Integration)
 *
 * Responsibilities:
 *  - High-level workforce skill analytics & department matrix
 *  - Officer-level competency health inspection & growth monitoring
 *  - Learning content catalog curation & iGOT/NSSTA alignment overview
 *  - Question bank audit & quiz difficulty evaluation
 *  - System integration adapter status monitoring
 *  - Strict server-side role enforcement (requireRole('admin'))
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');
const { calculateGrowth, getLeaderboard } = require('./routes-gamification');
const { getIntegrationStatusData } = require('./routes-integrations');

const router = express.Router();

// Strict server-side role enforcement for all admin endpoints
router.use(requireAuth);
router.use(requireRole('admin'));

/**
 * GET /api/admin/overview
 * Comprehensive system statistics, workforce skill health, and recent audit logs.
 */
router.get('/overview', (req, res) => {
  try {
    const db = getDb();

    // 1. User & Officer Counts
    const userStats = db.prepare(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as total_employees,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users
    `).get();

    // Active employees (those who have at least one assessment attempt, lesson completion, or quiz attempt)
    const activeEmployeesCount = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM (
        SELECT user_id FROM assessment_attempts
        UNION
        SELECT user_id FROM lesson_completions
        UNION
        SELECT user_id FROM quiz_attempts
      )
    `).get().count;

    // 2. Department Breakdown
    const deptRows = db.prepare(`
      SELECT
        d.id,
        d.code,
        d.name,
        d.description,
        COUNT(u.id) as employee_count,
        COUNT(DISTINCT aa.user_id) as assessed_employees_count,
        ROUND(AVG(aa.overall_score), 1) as avg_assessment_score
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id AND u.role = 'employee'
      LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
      GROUP BY d.id
      ORDER BY d.id ASC
    `).all();

    // 3. Competency & Domain Overview
    const domainStats = db.prepare(`
      SELECT
        c.domain,
        COUNT(c.id) as total_competencies,
        ROUND(AVG(ec.baseline_score), 1) as avg_baseline_score,
        ROUND(AVG(ec.current_score), 1) as avg_current_score,
        ROUND(AVG(c.target_score), 1) as avg_target_score
      FROM competencies c
      LEFT JOIN employee_competencies ec ON c.id = ec.competency_id
      GROUP BY c.domain
      ORDER BY c.domain ASC
    `).all();

    const compCount = db.prepare('SELECT COUNT(*) as count FROM competencies').get().count;

    // Top identified workforce skill gaps (competencies with largest average deficiency among assessed officers)
    const topGaps = db.prepare(`
      SELECT
        c.id,
        c.code,
        c.name,
        c.domain,
        c.target_score,
        ROUND(AVG(ec.current_score), 1) as avg_current_score,
        ROUND(c.target_score - AVG(ec.current_score), 1) as avg_gap,
        COUNT(ec.id) as officers_assessed
      FROM competencies c
      JOIN employee_competencies ec ON c.id = ec.competency_id
      WHERE ec.current_score < c.target_score
      GROUP BY c.id
      ORDER BY avg_gap DESC
      LIMIT 5
    `).all();

    // 4. Assessment Activity
    const attemptStats = db.prepare(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_baseline = 1 THEN 1 ELSE 0 END) as baseline_attempts,
        SUM(CASE WHEN is_baseline = 0 THEN 1 ELSE 0 END) as subsequent_attempts,
        ROUND(AVG(overall_score), 1) as avg_overall_score
      FROM assessment_attempts
    `).get();

    const recentAttempts = db.prepare(`
      SELECT
        aa.id,
        aa.user_id,
        u.full_name as employee_name,
        u.username,
        u.designation,
        d.name as department_name,
        d.code as department_code,
        aa.overall_score,
        aa.is_baseline,
        aa.completed_at
      FROM assessment_attempts aa
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY aa.id DESC
      LIMIT 8
    `).all();

    // 5. Learning & Course Activity
    const courseStats = db.prepare(`
      SELECT
        COUNT(*) as total_courses,
        SUM(CASE WHEN source_label = 'sample_igot' THEN 1 ELSE 0 END) as igot_courses,
        SUM(CASE WHEN source_label = 'sample_nssta_tpac' THEN 1 ELSE 0 END) as nssta_courses,
        SUM(CASE WHEN source_label = 'local_demo' THEN 1 ELSE 0 END) as local_courses
      FROM courses
    `).get();

    const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;
    const materialCount = db.prepare('SELECT COUNT(*) as count FROM learning_materials').get().count;
    const quizCount = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;
    const quizQuestionCount = db.prepare('SELECT COUNT(*) as count FROM quiz_questions').get().count;

    const progressStats = db.prepare(`
      SELECT
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_enrollments,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_enrollments
      FROM learning_progress
    `).get();

    const lessonCompletionsCount = db.prepare('SELECT COUNT(*) as count FROM lesson_completions').get().count;

    const quizAttemptStats = db.prepare(`
      SELECT
        COUNT(*) as total_quiz_attempts,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_quiz_attempts,
        ROUND(AVG(score), 1) as avg_quiz_score
      FROM quiz_attempts
    `).get();

    // 6. Gamification & Reward Summary
    const rewardStats = db.prepare(`
      SELECT
        COUNT(*) as total_events,
        COALESCE(SUM(points), 0) as total_points_distributed
      FROM reward_ledger
    `).get();

    const achievementCount = db.prepare('SELECT COUNT(*) as count FROM employee_achievements').get().count;

    // Leaderboard top performers
    const fullLeaderboard = getLeaderboard();
    const topPerformers = fullLeaderboard.slice(0, 5);

    // 7. Integration Status Snapshot
    const integrationData = getIntegrationStatusData();

    return res.json({
      success: true,
      data: {
        summary: {
          total_users: userStats.total_users || 0,
          total_employees: userStats.total_employees || 0,
          total_admins: userStats.total_admins || 0,
          active_employees: activeEmployeesCount || 0,
          total_departments: deptRows.length,
          total_competencies: compCount,
          total_assessment_attempts: attemptStats.total_attempts || 0,
          total_sample_courses: courseStats.total_courses || 0,
          total_lessons: lessonCount,
          total_materials: materialCount,
          total_quizzes: quizCount,
          total_quiz_questions: quizQuestionCount,
          total_points_distributed: rewardStats.total_points_distributed || 0,
          total_achievements_unlocked: achievementCount
        },
        workforce_analytics: {
          departments: deptRows,
          domains: domainStats,
          top_skill_gaps: topGaps
        },
        assessment_metrics: {
          total_attempts: attemptStats.total_attempts || 0,
          baseline_attempts: attemptStats.baseline_attempts || 0,
          subsequent_attempts: attemptStats.subsequent_attempts || 0,
          avg_score: attemptStats.avg_overall_score || 0.0,
          recent_assessments: recentAttempts
        },
        learning_metrics: {
          courses_by_source: {
            igot: courseStats.igot_courses || 0,
            nssta: courseStats.nssta_courses || 0,
            local: courseStats.local_courses || 0
          },
          enrollments: {
            total: progressStats.total_enrollments || 0,
            completed: progressStats.completed_enrollments || 0,
            in_progress: progressStats.in_progress_enrollments || 0
          },
          lesson_completions: lessonCompletionsCount,
          quiz_attempts: {
            total: quizAttemptStats.total_quiz_attempts || 0,
            passed: quizAttemptStats.passed_quiz_attempts || 0,
            avg_score: quizAttemptStats.avg_quiz_score || 0.0,
            pass_rate: quizAttemptStats.total_quiz_attempts > 0
              ? parseFloat(((quizAttemptStats.passed_quiz_attempts / quizAttemptStats.total_quiz_attempts) * 100).toFixed(1))
              : 0.0
          }
        },
        gamification_metrics: {
          total_events: rewardStats.total_events || 0,
          total_points: rewardStats.total_points_distributed || 0,
          achievements_unlocked: achievementCount,
          top_performers: topPerformers
        },
        integrations_summary: {
          ai_assistant: integrationData.adapters.ai_assistant.status,
          igot_karmayogi: integrationData.adapters.igot_karmayogi.status,
          nssta_tpac: integrationData.adapters.nssta_tpac.status,
          sqlite_database: integrationData.adapters.sqlite_database.status
        },
        admin_user: {
          id: req.user.id,
          username: req.user.username,
          full_name: req.user.full_name,
          role: req.user.role,
          designation: req.user.designation,
          department_name: req.user.department_name
        }
      }
    });
  } catch (err) {
    console.error('[Admin Route] Overview error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_OVERVIEW_ERROR',
        message: 'Could not fetch admin overview data.'
      }
    });
  }
});

/**
 * GET /api/admin/employees
 * List all official employees with aggregated competency, learning, and growth metrics.
 * Excludes all sensitive authentication secrets.
 */
router.get('/employees', (req, res) => {
  try {
    const db = getDb();
    const { department_id, search } = req.query;

    let query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.designation,
        u.department_id,
        d.name as department_name,
        d.code as department_code,
        u.cadre,
        u.phone,
        u.bio,
        u.avatar_url,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee'
    `;
    const params = [];

    if (department_id) {
      query += ` AND u.department_id = ?`;
      params.push(Number(department_id));
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.designation) LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY u.id ASC`;

    const employees = db.prepare(query).all(...params);

    // Aggregate metrics per employee
    const enrichedEmployees = employees.map(emp => {
      // 1. Growth & Baseline calculation using Stage 4 Gamification Engine
      const growth = calculateGrowth(emp.id);

      // 2. Assessment history
      const assessStats = db.prepare(`
        SELECT
          COUNT(*) as total_attempts,
          MAX(completed_at) as last_assessed_at,
          SUM(CASE WHEN is_baseline = 1 THEN 1 ELSE 0 END) as has_baseline_attempt
        FROM assessment_attempts
        WHERE user_id = ?
      `).get(emp.id);

      const latestAttempt = db.prepare(`
        SELECT overall_score, is_baseline, completed_at
        FROM assessment_attempts
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
      `).get(emp.id);

      // 3. Learning Progress
      const learningStats = db.prepare(`
        SELECT
          COUNT(*) as enrolled_courses,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_courses,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_courses
        FROM learning_progress
        WHERE user_id = ?
      `).get(emp.id);

      const lessonsCompleted = db.prepare(`
        SELECT COUNT(*) as count
        FROM lesson_completions
        WHERE user_id = ?
      `).get(emp.id).count;

      // 4. Quiz Activity
      const quizStats = db.prepare(`
        SELECT
          COUNT(*) as total_attempts,
          SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_attempts,
          ROUND(AVG(score), 1) as avg_score
        FROM quiz_attempts
        WHERE user_id = ?
      `).get(emp.id);

      // 5. Gamification Points & Achievements
      const rewardPoints = db.prepare(`
        SELECT COALESCE(SUM(points), 0) as total
        FROM reward_ledger
        WHERE user_id = ?
      `).get(emp.id).total;

      const achievementCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM employee_achievements
        WHERE user_id = ?
      `).get(emp.id).count;

      // 6. Detailed Competency Breakdown
      const compBreakdown = db.prepare(`
        SELECT
          c.id as competency_id,
          c.code as competency_code,
          c.name as competency_name,
          c.domain,
          c.target_score,
          COALESCE(ec.baseline_score, 0.0) as baseline_score,
          COALESCE(ec.current_score, 0.0) as current_score,
          CASE WHEN ec.current_score >= c.target_score THEN 1 ELSE 0 END as is_met,
          ROUND(MAX(0, c.target_score - COALESCE(ec.current_score, 0.0)), 1) as gap
        FROM competencies c
        LEFT JOIN employee_competencies ec ON c.id = ec.competency_id AND ec.user_id = ?
        ORDER BY c.domain ASC, c.id ASC
      `).all(emp.id);

      return {
        id: emp.id,
        username: emp.username,
        email: emp.email,
        full_name: emp.full_name,
        designation: emp.designation,
        department_id: emp.department_id,
        department_name: emp.department_name || 'Unassigned',
        department_code: emp.department_code || '--',
        cadre: emp.cadre,
        phone: emp.phone,
        bio: emp.bio,
        avatar_url: emp.avatar_url,
        created_at: emp.created_at,
        competency_metrics: {
          assessed_count: growth.count,
          total_competencies: compBreakdown.length,
          avg_baseline_score: growth.avgBaseline,
          avg_current_score: growth.avgCurrent,
          growth_percent: growth.growthPercent,
          growth_display: growth.growthDisplay,
          has_baseline: growth.hasBaseline,
          is_zero_baseline: growth.isZeroBaseline,
          competencies: compBreakdown
        },
        assessment_metrics: {
          has_completed_assessment: (assessStats.total_attempts || 0) > 0,
          total_attempts: assessStats.total_attempts || 0,
          last_assessed_at: assessStats.last_assessed_at || null,
          latest_score: latestAttempt ? latestAttempt.overall_score : null
        },
        learning_metrics: {
          enrolled_courses: learningStats.enrolled_courses || 0,
          completed_courses: learningStats.completed_courses || 0,
          in_progress_courses: learningStats.in_progress_courses || 0,
          lessons_completed: lessonsCompleted || 0
        },
        quiz_metrics: {
          quizzes_attempted: quizStats.total_attempts || 0,
          quizzes_passed: quizStats.passed_attempts || 0,
          avg_score: quizStats.avg_score || 0.0
        },
        gamification_metrics: {
          total_points: rewardPoints || 0,
          achievements_count: achievementCount || 0
        }
      };
    });

    return res.json({
      success: true,
      data: {
        total_count: enrichedEmployees.length,
        employees: enrichedEmployees
      }
    });
  } catch (err) {
    console.error('[Admin Route] Employees error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_EMPLOYEES_ERROR',
        message: 'Could not fetch employee roster data.'
      }
    });
  }
});

/**
 * GET /api/admin/content
 * Structured learning catalog, lesson curriculum, competency linkages, and quiz review.
 */
router.get('/content', (req, res) => {
  try {
    const db = getDb();

    // 1. All Courses with mapped competencies and lessons
    const courseRows = db.prepare(`
      SELECT
        c.id,
        c.code,
        c.title,
        c.description,
        c.source_label,
        c.duration_hours,
        c.difficulty_level,
        c.domain,
        c.is_active,
        c.created_at
      FROM courses c
      ORDER BY c.id ASC
    `).all();

    const enrichedCourses = courseRows.map(crs => {
      // Lessons for this course
      const lessons = db.prepare(`
        SELECT
          l.id,
          l.title,
          l.sequence_order,
          l.content_summary,
          l.duration_minutes,
          COUNT(lm.id) as materials_count
        FROM lessons l
        LEFT JOIN learning_materials lm ON l.id = lm.lesson_id
        WHERE l.course_id = ?
        GROUP BY l.id
        ORDER BY l.sequence_order ASC
      `).all(crs.id);

      // Attached Quiz
      const quiz = db.prepare(`
        SELECT
          q.id,
          q.title,
          q.pass_percentage,
          COUNT(qq.id) as question_count
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        WHERE q.course_id = ?
        GROUP BY q.id
      `).get(crs.id);

      // Mapped Competencies
      const mappedComps = db.prepare(`
        SELECT
          comp.id,
          comp.code,
          comp.name,
          comp.domain,
          comp.target_score,
          cc.growth_impact_score
        FROM course_competencies cc
        JOIN competencies comp ON cc.competency_id = comp.id
        WHERE cc.course_id = ?
      `).all(crs.id);

      // Enrollment / Completion stats
      const enrollStats = db.prepare(`
        SELECT
          COUNT(*) as total_enrolled,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed
        FROM learning_progress
        WHERE course_id = ?
      `).get(crs.id);

      let sourceDisplayName = 'Local Catalog';
      if (crs.source_label === 'sample_igot') {
        sourceDisplayName = 'Sample iGOT-Karmayogi Catalog (Demo)';
      } else if (crs.source_label === 'sample_nssta_tpac') {
        sourceDisplayName = 'Sample NSSTA TPAC Training Module (Demo)';
      }

      return {
        id: crs.id,
        code: crs.code,
        title: crs.title,
        description: crs.description,
        source_label: crs.source_label,
        source_display_name: sourceDisplayName,
        duration_hours: crs.duration_hours,
        difficulty_level: crs.difficulty_level,
        domain: crs.domain,
        is_active: Boolean(crs.is_active),
        lessons_count: lessons.length,
        lessons,
        quiz: quiz ? {
          id: quiz.id,
          title: quiz.title,
          pass_percentage: quiz.pass_percentage,
          question_count: quiz.question_count
        } : null,
        mapped_competencies: mappedComps,
        enrollment_stats: {
          enrolled_count: enrollStats.total_enrolled || 0,
          completed_count: enrollStats.total_completed || 0
        }
      };
    });

    // 2. All Competencies & their course linkages
    const compRows = db.prepare(`
      SELECT
        c.id,
        c.code,
        c.name,
        c.domain,
        c.description,
        c.target_score,
        COUNT(DISTINCT cc.course_id) as linked_courses_count,
        COUNT(DISTINCT aq.id) as assessment_questions_count
      FROM competencies c
      LEFT JOIN course_competencies cc ON c.id = cc.competency_id
      LEFT JOIN assessment_questions aq ON c.id = aq.competency_id
      GROUP BY c.id
      ORDER BY c.domain ASC, c.id ASC
    `).all();

    // 3. All Quizzes & Questions
    const quizRows = db.prepare(`
      SELECT
        q.id,
        q.title,
        q.description,
        q.pass_percentage,
        q.course_id,
        c.title as course_title,
        c.code as course_code,
        COUNT(qq.id) as question_count
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      GROUP BY q.id
      ORDER BY q.id ASC
    `).all();

    // 4. Learning Materials Summary
    const materialSummary = db.prepare(`
      SELECT
        material_type,
        COUNT(*) as count
      FROM learning_materials
      GROUP BY material_type
    `).all();

    return res.json({
      success: true,
      data: {
        summary: {
          total_courses: enrichedCourses.length,
          total_lessons: enrichedCourses.reduce((sum, c) => sum + c.lessons_count, 0),
          total_competencies: compRows.length,
          total_quizzes: quizRows.length,
          total_materials: materialSummary.reduce((sum, m) => sum + m.count, 0)
        },
        courses: enrichedCourses,
        competencies: compRows,
        quizzes: quizRows,
        materials_by_type: materialSummary
      }
    });
  } catch (err) {
    console.error('[Admin Route] Content error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_CONTENT_ERROR',
        message: 'Could not fetch admin content catalog.'
      }
    });
  }
});

/**
 * GET /api/admin/workforce-insights
 * Division-level competency heatmaps and institutional training demand matrix.
 */
router.get('/workforce-insights', (req, res) => {
  try {
    const db = getDb();

    // Department skill matrix
    const matrix = db.prepare(`
      SELECT
        d.id as department_id,
        d.name as department_name,
        d.code as department_code,
        c.domain,
        ROUND(AVG(COALESCE(ec.baseline_score, 0.0)), 1) as avg_baseline,
        ROUND(AVG(COALESCE(ec.current_score, 0.0)), 1) as avg_current,
        ROUND(AVG(c.target_score), 1) as avg_target,
        ROUND(AVG(MAX(0, c.target_score - COALESCE(ec.current_score, 0.0))), 1) as avg_gap
      FROM departments d
      CROSS JOIN competencies c
      LEFT JOIN users u ON d.id = u.department_id AND u.role = 'employee'
      LEFT JOIN employee_competencies ec ON u.id = ec.user_id AND c.id = ec.competency_id
      GROUP BY d.id, c.domain
      ORDER BY d.id ASC, c.domain ASC
    `).all();

    // High training priority competencies across workforce
    const highPriorityNeeds = db.prepare(`
      SELECT
        c.id,
        c.code,
        c.name,
        c.domain,
        c.target_score,
        ROUND(AVG(COALESCE(ec.current_score, 0.0)), 1) as workforce_avg_score,
        COUNT(CASE WHEN ec.current_score < c.target_score THEN 1 END) as officers_below_benchmark,
        COUNT(u.id) as total_officers_evaluated
      FROM competencies c
      LEFT JOIN employee_competencies ec ON c.id = ec.competency_id
      LEFT JOIN users u ON ec.user_id = u.id AND u.role = 'employee'
      GROUP BY c.id
      HAVING officers_below_benchmark > 0
      ORDER BY officers_below_benchmark DESC, workforce_avg_score ASC
    `).all();

    return res.json({
      success: true,
      data: {
        department_domain_matrix: matrix,
        high_priority_training_needs: highPriorityNeeds
      }
    });
  } catch (err) {
    console.error('[Admin Route] Workforce insights error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'WORKFORCE_INSIGHTS_ERROR',
        message: 'Could not fetch workforce insights.'
      }
    });
  }
});

/**
 * GET /api/admin/learning-content
 * Alias for admin content management view.
 */
router.get('/learning-content', (req, res) => {
  // Re-route to content handler
  req.url = '/content';
  return router.handle(req, res);
});

/**
 * GET /api/admin/quiz-review
 * Audit questions bank, difficulty breakdown, and quiz item analysis.
 */
router.get('/quiz-review', (req, res) => {
  try {
    const db = getDb();

    const quizzes = db.prepare(`
      SELECT
        q.id,
        q.title,
        q.pass_percentage,
        c.title as course_title,
        c.code as course_code
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      ORDER BY q.id ASC
    `).all();

    const questionsWithStats = db.prepare(`
      SELECT
        qq.id,
        qq.quiz_id,
        q.title as quiz_title,
        qq.sequence_order,
        qq.question_text,
        qq.explanation,
        qq.options_json
      FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      ORDER BY qq.quiz_id ASC, qq.sequence_order ASC
    `).all().map(item => {
      let options = [];
      try {
        options = JSON.parse(item.options_json);
      } catch (e) {
        options = [];
      }
      return {
        id: item.id,
        quiz_id: item.quiz_id,
        quiz_title: item.quiz_title,
        sequence_order: item.sequence_order,
        question_text: item.question_text,
        explanation: item.explanation,
        options_count: options.length
      };
    });

    const attemptsSummary = db.prepare(`
      SELECT
        quiz_id,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_attempts,
        ROUND(AVG(score), 1) as avg_score
      FROM quiz_attempts
      GROUP BY quiz_id
    `).all();

    return res.json({
      success: true,
      data: {
        quizzes,
        questions: questionsWithStats,
        attempts_summary: attemptsSummary
      }
    });
  } catch (err) {
    console.error('[Admin Route] Quiz review error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUIZ_REVIEW_ERROR',
        message: 'Could not fetch quiz review data.'
      }
    });
  }
});

/**
 * GET /api/admin/integrations
 * Administrator view of adapter status.
 */
router.get('/integrations', (req, res) => {
  try {
    const data = getIntegrationStatusData();
    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('[Admin Route] Integrations error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_INTEGRATIONS_ERROR',
        message: 'Could not fetch integrations status.'
      }
    });
  }
});

module.exports = router;
