/**
 * NAVBODH - Intelligence Engine & API Routes
 * 
 * Contributor Ownership: Rucha (Stage 2: Intelligence)
 * 
 * Responsibilities:
 *  - Deterministic and explainable skill-gap identification
 *  - Transparent competency deficiency prioritization
 *  - Personalized course recommendations (gap-to-course relationship)
 *  - Dynamic, database-driven learning roadmap generation
 *  - AI study-assistant integration boundary with deterministic fallback
 */

const express = require('express');
const { getDb } = require('./db');
const { requireAuth } = require('./middleware/auth');

const router = express.Router();

/**
 * Centralized, explainable priority thresholds.
 * Evaluates skill gap: gap = target_score - current_score
 */
const PRIORITY_THRESHOLDS = {
  HIGH: 30.0,    // gap >= 30.0 -> high priority deficiency
  MEDIUM: 15.0,  // gap >= 15.0 and < 30.0 -> medium priority
  LOW: 0.1       // gap > 0.0 and < 15.0 -> low priority
};

/**
 * Helper: Classifies gap into priority category
 */
function classifyPriority(gap) {
  if (gap >= PRIORITY_THRESHOLDS.HIGH) return 'high';
  if (gap >= PRIORITY_THRESHOLDS.MEDIUM) return 'medium';
  if (gap > 0) return 'low';
  return 'none';
}

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
      return 'Sample Course Catalog';
  }
}

/**
 * Helper: Tailored domain/competency study recommendations
 */
function getSuggestedFocus(competencyCode, domain) {
  const suggestions = {
    'STAT_SURVEY_DESIGN': 'Focus on questionnaire formulation, multi-subject survey frameworks, and field validation protocols.',
    'STAT_SAMPLING': 'Strengthen probability sampling designs, stratification allocation, and variance estimation techniques.',
    'STAT_NAT_ACCOUNTS': 'Master 2008 SNA sequence of accounts, Gross Value Added (GVA) estimation, and Supply-Use Tables.',
    'STAT_SDG_INDICATORS': 'Study UN SDG metadata standards, disaggregation tiers, and national reporting metrics.',
    'STAT_DATA_QUALITY': 'Apply National Quality Assurance Framework (NQAF) principles and automated statistical audit checks.',
    'TECH_PYTHON': 'Practice data cleaning with Pandas, automated pipeline scripting, and reproducible statistical workflows.',
    'TECH_SQL': 'Master relational database querying, window functions, and enterprise statistical data extraction.',
    'TECH_DATA_VIZ': 'Build analytical dashboards, thematic statistical maps, and official publication charts.',
    'TECH_AI_ML': 'Explore automated survey text coding, predictive estimation, and statistical anomaly detection.',
    'TECH_APIS': 'Learn REST API design, automated data ingestion pipelines, and interoperable government formats.',
    'GOV_CYBERSECURITY': 'Reinforce information security hygiene, phishing mitigation, and secure government IT practices.',
    'GOV_DATA_PRIVACY': 'Review Digital Personal Data Protection Act compliance, anonymization, and respondent confidentiality.',
    'GOV_CLOUD': 'Understand MeghRaj government cloud infrastructure, secure storage, and microservices architecture.',
    'BEH_LEADERSHIP': 'Develop strategic team management, statistical institutional stewardship, and change leadership.',
    'BEH_COMMUNICATION': 'Refine executive briefing, statistical dissemination to media/public, and cross-wing coordination.',
    'BEH_PROJECT_MGMT': 'Improve milestone scheduling, resource allocation, and field monitoring of large operations.',
    'BEH_ETHICS': 'Uphold scientific objectivity, impartiality, and conflict-of-interest prevention in official reporting.'
  };

  return suggestions[competencyCode] || `Strengthen core competencies in the ${domain} domain through applied coursework.`;
}

/**
 * GET /api/intelligence/skill-gaps
 * 
 * Returns deterministic, explainable skill gaps for the authenticated employee.
 * Uses: employee_competencies + competencies + assessment_attempts
 * Formula: gap = target_score - current_score (gap > 0 is active deficiency)
 */
