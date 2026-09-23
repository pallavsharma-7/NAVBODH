/**
 * NAVBODH - Gamification Module Route Boundary & Service Engine
 * 
 * Contributor Ownership: Pallav (Stage 4: Gamification)
 * Responsibilities:
 *  - Persistent, idempotent reward event ledger (reward_ledger with event_key UNIQUE)
 *  - Baseline-aware growth calculation: ((Current - Baseline) / Baseline) * 100
 *  - Safe zero-baseline handling (baseline = 0 -> "New Skill", non-infinite, non-NaN)
 *  - Growth milestone detection (10%, 20%, 35%, 50%)
 *  - Activity date-based learning streak engine
 *  - Idempotent achievement unlocking (employee_achievements UNIQUE constraint)
 *  - Deterministic leaderboard engine (Growth % -> Points -> Completions -> Employee ID)
 *  - Session-scoped identity via req.user.id
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * ------------------------------------------------------------------
 * GAMIFICATION SERVICE ENGINE
 * ------------------------------------------------------------------
 */

/**
 * 1. Growth Calculation Engine
 * Baseline score is strictly IMMUTABLE & READ-ONLY.
 * Growth % = ((Current Score - Baseline Score) / Baseline Score) * 100
 * Safely handles Baseline = 0 without producing Infinity, -Infinity, NaN, or undefined.
 */
function calculateGrowth(userId) {
  const db = getDb();
  const comps = db.prepare(`
    SELECT baseline_score, current_score
    FROM employee_competencies
    WHERE user_id = ?
  `).all(userId);

  if (!comps || comps.length === 0) {
    return {
      avgBaseline: 0,
      avgCurrent: 0,
      growthPercent: 0.0,
      growthDisplay: '0.0%',
      isZeroBaseline: true,
      hasBaseline: false,
      count: 0
    };
  }

  let totalBaseline = 0;
  let totalCurrent = 0;
  for (const c of comps) {
    totalBaseline += (c.baseline_score || 0);
    totalCurrent += (c.current_score || 0);
  }

  const count = comps.length;
  const avgBaseline = parseFloat((totalBaseline / count).toFixed(1));
  const avgCurrent = parseFloat((totalCurrent / count).toFixed(1));

  let growthPercent = 0.0;
  let growthDisplay = '0.0%';
  let isZeroBaseline = false;
  let hasBaseline = true;

  if (avgBaseline === 0) {
    isZeroBaseline = true;
    hasBaseline = false;
    if (avgCurrent > 0) {
      growthDisplay = `New Skill (+${avgCurrent} pts)`;
    } else {
      growthDisplay = '0.0%';
    }
  } else {
    growthPercent = parseFloat((((avgCurrent - avgBaseline) / avgBaseline) * 100).toFixed(1));
    if (isNaN(growthPercent) || !isFinite(growthPercent)) {
      growthPercent = 0.0;
    }
    // Bound growth percentage appropriately
    growthPercent = Math.max(0, Math.min(1000, growthPercent));
    growthDisplay = `${growthPercent >= 0 ? '+' : ''}${growthPercent}%`;
  }

  return {
    avgBaseline,
    avgCurrent,
    growthPercent,
    growthDisplay,
    isZeroBaseline,
    hasBaseline,
    count
  };
}

/**
 * 2. Idempotent Reward Ledger Event Recorder
 * Uses INSERT OR IGNORE with event_key UNIQUE constraint to prevent duplicate rewards.
 */
function awardEvent(userId, eventType, points, description, eventKey) {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO reward_ledger (user_id, event_type, points, description, event_key, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(userId, eventType, points, description, eventKey);
    return result.changes > 0;
  } catch (err) {
    console.error('[Gamification] Error inserting reward event:', err.message);
    return false;
  }
}

/**
 * 3. Idempotent Achievement Unlock Engine
 */
