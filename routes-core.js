const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');
const { syncUserGamification } = require('./routes-gamification');

const router = express.Router();

/**
 * GET /api/health
 * Public health-check endpoint.
 */
router.get('/health', (req, res) => {
  try {
    const db = getDb();
    const check = db.prepare('SELECT 1 as ok').get();

    return res.json({
      success: true,
      data: {
        status: 'healthy',
        database: check && check.ok === 1 ? 'connected' : 'degraded',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Database connectivity failed.'
      }
    });
  }
});

/**
 * GET /api/departments
 * List all official departments/divisions.
 */
router.get('/departments', (req, res) => {
  try {
    const db = getDb();
    const departments = db.prepare('SELECT id, code, name, description FROM departments ORDER BY id ASC').all();
    return res.json({
      success: true,
      data: {
        departments
      }
    });
  } catch (err) {
    console.error('[Core Route] Error fetching departments:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch departments.'
      }
    });
  }
});

/**
 * GET /api/competencies
 * List all representative competencies grouped and categorized by domain.
 */
router.get('/competencies', (req, res) => {
  try {
    const db = getDb();
    const competencies = db.prepare(`
      SELECT id, code, name, domain, description, target_score
      FROM competencies
      ORDER BY
        CASE domain
          WHEN 'Statistical' THEN 1
          WHEN 'Technical' THEN 2
          WHEN 'Digital Governance' THEN 3
          WHEN 'Behavioural / Managerial' THEN 4
          ELSE 5
        END,
        id ASC
    `).all();

    // Grouping by domain
    const domains = {};
    for (const comp of competencies) {
      if (!domains[comp.domain]) {
        domains[comp.domain] = [];
      }
      domains[comp.domain].push(comp);
    }

    return res.json({
      success: true,
      data: {
        competencies,
        domains,
        total_competencies: competencies.length
      }
    });
  } catch (err) {
    console.error('[Core Route] Error fetching competencies:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch competencies.'
      }
    });
  }
});

/**
 * GET /api/profile
 * Returns the authenticated employee's full profile, department, baseline status, and competency scores.
 */
router.get('/profile', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.designation,
             u.department_id, u.cadre, u.phone, u.bio, u.avatar_url, u.created_at, u.updated_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.'
        }
      });
    }

    // Fetch employee competencies
    const userCompetencies = db.prepare(`
      SELECT ec.competency_id, ec.baseline_score, ec.current_score, ec.target_score, ec.last_assessed_at,
             c.code, c.name, c.domain, c.description
      FROM employee_competencies ec
      JOIN competencies c ON ec.competency_id = c.id
      WHERE ec.user_id = ?
      ORDER BY
        CASE c.domain
          WHEN 'Statistical' THEN 1
          WHEN 'Technical' THEN 2
          WHEN 'Digital Governance' THEN 3
          WHEN 'Behavioural / Managerial' THEN 4
          ELSE 5
        END,
        c.id ASC
    `).all(req.user.id);

    // Fetch assessment history summary
    const attempts = db.prepare(`
      SELECT id, attempt_number, is_baseline, overall_score, completed_at
      FROM assessment_attempts
      WHERE user_id = ?
      ORDER BY attempt_number ASC
    `).all(req.user.id);

    const hasBaseline = attempts.some(a => a.is_baseline === 1 || a.is_baseline === true);

    // Compute average baseline & current score
    let totalBaseline = 0;
    let totalCurrent = 0;
    const count = userCompetencies.length;

    for (const uc of userCompetencies) {
      totalBaseline += (uc.baseline_score || 0);
      totalCurrent += (uc.current_score || 0);
    }

    const avgBaseline = count > 0 ? parseFloat((totalBaseline / count).toFixed(1)) : 0;
    const avgCurrent = count > 0 ? parseFloat((totalCurrent / count).toFixed(1)) : 0;
    const growthPercent = avgBaseline > 0
      ? parseFloat((((avgCurrent - avgBaseline) / avgBaseline) * 100).toFixed(1))
      : 0;

    return res.json({
      success: true,
      data: {
        profile: user,
        has_baseline: hasBaseline,
        metrics: {
          average_baseline_score: avgBaseline,
          average_current_score: avgCurrent,
          growth_percentage: growthPercent,
          assessed_competencies_count: count,
          total_attempts: attempts.length
        },
        competencies: userCompetencies,
        recent_attempts: attempts
      }
    });
  } catch (err) {
    console.error('[Core Route] Error fetching profile:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch profile.'
      }
    });
  }
});