router.get(['/skill-gaps', '/intelligence/skill-gaps'], requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Check if the employee has any assessment attempts
    const attemptCheck = db.prepare(`
      SELECT COUNT(*) as count, MAX(completed_at) as last_assessed_at
      FROM assessment_attempts
      WHERE user_id = ?
    `).get(userId);

    const hasAssessment = (attemptCheck && attemptCheck.count > 0);

    // Query employee competencies with full definitions
    const rows = db.prepare(`
      SELECT 
        c.id as competency_id,
        c.code as competency_code,
        c.name as competency_name,
        c.domain,
        c.description,
        c.target_score as default_target_score,
        ec.baseline_score,
        ec.current_score,
        COALESCE(ec.target_score, c.target_score) as effective_target_score,
        ec.last_assessed_at
      FROM competencies c
      LEFT JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.user_id = ?
      ORDER BY
        CASE c.domain
          WHEN 'Statistical' THEN 1
          WHEN 'Technical' THEN 2
          WHEN 'Digital Governance' THEN 3
          WHEN 'Behavioural / Managerial' THEN 4
          ELSE 5
        END,
        c.id ASC
    `).all(userId);

    if (!hasAssessment) {
      return res.json({
        success: true,
        data: {
          hasAssessment: false,
          message: 'Complete your competency assessment to generate personalized skill gaps and recommendations.',
          summary: {
            totalCompetencies: rows.length,
            activeGapsCount: 0,
            highPriorityCount: 0,
            mediumPriorityCount: 0,
            lowPriorityCount: 0,
            metCount: 0,
            averageCurrentScore: 0,
            averageTargetScore: 80.0,
            domainsRepresented: [],
            largestGap: null,
            strongestCompetency: null
          },
          gaps: [],
          allCompetencies: rows.map(r => ({
            competencyId: r.competency_id,
            competencyCode: r.competency_code,
            competency: r.competency_name,
            domain: r.domain,
            description: r.description,
            baselineScore: 0,
            currentScore: 0,
            targetScore: r.default_target_score,
            gap: r.default_target_score,
            priority: classifyPriority(r.default_target_score),
            status: 'unassessed'
          }))
        }
      });
    }

    const allCompetencies = [];
    const activeGaps = [];
    const domainGapsMap = {};

    let totalCurrent = 0;
    let totalTarget = 0;
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    let metCount = 0;

    for (const r of rows) {
      const current = r.current_score !== null && r.current_score !== undefined ? Number(r.current_score) : 0;
      const baseline = r.baseline_score !== null && r.baseline_score !== undefined ? Number(r.baseline_score) : 0;
      const target = Number(r.effective_target_score || r.default_target_score || 80.0);

      totalCurrent += current;
      totalTarget += target;

      const rawGap = target - current;
      const gap = rawGap > 0 ? parseFloat(rawGap.toFixed(1)) : 0;
      const priority = classifyPriority(gap);
      const isDeficiency = gap > 0;

      const compItem = {
        competencyId: r.competency_id,
        competencyCode: r.competency_code,
        competency: r.competency_name,
        domain: r.domain,
        description: r.description,
        baselineScore: baseline,
        currentScore: current,
        targetScore: target,
        gap,
        priority,
        status: isDeficiency ? 'deficiency' : 'met',
        lastAssessedAt: r.last_assessed_at || attemptCheck.last_assessed_at
      };

      allCompetencies.push(compItem);

      if (isDeficiency) {
        activeGaps.push(compItem);
        domainGapsMap[r.domain] = (domainGapsMap[r.domain] || 0) + 1;

        if (priority === 'high') highCount++;
        else if (priority === 'medium') medCount++;
        else if (priority === 'low') lowCount++;
      } else {
        metCount++;
      }
    }

    // Sort active gaps: largest gap first, then by priority weight, then id
    const priorityWeight = { high: 3, medium: 2, low: 1, none: 0 };
    activeGaps.sort((a, b) => {
      if (b.gap !== a.gap) return b.gap - a.gap;
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

    const totalComps = allCompetencies.length;
    const avgCurrent = totalComps > 0 ? parseFloat((totalCurrent / totalComps).toFixed(1)) : 0;
    const avgTarget = totalComps > 0 ? parseFloat((totalTarget / totalComps).toFixed(1)) : 0;

    // Identify largest gap and strongest competency
    let largestGap = activeGaps.length > 0 ? activeGaps[0] : null;
    let strongestCompetency = null;
    if (allCompetencies.length > 0) {
      const sortedByScore = [...allCompetencies].sort((a, b) => b.currentScore - a.currentScore);
      strongestCompetency = sortedByScore[0];
    }

    return res.json({
      success: true,
      data: {
        hasAssessment: true,
        summary: {
          totalCompetencies: totalComps,
          activeGapsCount: activeGaps.length,
          highPriorityCount: highCount,
          mediumPriorityCount: medCount,
          lowPriorityCount: lowCount,
          metCount,
          averageCurrentScore: avgCurrent,
          averageTargetScore: avgTarget,
          domainsRepresented: Object.keys(domainGapsMap),
          largestGap: largestGap ? {
            competencyId: largestGap.competencyId,
            competency: largestGap.competency,
            domain: largestGap.domain,
            gap: largestGap.gap,
            priority: largestGap.priority
          } : null,
          strongestCompetency: strongestCompetency ? {
            competencyId: strongestCompetency.competencyId,
            competency: strongestCompetency.competency,
            domain: strongestCompetency.domain,
            currentScore: strongestCompetency.currentScore
          } : null
        },
        gaps: activeGaps,
        allCompetencies
      }
    });
  } catch (err) {
    console.error('[Intelligence Route] Error calculating skill gaps:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SKILL_GAP_CALCULATION_FAILED',
        message: 'An error occurred while computing employee competency gaps.'
      }
    });
  }
});