function unlockAchievement(userId, achievementCode) {
  try {
    const db = getDb();
    const ach = db.prepare('SELECT id, title, description FROM achievement_definitions WHERE code = ?').get(achievementCode);
    if (!ach) return false;

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO employee_achievements (user_id, achievement_id, unlocked_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(userId, ach.id);

    if (result.changes > 0) {
      // Award bonus points for unlocking achievement
      awardEvent(userId, 'achievement_awarded', 25, `Unlocked Achievement: ${ach.title}`, `achievement_${achievementCode}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Gamification] Error unlocking achievement:', err.message);
    return false;
  }
}

/**
 * 4. Growth Milestone Evaluation
 * Thresholds: 10%, 20%, 35%, 50%
 */
function evaluateMilestones(userId, growthMetrics) {
  if (growthMetrics.isZeroBaseline || !growthMetrics.hasBaseline) {
    return;
  }

  const percent = growthMetrics.growthPercent;

  if (percent >= 10) {
    if (awardEvent(userId, 'growth_milestone', 40, 'Achieved 10% Skill Growth Milestone', 'milestone_10')) {
      unlockAchievement(userId, 'ACH_GROWTH_10PCT');
    }
  }
  if (percent >= 20) {
    if (awardEvent(userId, 'growth_milestone', 60, 'Achieved 20% Skill Growth Milestone', 'milestone_20')) {
      unlockAchievement(userId, 'ACH_GROWTH_20PCT');
    }
  }
  if (percent >= 35) {
    if (awardEvent(userId, 'growth_milestone', 80, 'Achieved 35% Skill Growth Milestone', 'milestone_35')) {
      unlockAchievement(userId, 'ACH_GROWTH_35PCT');
    }
  }
  if (percent >= 50) {
    if (awardEvent(userId, 'growth_milestone', 100, 'Achieved 50% Skill Growth Milestone', 'milestone_50')) {
      unlockAchievement(userId, 'ACH_GROWTH_50PCT');
    }
  }
}

/**
 * 5. Learning Streak Engine
 * Calculated strictly from actual activity timestamps (lesson_completions, quiz_attempts, assessment_attempts).
 * Repeated refreshes on the same day do NOT inflate streaks.
 */
function evaluateStreaks(userId) {
  const db = getDb();
  
  // Extract distinct calendar activity dates (YYYY-MM-DD)
  const rows = db.prepare(`
    SELECT DISTINCT act_date FROM (
      SELECT substr(completed_at, 1, 10) as act_date FROM lesson_completions WHERE user_id = ?
      UNION
      SELECT substr(attempted_at, 1, 10) as act_date FROM quiz_attempts WHERE user_id = ?
      UNION
      SELECT substr(completed_at, 1, 10) as act_date FROM assessment_attempts WHERE user_id = ?
    )
    WHERE act_date IS NOT NULL AND act_date != ''
    ORDER BY act_date DESC
  `).all(userId, userId, userId);

  if (rows.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dateStrs = rows.map(r => r.act_date);
  
  // Parse unique dates sorted descending
  const timestamps = dateStrs.map(d => new Date(d + 'T00:00:00Z').getTime()).sort((a, b) => b - a);

  const MS_PER_DAY = 86400000;
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if most recent activity is today or yesterday (active streak)
  const mostRecentMs = timestamps[0];
  const diffDaysFromToday = Math.round((todayMs - mostRecentMs) / MS_PER_DAY);

  if (diffDaysFromToday <= 1) {
    currentStreak = 1;
    let prevMs = mostRecentMs;
    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.round((prevMs - timestamps[i]) / MS_PER_DAY);
      if (diff === 1) {
        currentStreak++;
        prevMs = timestamps[i];
      } else if (diff > 1) {
        break;
      }
    }
  }

  // Calculate longest historical streak
  tempStreak = 1;
  longestStreak = 1;
  for (let i = 0; i < timestamps.length - 1; i++) {
    const diff = Math.round((timestamps[i] - timestamps[i + 1]) / MS_PER_DAY);
    if (diff === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else if (diff > 1) {
      tempStreak = 1;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Award streak milestone rewards
  if (currentStreak >= 3 || longestStreak >= 3) {
    if (awardEvent(userId, 'streak_milestone', 30, 'Maintained a 3-Day Learning Streak', 'streak_3_days')) {
      unlockAchievement(userId, 'ACH_STREAK_3');
    }
  }
  if (currentStreak >= 7 || longestStreak >= 7) {
    if (awardEvent(userId, 'streak_milestone', 70, 'Maintained a 7-Day Learning Streak', 'streak_7_days')) {
      unlockAchievement(userId, 'ACH_STREAK_7');
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * 6. Achievement Evaluation Engine
 * Checks measurable activity and unlocks corresponding achievements.
 */
function evaluateAchievements(userId, growthMetrics, streakInfo) {
  const db = getDb();

  // Baseline Completed Check
  const attemptsCount = db.prepare('SELECT COUNT(*) as cnt FROM assessment_attempts WHERE user_id = ?').get(userId).cnt;
  if (attemptsCount > 0) {
    unlockAchievement(userId, 'ACH_FIRST_BASELINE');
  }

  // Domain High Score Checks
  const domainScores = db.prepare(`
    SELECT c.domain, MAX(ec.current_score) as max_score
    FROM employee_competencies ec
    JOIN competencies c ON ec.competency_id = c.id
    WHERE ec.user_id = ?
    GROUP BY c.domain
  `).all(userId);

  for (const ds of domainScores) {
    if (ds.domain === 'Statistical' && ds.max_score >= 80) {
      unlockAchievement(userId, 'ACH_STAT_PIONEER');
    }
    if (ds.domain === 'Digital Governance' && ds.max_score >= 80) {
      unlockAchievement(userId, 'ACH_DIGITAL_CHAMPION');
    }
  }

  // Learning Activity Checks
  const completedLessonsCount = db.prepare('SELECT COUNT(*) as cnt FROM lesson_completions WHERE user_id = ?').get(userId).cnt;
  if (completedLessonsCount > 0) {
    unlockAchievement(userId, 'ACH_FIRST_LESSON');
  }

  const passedQuizzesCount = db.prepare('SELECT COUNT(*) as cnt FROM quiz_attempts WHERE user_id = ? AND passed = 1').get(userId).cnt;
  if (passedQuizzesCount > 0) {
    unlockAchievement(userId, 'ACH_FIRST_QUIZ');
  }

  // Course Completion Check (All lessons of a course completed)
  const completedCourses = db.prepare(`
    SELECT l.course_id, COUNT(DISTINCT l.id) as total_lessons, COUNT(DISTINCT lc.lesson_id) as completed_lessons
    FROM lessons l
    LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = ?
    GROUP BY l.course_id
    HAVING total_lessons > 0 AND total_lessons = completed_lessons
  `).all(userId);

  if (completedCourses.length > 0) {
    unlockAchievement(userId, 'ACH_COURSE_COMPLETE');
  }
}

/**
 * 7. Comprehensive User Gamification Synchronizer
 * Idempotently evaluates all events and syncs points.
 */
function syncUserGamification(userId) {
  const db = getDb();

  // 1. Sync completed baseline assessment event if missing from ledger
  const baselineAttempt = db.prepare('SELECT id FROM assessment_attempts WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(userId);
  if (baselineAttempt) {
    awardEvent(userId, 'assessment_completed', 50, 'Completed Baseline Assessment', `assessment_${baselineAttempt.id}`);
  }

  // 2. Sync lesson completions if missing from ledger
  const lessonCompletions = db.prepare(`
    SELECT lc.lesson_id, l.title
    FROM lesson_completions lc
    JOIN lessons l ON lc.lesson_id = l.id
    WHERE lc.user_id = ?
  `).all(userId);

  for (const lc of lessonCompletions) {
    awardEvent(userId, 'lesson_completed', 15, `Completed Lesson: ${lc.title}`, `lesson_${lc.lesson_id}`);
  }

  // 3. Sync quiz attempts if missing from ledger
  const quizAttempts = db.prepare(`
    SELECT qa.id, qa.quiz_id, qa.score, qa.passed, q.title
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = ?
  `).all(userId);

  for (const qa of quizAttempts) {
    if (qa.passed === 1) {
      awardEvent(userId, 'quiz_completed', 25, `Passed Quiz: ${qa.title} (${qa.score}%)`, `quiz_attempt_${qa.id}`);
    }
    if (qa.score >= 100) {
      awardEvent(userId, 'quiz_perfect_score', 15, `Perfect Score Bonus: ${qa.title}`, `quiz_perfect_${qa.id}`);
    }
  }

  // 4. Compute growth metrics
  const growth = calculateGrowth(userId);

  // 5. Evaluate Milestones, Streaks, Achievements
  evaluateMilestones(userId, growth);
  const streak = evaluateStreaks(userId);
  evaluateAchievements(userId, growth, streak);

  // 6. Calculate total points from ledger
  const totalPoints = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM reward_ledger WHERE user_id = ?').get(userId).total;

  return {
    growth,
    streak,
    totalPoints
  };
}

/**
 * 8. Leaderboard Calculation Engine
 * Primary Metric: Growth %
 * Tie-breaker 1: Total points gained
 * Tie-breaker 2: Meaningful learning completions (lessons + passed quizzes)
 * Tie-breaker 3: User ID ASC (deterministic stability)
 */
function getLeaderboard() {
  const db = getDb();
  
  const employees = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.designation, d.name as department_name, u.avatar_url
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role = 'employee'
    ORDER BY u.id ASC
  `).all();

  const boardData = [];

  for (const emp of employees) {
    // Sync employee gamification state
    const synced = syncUserGamification(emp.id);

    // Count meaningful completions
    const lessonCount = db.prepare('SELECT COUNT(*) as cnt FROM lesson_completions WHERE user_id = ?').get(emp.id).cnt;
    const quizCount = db.prepare('SELECT COUNT(*) as cnt FROM quiz_attempts WHERE user_id = ? AND passed = 1').get(emp.id).cnt;
    const meaningfulCompletions = lessonCount + quizCount;

    // Unlocked achievements count
    const unlockedAchCount = db.prepare('SELECT COUNT(*) as cnt FROM employee_achievements WHERE user_id = ?').get(emp.id).cnt;

    boardData.push({
      employee_id: emp.id,
      username: emp.username,
      full_name: emp.full_name,
      designation: emp.designation || 'Statistical Officer',
      department_name: emp.department_name || 'General Division',
      growth_percent: synced.growth.growthPercent,
      growth_display: synced.growth.growthDisplay,
      is_zero_baseline: synced.growth.isZeroBaseline,
      has_baseline: synced.growth.hasBaseline,
      avg_baseline_score: synced.growth.avgBaseline,
      avg_current_score: synced.growth.avgCurrent,
      total_points: synced.totalPoints,
      current_streak: synced.streak.currentStreak,
      meaningful_completions: meaningfulCompletions,
      unlocked_achievements: unlockedAchCount
    });
  }

  // Deterministic sorting
  boardData.sort((a, b) => {
    // 1. Primary: Growth % DESC
    if (b.growth_percent !== a.growth_percent) {
      return b.growth_percent - a.growth_percent;
    }
    // 2. Tie-breaker 1: Total points gained DESC
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    // 3. Tie-breaker 2: Meaningful learning completions DESC
    if (b.meaningful_completions !== a.meaningful_completions) {
      return b.meaningful_completions - a.meaningful_completions;
    }
    // 4. Tie-breaker 3: Employee ID ASC
    return a.employee_id - b.employee_id;
  });

  // Assign ranks
  boardData.forEach((item, index) => {
    item.rank = index + 1;
  });

  return boardData;
}


/**
 * ------------------------------------------------------------------
 * REST API ROUTE HANDLERS
 * All routes require authentication & scope identity to req.user.id.
 * ------------------------------------------------------------------
 */

/**
 * GET /api/gamification/rewards and GET /api/rewards
 * Note: Placed BEFORE router.get('/') to prevent matching conflict if subroutes are called
 */
router.get(['/rewards', '/gamification/rewards'], requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    syncUserGamification(userId);

    const ledger = db.prepare(`
      SELECT id, event_type, points, description, created_at
      FROM reward_ledger
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(userId);

    const totalPoints = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM reward_ledger WHERE user_id = ?').get(userId).total;

    return res.json({
      success: true,
      data: {
        total_points: totalPoints,
        rewards: ledger
      }
    });
  } catch (err) {
    console.error('[Gamification Route] Error fetching rewards:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch reward ledger.'
      }
    });
  }
});

/**
 * GET /api/gamification/leaderboard and GET /api/leaderboard
 */
router.get(['/leaderboard', '/gamification/leaderboard'], requireAuth, (req, res) => {
  try {
    const leaderboard = getLeaderboard();

    return res.json({
      success: true,
      data: {
        leaderboard,
        current_user_id: req.user.id
      }
    });
  } catch (err) {
    console.error('[Gamification Route] Error fetching leaderboard:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch leaderboard.'
      }
    });
  }
});

/**
 * GET /api/gamification/achievements and GET /api/achievements
 */
router.get(['/achievements', '/gamification/achievements'], requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    syncUserGamification(userId);

    const achievements = db.prepare(`
      SELECT ad.id, ad.code, ad.title, ad.description, ad.icon, ad.category,
             CASE WHEN ea.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
             ea.unlocked_at
      FROM achievement_definitions ad
      LEFT JOIN employee_achievements ea ON ad.id = ea.achievement_id AND ea.user_id = ?
      ORDER BY ad.id ASC
    `).all(userId);

    const formatted = achievements.map(a => ({
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      is_unlocked: Boolean(a.is_unlocked),
      unlocked_at: a.unlocked_at || null
    }));

    return res.json({
      success: true,
      data: {
        achievements: formatted
      }
    });
  } catch (err) {
    console.error('[Gamification Route] Error fetching achievements:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch achievements.'
      }
    });
  }
});

/**
 * GET /api/gamification
 * Returns comprehensive employee gamification profile (points, streak, growth, badges, milestones, rank, recent activity).
 */
router.get(['/', '/gamification'], requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    // Perform sync & calculate metrics
    const synced = syncUserGamification(userId);

    // Fetch recent reward history ledger (last 10 items)
    const recentRewards = db.prepare(`
      SELECT id, event_type, points, description, created_at
      FROM reward_ledger
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(userId);

    // Fetch all achievements with user's unlock status
    const achievements = db.prepare(`
      SELECT ad.id, ad.code, ad.title, ad.description, ad.icon, ad.category,
             CASE WHEN ea.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
             ea.unlocked_at
      FROM achievement_definitions ad
      LEFT JOIN employee_achievements ea ON ad.id = ea.achievement_id AND ea.user_id = ?
      ORDER BY ad.id ASC
    `).all(userId);

    const formattedAchievements = achievements.map(a => ({
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      is_unlocked: Boolean(a.is_unlocked),
      unlocked_at: a.unlocked_at || null
    }));

    // Growth Milestones Status
    const milestones = [
      { threshold: 10, title: '10% Skill Growth', points: 40, is_achieved: synced.growth.hasBaseline && synced.growth.growthPercent >= 10 },
      { threshold: 20, title: '20% Skill Growth', points: 60, is_achieved: synced.growth.hasBaseline && synced.growth.growthPercent >= 20 },
      { threshold: 35, title: '35% Skill Growth', points: 80, is_achieved: synced.growth.hasBaseline && synced.growth.growthPercent >= 35 },
      { threshold: 50, title: '50% Skill Growth', points: 100, is_achieved: synced.growth.hasBaseline && synced.growth.growthPercent >= 50 }
    ];

    // Compute rank position on Leaderboard
    const leaderboard = getLeaderboard();
    const userRankEntry = leaderboard.find(item => item.employee_id === userId);
    const userRank = userRankEntry ? {
      rank: userRankEntry.rank,
      total_participants: leaderboard.length,
      growth_percent: userRankEntry.growth_percent,
      total_points: userRankEntry.total_points
    } : {
      rank: leaderboard.length,
      total_participants: leaderboard.length,
      growth_percent: synced.growth.growthPercent,
      total_points: synced.totalPoints
    };

    return res.json({
      success: true,
      data: {
        total_points: synced.totalPoints,
        growth: {
          average_baseline_score: synced.growth.avgBaseline,
          average_current_score: synced.growth.avgCurrent,
          growth_percentage: synced.growth.growthPercent,
          growth_display: synced.growth.growthDisplay,
          is_zero_baseline: synced.growth.isZeroBaseline,
          has_baseline: synced.growth.hasBaseline,
          competencies_count: synced.growth.count
        },
        streak: {
          current_streak_days: synced.streak.currentStreak,
          longest_streak_days: synced.streak.longestStreak
        },
        milestones,
        recent_rewards: recentRewards,
        achievements: formattedAchievements,
        rank: userRank
      }
    });

  } catch (err) {
    console.error('[Gamification Route] Error fetching overview:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not fetch gamification details.'
      }
    });
  }
});

module.exports = router;
module.exports.syncUserGamification = syncUserGamification;
module.exports.calculateGrowth = calculateGrowth;
module.exports.getLeaderboard = getLeaderboard;