/**
 * PATCH /api/profile
 * Allows updating current user's profile details.
 */
router.patch('/profile', requireAuth, (req, res) => {
  const { full_name, phone, bio, designation, department_id, cadre } = req.body || {};

  try {
    const db = getDb();

    // Check user exists
    const currentUser = db.prepare('SELECT id, department_id FROM users WHERE id = ?').get(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    // Validate full_name if provided
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Full name cannot be empty.'
          }
        });
      }
    }

    // Validate department_id if provided
    let validDeptId = currentUser.department_id;
    if (department_id !== undefined && department_id !== null) {
      const dept = db.prepare('SELECT id FROM departments WHERE id = ?').get(Number(department_id));
      if (!dept) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DEPARTMENT',
            message: 'Specified department does not exist.'
          }
        });
      }
      validDeptId = dept.id;
    }

    // Update fields
    const updatedFullName = full_name !== undefined ? full_name.trim() : req.user.full_name;
    const updatedPhone = phone !== undefined ? String(phone).trim() : (req.user.phone || null);
    const updatedBio = bio !== undefined ? String(bio).trim() : (req.user.bio || null);
    const updatedDesignation = designation !== undefined ? String(designation).trim() : (req.user.designation || null);
    const updatedCadre = cadre !== undefined ? String(cadre).trim() : (req.user.cadre || null);

    db.prepare(`
      UPDATE users
      SET full_name = ?, phone = ?, bio = ?, designation = ?, department_id = ?, cadre = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updatedFullName, updatedPhone, updatedBio, updatedDesignation, validDeptId, updatedCadre, req.user.id);

    // Fetch updated user with department details
    const updatedUser = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.designation,
             u.department_id, u.cadre, u.phone, u.bio, u.avatar_url, u.updated_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(req.user.id);

    return res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Profile updated successfully.'
      }
    });
  } catch (err) {
    console.error('[Core Route] Error updating profile:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not update profile.'
      }
    });
  }
});

/**
 * GET /api/assessment
 * Returns assessment metadata and questions WITHOUT exposing correct answers or explanations.
 */
router.get('/assessment', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const assessment = db.prepare(`
      SELECT id, code, title, description, type, total_questions
      FROM assessments
      WHERE is_active = 1
      ORDER BY id ASC
      LIMIT 1
    `).get();

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'No active assessment found.'
        }
      });
    }

    // Fetch questions - explicitly omit correct_option_index and explanation
    const questionRows = db.prepare(`
      SELECT aq.id, aq.assessment_id, aq.competency_id, aq.question_text, aq.options_json, aq.difficulty,
             c.code as competency_code, c.name as competency_name, c.domain as domain
      FROM assessment_questions aq
      JOIN competencies c ON aq.competency_id = c.id
      WHERE aq.assessment_id = ?
      ORDER BY
        CASE c.domain
          WHEN 'Statistical' THEN 1
          WHEN 'Technical' THEN 2
          WHEN 'Digital Governance' THEN 3
          WHEN 'Behavioural / Managerial' THEN 4
          ELSE 5
        END,
        aq.id ASC
    `).all(assessment.id);

    const questions = questionRows.map(q => ({
      id: q.id,
      competency_id: q.competency_id,
      competency_code: q.competency_code,
      competency_name: q.competency_name,
      domain: q.domain,
      question_text: q.question_text,
      options: JSON.parse(q.options_json),
      difficulty: q.difficulty
    }));

    // Check if user has prior attempts
    const attemptsCount = db.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?
    `).get(req.user.id).count;

    return res.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          code: assessment.code,
          title: assessment.title,
          description: assessment.description,
          type: assessment.type,
          total_questions: questions.length
        },
        has_baseline: attemptsCount > 0,
        prior_attempts_count: attemptsCount,
        questions
      }
    });
  } catch (err) {
    console.error('[Core Route] Error fetching assessment:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch assessment questions.'
      }
    });
  }
});