/**
 * GET /api/intelligence/recommendations
 * 
 * Generates personalized course recommendations based on the employee's active skill gaps.
 * Uses: employee_competencies -> competencies -> course_competencies -> courses
 * Prioritizes courses that resolve high-priority gaps and multi-competency deficiencies.
 */
router.get(['/recommendations', '/intelligence/recommendations'], requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Check assessment presence
    const attemptCheck = db.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?
    `).get(userId);

    if (!attemptCheck || attemptCheck.count === 0) {
      return res.json({
        success: true,
        data: {
          hasAssessment: false,
          totalRecommendations: 0,
          message: 'Complete your competency assessment to generate personalized skill gaps and recommendations.',
          recommendations: []
        }
      });
    }

    // Query courses linked to competencies where the employee has an active gap (current_score < target_score)
    const rawMatches = db.prepare(`
      SELECT 
        crs.id as course_id,
        crs.code as course_code,
        crs.title as course_title,
        crs.description as course_description,
        crs.source_label,
        crs.duration_hours,
        crs.difficulty_level,
        crs.domain as course_domain,
        cc.growth_impact_score,
        c.id as competency_id,
        c.code as comp_code,
        c.name as comp_name,
        c.domain as comp_domain,
        ec.baseline_score,
        ec.current_score,
        COALESCE(ec.target_score, c.target_score) as target_score
      FROM courses crs
      JOIN course_competencies cc ON crs.id = cc.course_id
      JOIN competencies c ON cc.competency_id = c.id
      JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.user_id = ?
      WHERE crs.is_active = 1
        AND (COALESCE(ec.target_score, c.target_score) - ec.current_score) > 0
      ORDER BY crs.id ASC
    `).all(userId);

    if (rawMatches.length === 0) {
      // Check if employee has zero active gaps or if courses are simply missing mappings
      const activeGapsCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM employee_competencies ec
        JOIN competencies c ON ec.competency_id = c.id
        WHERE ec.user_id = ? AND (COALESCE(ec.target_score, c.target_score) - ec.current_score) > 0
      `).get(userId).count;

      const emptyMessage = activeGapsCount === 0
        ? 'No active competency gaps were identified against your current targets.'
        : 'No matching learning resources are currently available for these competency gaps.';

      return res.json({
        success: true,
        data: {
          hasAssessment: true,
          totalRecommendations: 0,
          message: emptyMessage,
          recommendations: []
        }
      });
    }

    // Group matching competencies by course
    const courseMap = new Map();
    const priorityMultiplier = { high: 3.0, medium: 2.0, low: 1.0, none: 0 };

    for (const row of rawMatches) {
      const gap = parseFloat((row.target_score - row.current_score).toFixed(1));
      const priority = classifyPriority(gap);

      if (!courseMap.has(row.course_id)) {
        courseMap.set(row.course_id, {
          courseId: row.course_id,
          courseCode: row.course_code,
          title: row.course_title,
          description: row.course_description,
          source: row.source_label,
          sourceLabel: row.source_label,
          sourceDisplayName: getSourceDisplayName(row.source_label),
          durationHours: Number(row.duration_hours || 0),
          difficultyLevel: row.difficulty_level,
          domain: row.course_domain,
          matchedCompetencies: [],
          rankingScore: 0
        });
      }

      const courseObj = courseMap.get(row.course_id);
      const impact = Number(row.growth_impact_score || 10.0);

      courseObj.matchedCompetencies.push({
        competencyId: row.competency_id,
        code: row.comp_code,
        name: row.comp_name,
        domain: row.comp_domain,
        currentScore: row.current_score,
        targetScore: row.target_score,
        gap,
        priority,
        growthImpact: impact
      });

      // Calculate ranking score: weighted by gap size, priority level, and course growth impact
      const weight = priorityMultiplier[priority] || 1.0;
      courseObj.rankingScore += (gap * weight) + impact;
    }

    // Build finalized recommendations with deterministic explainable reasoning
    const recommendations = Array.from(courseMap.values()).map(course => {
      // Sort matched competencies within the course by gap size descending
      course.matchedCompetencies.sort((a, b) => b.gap - a.gap);

      const topMatched = course.matchedCompetencies[0];
      const matchCount = course.matchedCompetencies.length;

      let reason = '';
      if (matchCount === 1) {
        reason = `This course directly addresses your ${topMatched.priority}-priority ${topMatched.name} competency gap (${topMatched.gap} pts below target) with an estimated +${topMatched.growthImpact} pt growth impact.`;
      } else {
        const otherNames = course.matchedCompetencies.slice(1).map(c => c.name).join(', ');
        reason = `This course addresses ${matchCount} active competency gaps: primary ${topMatched.priority}-priority gap in ${topMatched.name} (${topMatched.gap} pts) and secondary gaps in ${otherNames}.`;
      }

      course.reason = reason;
      course.rankingScore = parseFloat(course.rankingScore.toFixed(1));
      return course;
    });

    // Deterministic ranking: highest relevance ranking score first
    recommendations.sort((a, b) => b.rankingScore - a.rankingScore);

    return res.json({
      success: true,
      data: {
        hasAssessment: true,
        totalRecommendations: recommendations.length,
        recommendations
      }
    });
  } catch (err) {
    console.error('[Intelligence Route] Error generating recommendations:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATION_GENERATION_FAILED',
        message: 'An error occurred while generating learning recommendations.'
      }
    });
  }
});

/**
 * GET /api/intelligence/roadmap
 * 
 * Generates a dynamic, database-driven personalized learning roadmap for the employee.
 * Groups learning sequence into progressive phases (High Priority -> Medium -> Low -> Mastery).
 * Reflects real-time changes whenever competency scores update.
 */
router.get(['/roadmap', '/intelligence/roadmap'], requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Check assessment presence
    const attemptCheck = db.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?
    `).get(userId);

    if (!attemptCheck || attemptCheck.count === 0) {
      return res.json({
        success: true,
        data: {
          hasAssessment: false,
          message: 'Complete your competency assessment to generate personalized skill gaps and recommendations.',
          roadmapSummary: {
            totalStages: 0,
            totalGapsToBridge: 0,
            totalEstimatedHours: 0,
            primaryFocusDomain: 'None'
          },
          stages: []
        }
      });
    }

    // Query employee competencies
    const compRows = db.prepare(`
      SELECT 
        c.id as competency_id,
        c.code as competency_code,
        c.name as competency_name,
        c.domain,
        c.description,
        ec.baseline_score,
        ec.current_score,
        COALESCE(ec.target_score, c.target_score) as target_score
      FROM competencies c
      JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.user_id = ?
      ORDER BY c.id ASC
    `).all(userId);

    // Fetch all available course mappings for attaching to roadmap milestones
    const courseMappings = db.prepare(`
      SELECT 
        cc.competency_id,
        crs.id as course_id,
        crs.code as course_code,
        crs.title as course_title,
        crs.source_label,
        crs.duration_hours,
        crs.difficulty_level,
        cc.growth_impact_score
      FROM course_competencies cc
      JOIN courses crs ON cc.course_id = crs.id
      WHERE crs.is_active = 1
      ORDER BY cc.growth_impact_score DESC
    `).all();

    const compCoursesMap = {};
    for (const cm of courseMappings) {
      if (!compCoursesMap[cm.competency_id]) {
        compCoursesMap[cm.competency_id] = [];
      }
      compCoursesMap[cm.competency_id].push({
        courseId: cm.course_id,
        code: cm.course_code,
        title: cm.course_title,
        source: cm.source_label,
        sourceDisplayName: getSourceDisplayName(cm.source_label),
        durationHours: Number(cm.duration_hours || 0),
        difficultyLevel: cm.difficulty_level,
        growthImpact: Number(cm.growth_impact_score || 10.0)
      });
    }

    // Classify milestones into phases based on gap size
    const highItems = [];
    const medItems = [];
    const lowItems = [];
    const metItems = [];
    const domainGapCount = {};

    let totalGaps = 0;
    let totalHours = 0;
    let sequenceCounter = 1;

    for (const c of compRows) {
      const current = Number(c.current_score || 0);
      const baseline = Number(c.baseline_score || 0);
      const target = Number(c.target_score || 80.0);
      const rawGap = target - current;
      const gap = rawGap > 0 ? parseFloat(rawGap.toFixed(1)) : 0;
      const priority = classifyPriority(gap);

      const itemCourses = compCoursesMap[c.competency_id] || [];
      const primaryCourse = itemCourses.length > 0 ? itemCourses[0] : null;
      if (gap > 0 && primaryCourse) {
        totalHours += primaryCourse.durationHours;
      }

      const item = {
        competencyId: c.competency_id,
        competencyCode: c.competency_code,
        competency: c.competency_name,
        domain: c.domain,
        currentScore: current,
        baselineScore: baseline,
        targetScore: target,
        gap,
        priority,
        suggestedFocus: getSuggestedFocus(c.competency_code, c.domain),
        recommendedCourses: itemCourses
      };

      if (gap >= PRIORITY_THRESHOLDS.HIGH) {
        highItems.push(item);
        totalGaps++;
        domainGapCount[c.domain] = (domainGapCount[c.domain] || 0) + 1;
      } else if (gap >= PRIORITY_THRESHOLDS.MEDIUM) {
        medItems.push(item);
        totalGaps++;
        domainGapCount[c.domain] = (domainGapCount[c.domain] || 0) + 1;
      } else if (gap > 0) {
        lowItems.push(item);
        totalGaps++;
        domainGapCount[c.domain] = (domainGapCount[c.domain] || 0) + 1;
      } else {
        metItems.push(item);
      }
    }

    // Sort items within each phase by gap descending
    highItems.sort((a, b) => b.gap - a.gap);
    medItems.sort((a, b) => b.gap - a.gap);
    lowItems.sort((a, b) => b.gap - a.gap);

    // Assign sequential order across the full roadmap
    const stages = [];

    if (highItems.length > 0) {
      highItems.forEach(i => { i.order = sequenceCounter++; });
      stages.push({
        phase: 1,
        phaseKey: 'high_priority_remediation',
        title: 'Phase 1: Urgent Skill Remediation',
        priority: 'high',
        badge: 'CRITICAL PRIORITY',
        description: 'Address substantial competency deficiencies (gaps ≥ 30 pts) requiring immediate institutional training intervention.',
        itemsCount: highItems.length,
        items: highItems
      });
    }

    if (medItems.length > 0) {
      medItems.forEach(i => { i.order = sequenceCounter++; });
      stages.push({
        phase: stages.length + 1,
        phaseKey: 'medium_priority_enhancement',
        title: `Phase ${stages.length + 1}: Core Skill Building & Enhancement`,
        priority: 'medium',
        badge: 'MEDIUM PRIORITY',
        description: 'Build intermediate proficiency (gaps between 15 and 30 pts) through structured course modules and practical assignments.',
        itemsCount: medItems.length,
        items: medItems
      });
    }

    if (lowItems.length > 0) {
      lowItems.forEach(i => { i.order = sequenceCounter++; });
      stages.push({
        phase: stages.length + 1,
        phaseKey: 'low_priority_refinement',
        title: `Phase ${stages.length + 1}: Competency Alignment & Refinement`,
        priority: 'low',
        badge: 'TARGET ALIGNMENT',
        description: 'Fine-tune competencies nearing official benchmark thresholds (gaps < 15 pts) for full standard compliance.',
        itemsCount: lowItems.length,
        items: lowItems
      });
    }

    if (metItems.length > 0) {
      metItems.forEach(i => { i.order = sequenceCounter++; });
      stages.push({
        phase: stages.length + 1,
        phaseKey: 'mastery_and_maintenance',
        title: `Phase ${stages.length + 1}: Target Mastery & Knowledge Maintenance`,
        priority: 'none',
        badge: 'BENCHMARK MET',
        description: 'Maintain high proficiency in competencies where official target scores have been successfully achieved or exceeded.',
        itemsCount: metItems.length,
        items: metItems
      });
    }

    // Determine primary focus domain
    let primaryFocusDomain = 'Balanced';
    let maxDomainGaps = 0;
    for (const [dom, count] of Object.entries(domainGapCount)) {
      if (count > maxDomainGaps) {
        maxDomainGaps = count;
        primaryFocusDomain = dom;
      }
    }

    return res.json({
      success: true,
      data: {
        hasAssessment: true,
        roadmapSummary: {
          totalStages: stages.length,
          totalGapsToBridge: totalGaps,
          totalEstimatedHours: parseFloat(totalHours.toFixed(1)),
          primaryFocusDomain,
          totalCompetenciesEvaluated: compRows.length
        },
        stages
      }
    });
  } catch (err) {
    console.error('[Intelligence Route] Error generating roadmap:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ROADMAP_GENERATION_FAILED',
        message: 'An error occurred while compiling the dynamic learning roadmap.'
      }
    });
  }
});

/**
 * POST /api/intelligence/study-assistant
 * 
 * AI study-assistant integration boundary with safe, deterministic fallback.
 * Operates without external API keys and never exposes backend secrets.
 * Context is securely grounded in the authenticated employee's real competency gaps.
 */
router.post(['/study-assistant', '/intelligence/study-assistant'], requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    // Strict input validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Please provide a valid question or study inquiry.'
        }
      });
    }

    const cleanMessage = message.trim().slice(0, 500);
    const userId = req.user.id;
    const db = getDb();

    // Query authenticated officer profile and actual competency gaps
    const user = db.prepare(`
      SELECT u.full_name, u.designation, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(userId);

    const compRows = db.prepare(`
      SELECT 
        c.id as competency_id,
        c.code as competency_code,
        c.name as competency_name,
        c.domain,
        ec.baseline_score,
        ec.current_score,
        COALESCE(ec.target_score, c.target_score) as target_score
      FROM competencies c
      LEFT JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.user_id = ?
      ORDER BY c.id ASC
    `).all(userId);

    const attemptCheck = db.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE user_id = ?
    `).get(userId);

    const hasAssessment = (attemptCheck && attemptCheck.count > 0);

    const gaps = [];
    for (const c of compRows) {
      const current = Number(c.current_score || 0);
      const target = Number(c.target_score || 80.0);
      const gap = target - current > 0 ? parseFloat((target - current).toFixed(1)) : 0;
      if (gap > 0) {
        gaps.push({
          name: c.competency_name,
          code: c.competency_code,
          domain: c.domain,
          gap,
          current,
          target,
          priority: classifyPriority(gap)
        });
      }
    }

    gaps.sort((a, b) => b.gap - a.gap);

    // AI Provider Boundary Check (Optional external key)
    const externalKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (externalKey) {
      // Future live AI provider adapter boundary
      // In production/future, an external LLM could be invoked here with timeout & safe error fallback
      // For Stage 2, fallback is cleanly executed if provider is unreachable
    }

    // Deterministic, Explainable Rule-Based Intelligence Assistant Engine
    const officerName = user ? user.full_name : 'Officer';
    const deptName = user ? (user.department_name || 'Official Statistics Division') : 'MoSPI';
    const topGap = gaps.length > 0 ? gaps[0] : null;
    const highGaps = gaps.filter(g => g.priority === 'high');

    const lowerQuery = cleanMessage.toLowerCase();
    let reply = '';
    let category = 'general_guidance';

    if (!hasAssessment) {
      reply = `Hello ${officerName}. I see you have not yet completed your initial competency baseline assessment. ` +
        `To give you tailored study recommendations and roadmap milestones, please navigate to the **Assessment** tab and complete the 17-question baseline evaluation.`;
      category = 'unassessed_notice';
    } else if (lowerQuery.includes('first') || lowerQuery.includes('start') || lowerQuery.includes('priority') || lowerQuery.includes('begin')) {
      category = 'priority_focus';
      if (topGap) {
        const domainGuidance = getSuggestedFocus(topGap.code, topGap.domain);
        reply = `Based on your latest competency evaluation in the **${deptName}**, your highest-priority focus area is **${topGap.name}** (${topGap.domain} domain).\n\n` +
          `• **Current Score:** ${topGap.current} / Target: ${topGap.target} (Deficiency Gap: ${topGap.gap} pts - ${topGap.priority.toUpperCase()} Priority)\n` +
          `• **Recommended Focus:** ${domainGuidance}\n\n` +
          `**Suggested Learning Sequence:**\n` +
          `1. Review the foundational concepts in ${topGap.name}.\n` +
          `2. Enroll in the matching course from your **Recommendations** tab.\n` +
          `3. Complete practical statistical exercises on administrative data.\n` +
          `4. Re-evaluate your score through the periodic assessment module.`;
      } else {
        reply = `Congratulations ${officerName}! You currently have no active competency deficiencies against your official targets. ` +
          `You can maintain your expertise by exploring advanced coursework in the **Recommendations** tab.`;
      }
    } else if (lowerQuery.includes('gap') || lowerQuery.includes('deficiency') || lowerQuery.includes('weak') || lowerQuery.includes('score')) {
      category = 'gap_analysis';
      if (gaps.length > 0) {
        const gapListStr = gaps.slice(0, 4).map((g, idx) => 
          `${idx + 1}. **${g.name}** (${g.domain}) — Current: ${g.current}, Target: ${g.target} (Gap: ${g.gap} pts, ${g.priority.toUpperCase()})`
        ).join('\n');

        reply = `Here is a summary of your active competency gaps (${gaps.length} total):\n\n${gapListStr}\n\n` +
          `You have **${highGaps.length} high-priority** ${highGaps.length === 1 ? 'deficiency' : 'deficiencies'} that should be addressed first in your personalized learning roadmap.`;
      } else {
        reply = `All your assessed competencies meet or exceed the official proficiency benchmarks. No active skill gaps were identified.`;
      }
    } else if (lowerQuery.includes('roadmap') || lowerQuery.includes('plan') || lowerQuery.includes('stage') || lowerQuery.includes('path')) {
      category = 'roadmap_summary';
      if (gaps.length > 0) {
        reply = `Your learning roadmap is structured into sequential phases based on gap severity:\n\n` +
          `• **Phase 1 (Urgent Remediation):** ${highGaps.length > 0 ? highGaps.map(g => g.name).join(', ') : 'None (No critical gaps)'}\n` +
          `• **Phase 2 (Core Enhancement):** ${gaps.filter(g => g.priority === 'medium').map(g => g.name).join(', ') || 'None'}\n` +
          `• **Phase 3 (Refinement):** ${gaps.filter(g => g.priority === 'low').map(g => g.name).join(', ') || 'None'}\n\n` +
          `Check the **Roadmap** tab for step-by-step course mappings and milestone durations.`;
      } else {
        reply = `Your roadmap is currently in the **Mastery & Maintenance** phase because all competency targets have been satisfied.`;
      }
    } else if (lowerQuery.includes('python') || lowerQuery.includes('sql') || lowerQuery.includes('sampling') || lowerQuery.includes('accounts') || lowerQuery.includes('privacy') || lowerQuery.includes('cyber') || lowerQuery.includes('survey')) {
      category = 'topic_specific';
      // Find matching competency in active gaps or all evaluated competencies
      const matchedCompInGaps = gaps.find(g => lowerQuery.includes(g.name.toLowerCase()) || lowerQuery.includes(g.code.toLowerCase()));
      const matchedCompAll = compRows.find(c => lowerQuery.includes(c.competency_name.toLowerCase()) || lowerQuery.includes(c.competency_code.toLowerCase()));

      if (matchedCompInGaps) {
        reply = `Regarding **${matchedCompInGaps.name}**:\n` +
          `• Your current score is **${matchedCompInGaps.current}** against an official target of **${matchedCompInGaps.target}** (Gap: ${matchedCompInGaps.gap} pts, ${matchedCompInGaps.priority.toUpperCase()} priority).\n` +
          `• Suggested strategy: ${getSuggestedFocus(matchedCompInGaps.code, matchedCompInGaps.domain)}\n` +
          `• Check your **Recommendations** tab for course modules mapped specifically to this skill.`;
      } else if (matchedCompAll) {
        const cScore = Number(matchedCompAll.current_score || 0);
        const tScore = Number(matchedCompAll.target_score || 80.0);
        const isMet = cScore >= tScore;
        reply = `Regarding **${matchedCompAll.competency_name}**:\n` +
          `• Your current score is **${cScore}** against an official target of **${tScore}** (${isMet ? 'Benchmark Achieved ✓' : 'Deficiency Identified'}).\n` +
          `• Key focus area: ${getSuggestedFocus(matchedCompAll.competency_code, matchedCompAll.domain)}\n` +
          `• Visit your **Recommendations** and **Roadmap** tabs for training resources.`;
      } else {
        reply = `Regarding your inquiry on official statistical methods: ` +
          `NAVBODH provides structured learning resources across Statistical, Technical, Digital Governance, and Managerial domains. ` +
          `Visit the **Recommendations** and **Roadmap** tabs to access curated modules tailored to your division's mandate.`;
      }
    } else {
      category = 'general_assistance';
      if (topGap) {
        reply = `Greetings ${officerName}. I am your NAVBODH Study Assistant.\n\n` +
          `Based on your profile in **${deptName}**, your primary learning objective is bridging the **${topGap.name}** competency gap (${topGap.gap} pts below target).\n\n` +
          `You can ask me questions like:\n` +
          `• *"What should I learn first?"*\n` +
          `• *"Explain my skill gaps"*\n` +
          `• *"Summarize my learning roadmap"*\n` +
          `• *"How can I improve in SQL or Survey Sampling?"*`;
      } else {
        reply = `Greetings ${officerName}. I am your NAVBODH Study Assistant. All your competency targets are currently on track. Feel free to ask about any statistical subject or explore advanced training in the **Recommendations** tab.`;
      }
    }

    return res.json({
      success: true,
      data: {
        reply,
        category,
        mode: 'rules_based_fallback',
        engine: 'NAVBODH Explainable Intelligence Assistant (Stage 2 Demo)',
        contextSummary: {
          officerName,
          department: deptName,
          hasAssessment,
          activeGapsCount: gaps.length,
          topPriorityCompetency: topGap ? topGap.name : null,
          topPriorityGap: topGap ? topGap.gap : 0.0
        }
      }
    });
  } catch (err) {
    console.error('[Intelligence Route] Error in study assistant endpoint:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STUDY_ASSISTANT_ERROR',
        message: 'An error occurred while processing your study assistant request.'
      }
    });
  }
});