/**
 * POST /api/assessment/submit
 * Evaluates submitted answers, creates baseline on first attempt (never overwritten),
 * updates current scores, and persists the assessment attempt.
 */
router.post('/assessment/submit', requireAuth, (req, res) => {
  const { assessment_id, answers } = req.body || {};

  if (!assessment_id || !answers || typeof answers !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'assessment_id and answers map are required.'
      }
    });
  }

  try {
    const db = getDb();

    // Verify assessment exists
    const assessment = db.prepare('SELECT id, code, title FROM assessments WHERE id = ?').get(assessment_id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment does not exist.'
        }
      });
    }

    // Fetch all questions for this assessment including correct answers
    const questions = db.prepare(`
      SELECT aq.id, aq.competency_id, aq.correct_option_index, aq.explanation, aq.question_text, aq.options_json,
             c.code as competency_code, c.name as competency_name, c.domain as domain, c.target_score
      FROM assessment_questions aq
      JOIN competencies c ON aq.competency_id = c.id
      WHERE aq.assessment_id = ?
    `).all(assessment_id);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_ASSESSMENT',
          message: 'No questions associated with this assessment.'
        }
      });
    }

    // Evaluate answers
    let totalQuestions = questions.length;
    let totalCorrect = 0;
    const competencyStats = {};
    const questionReview = [];

    for (const q of questions) {
      const submittedOption = answers[q.id] !== undefined ? Number(answers[q.id]) : -1;
      const isCorrect = (submittedOption === q.correct_option_index);
      const options = JSON.parse(q.options_json);

      if (isCorrect) {
        totalCorrect += 1;
      }

      if (!competencyStats[q.competency_id]) {
        competencyStats[q.competency_id] = {
          competency_id: q.competency_id,
          code: q.competency_code,
          name: q.competency_name,
          domain: q.domain,
          target_score: q.target_score || 80.0,
          total: 0,
          correct: 0
        };
      }

      competencyStats[q.competency_id].total += 1;
      if (isCorrect) {
        competencyStats[q.competency_id].correct += 1;
      }

      questionReview.push({
        question_id: q.id,
        question_text: q.question_text,
        submitted_option_index: submittedOption,
        submitted_option_text: options[submittedOption] || 'Not answered',
        correct_option_index: q.correct_option_index,
        correct_option_text: options[q.correct_option_index],
        is_correct: isCorrect,
        explanation: q.explanation,
        competency_name: q.competency_name,
        domain: q.domain
      });
    }

    const overallScore = parseFloat(((totalCorrect / totalQuestions) * 100).toFixed(1));

    // Check existing attempts to determine if this is the FIRST (baseline) attempt
    const existingAttempts = db.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?
    `).get(req.user.id);

    const isBaseline = (existingAttempts.count === 0);
    const attemptNumber = existingAttempts.count + 1;

    // Database transaction to persist attempt and update employee competencies
    const persistTransaction = db.transaction(() => {
      // 1. Process competency scores
      const compResults = [];

      for (const compIdStr of Object.keys(competencyStats)) {
        const stats = competencyStats[compIdStr];
        const computedScore = parseFloat(((stats.correct / stats.total) * 100).toFixed(1));

        // Check if employee already has a record for this competency
        const existingEmpComp = db.prepare(`
          SELECT id, baseline_score, current_score, target_score
          FROM employee_competencies
          WHERE user_id = ? AND competency_id = ?
        `).get(req.user.id, stats.competency_id);

        let finalBaseline = 0;
        let finalCurrent = computedScore;

        if (!existingEmpComp) {
          // Brand new record
          finalBaseline = isBaseline ? computedScore : 0.0;
          db.prepare(`
            INSERT INTO employee_competencies (user_id, competency_id, baseline_score, current_score, target_score, last_assessed_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).run(req.user.id, stats.competency_id, finalBaseline, finalCurrent, stats.target_score);
        } else {
          // Existing record:
          // CRITICAL BASELINE RULE:
          // If this is the baseline attempt, set baseline_score.
          // If NOT baseline attempt, PRESERVE existing baseline_score and ONLY update current_score!
          if (isBaseline) {
            finalBaseline = computedScore;
            db.prepare(`
              UPDATE employee_competencies
              SET baseline_score = ?, current_score = ?, last_assessed_at = datetime('now'), updated_at = datetime('now')
              WHERE id = ?
            `).run(finalBaseline, finalCurrent, existingEmpComp.id);
          } else {
            finalBaseline = existingEmpComp.baseline_score;
            db.prepare(`
              UPDATE employee_competencies
              SET current_score = ?, last_assessed_at = datetime('now'), updated_at = datetime('now')
              WHERE id = ?
            `).run(finalCurrent, existingEmpComp.id);
          }
        }

        compResults.push({
          competency_id: stats.competency_id,
          code: stats.code,
          name: stats.name,
          domain: stats.domain,
          score: computedScore,
          target_score: stats.target_score,
          baseline_score: finalBaseline,
          current_score: finalCurrent
        });
      }

      // 2. Persist assessment attempt record
      const detailsPayload = JSON.stringify({
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        overall_score: overallScore,
        competency_results: compResults,
        question_review: questionReview
      });

      const attemptInsert = db.prepare(`
        INSERT INTO assessment_attempts (assessment_id, user_id, attempt_number, is_baseline, overall_score, details_json, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        assessment_id,
        req.user.id,
        attemptNumber,
        isBaseline ? 1 : 0,
        overallScore,
        detailsPayload
      );

      return {
        attempt_id: attemptInsert.lastInsertRowid,
        attempt_number: attemptNumber,
        is_baseline: isBaseline,
        overall_score: overallScore,
        total_correct: totalCorrect,
        total_questions: totalQuestions,
        results: compResults,
        question_review: questionReview
      };
    });

    const result = persistTransaction();

    // Trigger Gamification event sync
    try {
      syncUserGamification(req.user.id);
    } catch (gErr) {
      console.error('[Gamification] Error syncing after assessment submission:', gErr.message);
    }

    return res.json({
      success: true,
      data: {
        attempt_id: result.attempt_id,
        attempt_number: result.attempt_number,
        is_baseline: result.is_baseline,
        overall_score: result.overall_score,
        total_correct: result.total_correct,
        total_questions: result.total_questions,
        results: result.results,
        question_review: result.question_review
      }
    });
  } catch (err) {
    console.error('[Core Route] Assessment submission error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while evaluating and persisting assessment.'
      }
    });
  }
});

/**
 * GET /api/assessment/result
 * Returns the most recent assessment results for the authenticated employee.
 */
router.get('/assessment/result', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const latestAttempt = db.prepare(`
      SELECT id, assessment_id, attempt_number, is_baseline, overall_score, details_json, completed_at
      FROM assessment_attempts
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(req.user.id);

    if (!latestAttempt) {
      return res.json({
        success: true,
        data: {
          has_result: false,
          message: 'No completed assessment found for this user.'
        }
      });
    }

    const details = JSON.parse(latestAttempt.details_json || '{}');

    // Fetch current competencies from DB to guarantee live state
    const currentCompetencies = db.prepare(`
      SELECT ec.competency_id, ec.baseline_score, ec.current_score, ec.target_score, ec.last_assessed_at,
             c.code, c.name, c.domain, c.description
      FROM employee_competencies ec
      JOIN competencies c ON ec.competency_id = c.id
      WHERE ec.user_id = ?
      ORDER BY
        CASE c.domain
          WHEN 'Statistical' THEN 1
          WHEN 'Technical' THEN 2
          WHEN 'Digital Governance' THEN 3
          WHEN 'Behavioural / Managerial' THEN 4
          ELSE 5
        END,
        c.id ASC
    `).all(req.user.id);

    return res.json({
      success: true,
      data: {
        has_result: true,
        attempt_id: latestAttempt.id,
        attempt_number: latestAttempt.attempt_number,
        is_baseline: Boolean(latestAttempt.is_baseline),
        overall_score: latestAttempt.overall_score,
        completed_at: latestAttempt.completed_at,
        competencies: currentCompetencies,
        question_review: details.question_review || []
      }
    });
  } catch (err) {
    console.error('[Core Route] Error fetching assessment result:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch assessment result.'
      }
    });
  }
});

module.exports = router;