/**
 * POST /api/intelligence/quiz-generator and POST /api/quiz-generator
 *
 * Generates tailored assessment / practice questions for a given competency or domain.
 * Anti-cheating: Does not leak answer keys or explanations prior to submission.
 */
router.post(['/quiz-generator', '/intelligence/quiz-generator'], requireAuth, (req, res) => {
  try {
    const { competency_id, competency_code, domain, count = 3 } = req.body || {};
    const db = getDb();

    let questions = [];
    const limit = Math.min(Math.max(1, parseInt(count, 10) || 3), 10);

    if (competency_id) {
      questions = db.prepare(`
        SELECT aq.id, aq.competency_id, aq.question_text, aq.options_json, aq.difficulty,
               c.code as competency_code, c.name as competency_name, c.domain
        FROM assessment_questions aq
        JOIN competencies c ON aq.competency_id = c.id
        WHERE aq.competency_id = ?
        LIMIT ?
      `).all(Number(competency_id), limit);
    } else if (competency_code) {
      questions = db.prepare(`
        SELECT aq.id, aq.competency_id, aq.question_text, aq.options_json, aq.difficulty,
               c.code as competency_code, c.name as competency_name, c.domain
        FROM assessment_questions aq
        JOIN competencies c ON aq.competency_id = c.id
        WHERE c.code = ?
        LIMIT ?
      `).all(String(competency_code).trim(), limit);
    } else if (domain) {
      questions = db.prepare(`
        SELECT aq.id, aq.competency_id, aq.question_text, aq.options_json, aq.difficulty,
               c.code as competency_code, c.name as competency_name, c.domain
        FROM assessment_questions aq
        JOIN competencies c ON aq.competency_id = c.id
        WHERE c.domain = ?
        LIMIT ?
      `).all(String(domain).trim(), limit);
    } else {
      questions = db.prepare(`
        SELECT aq.id, aq.competency_id, aq.question_text, aq.options_json, aq.difficulty,
               c.code as competency_code, c.name as competency_name, c.domain
        FROM assessment_questions aq
        JOIN competencies c ON aq.competency_id = c.id
        LIMIT ?
      `).all(limit);
    }

    const formattedQuestions = questions.map(q => {
      let options = [];
      try {
        options = JSON.parse(q.options_json);
      } catch (e) {
        options = [];
      }
      return {
        id: q.id,
        competency_id: q.competency_id,
        competency_code: q.competency_code,
        competency_name: q.competency_name,
        domain: q.domain,
        question_text: q.question_text,
        options,
        difficulty: q.difficulty
      };
    });

    return res.json({
      success: true,
      data: {
        mode: 'rules_based_generator',
        engine: 'NAVBODH Explainable Intelligence Assistant (Stage 2 Demo)',
        total_questions: formattedQuestions.length,
        questions: formattedQuestions
      }
    });
  } catch (err) {
    console.error('[Intelligence Route] Error generating quiz:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUIZ_GENERATOR_ERROR',
        message: 'Could not generate quiz questions.'
      }
    });
  }
});

module.exports = router;
