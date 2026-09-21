/**
 * NAVBODH - Employee Portal Logic & SPA View Controller
 * 
 * Handles authentication state, employee dashboard, profile editing,
 * competency assessment taking, assessment results display,
 * Stage 2 Intelligence (Skill gaps, recommendations, roadmap, study assistant),
 * and Stage 3 Learning (Course catalog, course detail, lesson reader, persistent progress, quizzes).
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentUser: null,
    departments: [],
    competencies: [],
    currentAssessment: null,
    assessmentAnswers: {},
    profileData: null,
    activeTab: 'dashboard',
    
    // Stage 3 Learning State
    currentCourse: null,
    currentLesson: null,
    currentQuiz: null,
    quizAnswers: {},
    allCourses: [],
    activeCourseDomainFilter: 'ALL'
  };

  // DOM Elements
  const els = {
    headerAuthControls: document.getElementById('header-auth-controls'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserRole: document.getElementById('header-user-role'),
    btnLogout: document.getElementById('btn-logout'),
    appNavBar: document.getElementById('app-nav-bar'),
    navTabsContainer: document.getElementById('nav-tabs-container'),
    
    // Core & Intelligence Views
    viewLogin: document.getElementById('view-login'),
    viewEmpDashboard: document.getElementById('view-employee-dashboard'),
    viewEmpProfile: document.getElementById('view-employee-profile'),
    viewEmpAssessment: document.getElementById('view-employee-assessment'),
    viewEmpResult: document.getElementById('view-employee-result'),
    viewEmpGaps: document.getElementById('view-employee-gaps'),
    viewEmpRecommendations: document.getElementById('view-employee-recommendations'),
    viewEmpRoadmap: document.getElementById('view-employee-roadmap'),
    viewEmpAssistant: document.getElementById('view-employee-assistant'),
    viewAdminDashboard: document.getElementById('view-admin-dashboard'),
    viewPlaceholder: document.getElementById('view-placeholder'),

    // Stage 3 Learning Views
    viewEmpCourses: document.getElementById('view-employee-courses'),
    viewCourseDetail: document.getElementById('view-course-detail'),
    viewLessonDetail: document.getElementById('view-lesson-detail'),
    viewQuizzesList: document.getElementById('view-quizzes-list'),
    viewQuizDetail: document.getElementById('view-quiz-detail'),
    viewQuizResult: document.getElementById('view-quiz-result'),

    // Login
    formLogin: document.getElementById('form-login'),
    inputIdentifier: document.getElementById('input-identifier'),
    inputPassword: document.getElementById('input-password'),
    btnFillEmp1: document.getElementById('btn-fill-emp1'),
    btnFillEmp2: document.getElementById('btn-fill-emp2'),
    btnFillAdmin: document.getElementById('btn-fill-admin'),

    // Dashboard
    dashGreeting: document.getElementById('dash-greeting'),
    dashSubtext: document.getElementById('dash-subtext'),
    dashBaselineBannerBadge: document.getElementById('dash-baseline-banner-badge'),
    statBaselineStatus: document.getElementById('stat-baseline-status'),
    statBaselineDesc: document.getElementById('stat-baseline-desc'),
    statCompCount: document.getElementById('stat-comp-count'),
    statAvgBaseline: document.getElementById('stat-avg-baseline'),
    statAvgCurrent: document.getElementById('stat-avg-current'),
    statGrowthPct: document.getElementById('stat-growth-pct'),
    btnDashTakeAssessment: document.getElementById('btn-dash-take-assessment'),
    btnDashViewProfile: document.getElementById('btn-dash-view-profile'),
    btnDashViewFullResult: document.getElementById('btn-dash-view-full-result'),
    dashCompetenciesContainer: document.getElementById('dash-competencies-container'),

    // Profile Form
    formProfileEdit: document.getElementById('form-profile-edit'),
    profUsername: document.getElementById('prof-username'),
    profEmail: document.getElementById('prof-email'),
    profFullName: document.getElementById('prof-fullname'),
    profDesignation: document.getElementById('prof-designation'),
    profDepartment: document.getElementById('prof-department'),
    profCadre: document.getElementById('prof-cadre'),
    profPhone: document.getElementById('prof-phone'),
    profBio: document.getElementById('prof-bio'),
    btnCancelProfile: document.getElementById('btn-cancel-profile'),

    // Assessment
    assessTitle: document.getElementById('assess-title'),
    assessDescription: document.getElementById('assess-description'),
    assessProgressBar: document.getElementById('assess-progress-bar'),
    assessProgressText: document.getElementById('assess-progress-text'),
    formAssessment: document.getElementById('form-assessment'),
    questionsListContainer: document.getElementById('questions-list-container'),
    btnCancelAssessment: document.getElementById('btn-cancel-assessment'),

    // Result
    resultBadgeType: document.getElementById('result-badge-type'),
    resStatAttempt: document.getElementById('res-stat-attempt'),
    resStatAttemptDesc: document.getElementById('res-stat-attempt-desc'),
    resStatOverall: document.getElementById('res-stat-overall'),
    resStatCorrectCount: document.getElementById('res-stat-correct-count'),
    resultCompetenciesGrid: document.getElementById('result-competencies-grid'),
    btnToggleReview: document.getElementById('btn-toggle-review'),
    resultReviewContainer: document.getElementById('result-review-container'),
    btnResultToDashboard: document.getElementById('btn-result-to-dashboard'),
    btnRetakeAssessment: document.getElementById('btn-retake-assessment'),

    // Skill Gaps View Elements
    gapsStatActiveCount: document.getElementById('gaps-stat-active-count'),
    gapsStatHighCount: document.getElementById('gaps-stat-high-count'),
    gapsStatMedCount: document.getElementById('gaps-stat-med-count'),
    gapsStatMetCount: document.getElementById('gaps-stat-met-count'),
    gapsDomainFilters: document.getElementById('gaps-domain-filters'),
    gapsListContainer: document.getElementById('gaps-list-container'),
    btnGapsToRecommendations: document.getElementById('btn-gaps-to-recommendations'),
    btnGapsToRoadmap: document.getElementById('btn-gaps-to-roadmap'),

    // Recommendations View Elements
    recommendationsContainer: document.getElementById('recommendations-container'),
    btnRecsToRoadmap: document.getElementById('btn-recs-to-roadmap'),
    btnRecsToGaps: document.getElementById('btn-recs-to-gaps'),

    // Roadmap View Elements
    roadmapStatStages: document.getElementById('roadmap-stat-stages'),
    roadmapStatGaps: document.getElementById('roadmap-stat-gaps'),
    roadmapStatHours: document.getElementById('roadmap-stat-hours'),
    roadmapStatDomain: document.getElementById('roadmap-stat-domain'),
    roadmapPhasesContainer: document.getElementById('roadmap-phases-container'),
    btnRoadmapToAssistant: document.getElementById('btn-roadmap-to-assistant'),
    btnRoadmapToRecs: document.getElementById('btn-roadmap-to-recs'),

    // Study Assistant Elements
    astOfficerName: document.getElementById('ast-officer-name'),
    astOfficerDept: document.getElementById('ast-officer-dept'),
    chatThreadContainer: document.getElementById('chat-thread-container'),
    formStudyAssistant: document.getElementById('form-study-assistant'),
    inputAssistantQuery: document.getElementById('input-assistant-query'),

    // Stage 3 Learning Elements - Courses
    crsStatTotal: document.getElementById('crs-stat-total'),
    crsStatInProgress: document.getElementById('crs-stat-in-progress'),
    crsStatCompleted: document.getElementById('crs-stat-completed'),
    crsStatLessonsCompleted: document.getElementById('crs-stat-lessons-completed'),
    coursesDomainFilters: document.getElementById('courses-domain-filters'),
    coursesListContainer: document.getElementById('courses-list-container'),

    // Stage 3 Learning Elements - Course Detail
    btnBackToCourses: document.getElementById('btn-back-to-courses'),
    courseDetailSourceBadge: document.getElementById('course-detail-source-badge'),
    courseDetailTitle: document.getElementById('course-detail-title'),
    courseDetailDomainBadge: document.getElementById('course-detail-domain-badge'),
    courseDetailMeta: document.getElementById('course-detail-meta'),
    courseDetailDescription: document.getElementById('course-detail-description'),
    courseDetailCompetenciesList: document.getElementById('course-detail-competencies-list'),
    courseDetailProgressLabel: document.getElementById('course-detail-progress-label'),
    courseDetailProgressBar: document.getElementById('course-detail-progress-bar'),
    courseDetailLessonsCount: document.getElementById('course-detail-lessons-count'),
    courseDetailLessonsList: document.getElementById('course-detail-lessons-list'),
    courseDetailQuizContainer: document.getElementById('course-detail-quiz-container'),

    // Stage 3 Learning Elements - Lesson Detail
    btnLessonBackToCourse: document.getElementById('btn-lesson-back-to-course'),
    lessonHeaderBreadcrumb: document.getElementById('lesson-header-breadcrumb'),
    lessonDetailTitle: document.getElementById('lesson-detail-title'),
    lessonDetailStatusBadge: document.getElementById('lesson-detail-status-badge'),
    lessonDetailMeta: document.getElementById('lesson-detail-meta'),
    lessonContentBody: document.getElementById('lesson-content-body'),
    lessonMaterialsList: document.getElementById('lesson-materials-list'),
    lessonCompletionStatusText: document.getElementById('lesson-completion-status-text'),
    lessonCompletionStatusDesc: document.getElementById('lesson-completion-status-desc'),
    btnMarkLessonComplete: document.getElementById('btn-mark-lesson-complete'),
    btnLessonPrev: document.getElementById('btn-lesson-prev'),
    btnLessonNext: document.getElementById('btn-lesson-next'),

    // Stage 3 Learning Elements - Quizzes Hub
    quizzesGridContainer: document.getElementById('quizzes-grid-container'),

    // Stage 3 Learning Elements - Quiz Detail
    btnQuizCancel: document.getElementById('btn-quiz-cancel'),
    quizDetailTitle: document.getElementById('quiz-detail-title'),
    quizPassMarkBadge: document.getElementById('quiz-pass-mark-badge'),
    quizDetailDescription: document.getElementById('quiz-detail-description'),
    quizProgressBar: document.getElementById('quiz-progress-bar'),
    quizProgressText: document.getElementById('quiz-progress-text'),
    formQuiz: document.getElementById('form-quiz'),
    quizQuestionsContainer: document.getElementById('quiz-questions-container'),
    btnCancelQuizForm: document.getElementById('btn-cancel-quiz-form'),

    // Stage 3 Learning Elements - Quiz Result
    quizResultTitle: document.getElementById('quiz-result-title'),
    quizResultPassBadge: document.getElementById('quiz-result-pass-badge'),
    quizResStatScore: document.getElementById('quiz-res-stat-score'),
    quizResStatPassDesc: document.getElementById('quiz-res-stat-pass-desc'),
    quizResStatCorrect: document.getElementById('quiz-res-stat-correct'),
    quizReviewContainer: document.getElementById('quiz-review-container'),
    btnQuizResToCourse: document.getElementById('btn-quiz-res-to-course'),
    btnQuizResRetake: document.getElementById('btn-quiz-res-retake'),
    btnQuizResToCatalog: document.getElementById('btn-quiz-res-to-catalog'),

    // Placeholder
    plBadge: document.getElementById('pl-badge'),
    plTitle: document.getElementById('pl-title'),
    plDesc: document.getElementById('pl-desc'),
    plOwner: document.getElementById('pl-owner'),
    plResponsibilities: document.getElementById('pl-responsibilities')
  };

  /**
   * Hide all SPA views
   */
  function hideAllViews() {
    els.viewLogin.style.display = 'none';
    els.viewEmpDashboard.style.display = 'none';
    els.viewEmpProfile.style.display = 'none';
    els.viewEmpAssessment.style.display = 'none';
    els.viewEmpResult.style.display = 'none';
    if (els.viewEmpGaps) els.viewEmpGaps.style.display = 'none';
    if (els.viewEmpRecommendations) els.viewEmpRecommendations.style.display = 'none';
    if (els.viewEmpRoadmap) els.viewEmpRoadmap.style.display = 'none';
    if (els.viewEmpAssistant) els.viewEmpAssistant.style.display = 'none';
    if (els.viewEmpCourses) els.viewEmpCourses.style.display = 'none';
    if (els.viewCourseDetail) els.viewCourseDetail.style.display = 'none';
    if (els.viewLessonDetail) els.viewLessonDetail.style.display = 'none';
    if (els.viewQuizzesList) els.viewQuizzesList.style.display = 'none';
    if (els.viewQuizDetail) els.viewQuizDetail.style.display = 'none';
    if (els.viewQuizResult) els.viewQuizResult.style.display = 'none';
    els.viewAdminDashboard.style.display = 'none';
    els.viewPlaceholder.style.display = 'none';
  }

  /**
   * Switch Active SPA View
   */
  function switchView(viewName, data = {}) {
    hideAllViews();
    state.activeTab = viewName;

    // Update active class on nav tabs
    const allTabs = document.querySelectorAll('.nav-tab');
    allTabs.forEach(tab => {
      if (tab.dataset.tab === viewName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    switch (viewName) {
      case 'login':
        els.headerAuthControls.style.display = 'none';
        els.appNavBar.style.display = 'none';
        els.viewLogin.style.display = 'block';
        break;

      case 'dashboard':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpDashboard.style.display = 'block';
        loadEmployeeDashboard();
        break;

      case 'profile':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpProfile.style.display = 'block';
        loadEmployeeProfile();
        break;

      case 'assessment':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpAssessment.style.display = 'block';
        loadAssessmentView();
        break;

      case 'result':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpResult.style.display = 'block';
        loadAssessmentResultView();
        break;

      case 'skill-gaps':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpGaps.style.display = 'block';
        loadSkillGapsView();
        break;

      case 'recommendations':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpRecommendations.style.display = 'block';
        loadRecommendationsView();
        break;

      case 'roadmap':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpRoadmap.style.display = 'block';
        loadRoadmapView();
        break;

      case 'assistant':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpAssistant.style.display = 'block';
        loadAssistantView();
        break;

      case 'learning':
      case 'courses':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewEmpCourses.style.display = 'block';
        loadCoursesView();
        break;

      case 'course-detail':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewCourseDetail.style.display = 'block';
        if (data && data.courseId) {
          loadCourseDetailView(data.courseId);
        }
        break;

      case 'lesson-detail':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewLessonDetail.style.display = 'block';
        if (data && data.lessonId) {
          loadLessonDetailView(data.lessonId);
        }
        break;

      case 'quizzes':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewQuizzesList.style.display = 'block';
        loadQuizzesListView();
        break;

      case 'quiz-detail':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewQuizDetail.style.display = 'block';
        if (data && data.quizId) {
          loadQuizDetailView(data.quizId);
        }
        break;

      case 'quiz-result':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewQuizResult.style.display = 'block';
        if (data && data.result) {
          loadQuizResultView(data.result);
        }
        break;

      case 'admin-dashboard':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewAdminDashboard.style.display = 'block';
        if (window.AdminPortal) {
          window.AdminPortal.loadAdminOverview();
        }
        break;

      case 'placeholder':
        els.headerAuthControls.style.display = 'flex';
        els.appNavBar.style.display = 'block';
        els.viewPlaceholder.style.display = 'block';
        renderPlaceholderView(data);
        break;

      default:
        console.warn('Unknown view:', viewName);
    }
  }

  /**
   * Render Navigation Tabs based on Role
   */
  function renderNavTabs(user) {
    els.navTabsContainer.innerHTML = '';

    if (user.role === 'admin') {
      const adminTabs = [
        { id: 'admin-dashboard', label: 'Dashboard', future: false },
        { id: 'admin-workforce', label: 'Workforce Insights', future: true, stage: 'Stage 5', owner: 'Palak', desc: 'Workforce skill matrix, division heatmaps, and macro competency analytics.' },
        { id: 'admin-content', label: 'Learning Content', future: true, stage: 'Stage 5', owner: 'Palak', desc: 'Manage official course catalog and external iGOT/NSSTA content linkages.' },
        { id: 'admin-quizzes', label: 'Quiz Review', future: true, stage: 'Stage 5', owner: 'Palak', desc: 'Audit question banks, evaluate item difficulties, and approve quiz modules.' }
      ];

      adminTabs.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'nav-tab';
        btn.dataset.tab = t.id;
        btn.innerHTML = `${t.label} ${t.future ? `<span class="tab-badge-future">${t.stage}</span>` : ''}`;
        btn.onclick = () => {
          if (t.future) {
            switchView('placeholder', t);
          } else {
            switchView(t.id);
          }
        };
        els.navTabsContainer.appendChild(btn);
      });
    } else {
      const employeeTabs = [
        { id: 'dashboard', label: 'Dashboard', future: false },
        { id: 'skill-gaps', label: 'Skill Gaps', future: false },
        { id: 'recommendations', label: 'Recommendations', future: false },
        { id: 'roadmap', label: 'Roadmap', future: false },
        { id: 'learning', label: 'Learning', future: false },
        { id: 'quizzes', label: 'Quizzes', future: false },
        { id: 'assistant', label: 'Study Assistant', future: false },
        { id: 'assessment', label: 'Assessment', future: false },
        { id: 'result', label: 'Results', future: false },
        { id: 'profile', label: 'Profile', future: false },
        { id: 'achievements', label: 'Achievements', future: true, stage: 'Stage 4', owner: 'Pallav', desc: 'Official badges, skill milestones, and recognition trophies.' },
        { id: 'leaderboard', label: 'Leaderboard', future: true, stage: 'Stage 4', owner: 'Pallav', desc: 'Growth-based leaderboard tracking individual improvement from baseline.' }
      ];

      employeeTabs.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'nav-tab';
        btn.dataset.tab = t.id;
        btn.innerHTML = `${t.label} ${t.future ? `<span class="tab-badge-future">${t.stage}</span>` : ''}`;
        btn.onclick = () => {
          if (t.future) {
            switchView('placeholder', t);
          } else {
            switchView(t.id);
          }
        };
        els.navTabsContainer.appendChild(btn);
      });
    }
  }

  /**
   * Render Placeholder for Future Modules
   */
  function renderPlaceholderView(data) {
    els.plBadge.textContent = `${data.stage || 'FUTURE STAGE'} • PLANNED MODULE`;
    els.plTitle.textContent = data.label || 'Feature Under Development';
    els.plDesc.textContent = data.desc || 'This capability is part of the modular NAVBODH architecture and will be integrated in subsequent stages.';
    els.plOwner.textContent = `Assigned Contributor: ${data.owner || 'Next Contributor'} (${data.stage || ''})`;
    els.plResponsibilities.textContent = `Core Foundation has already prepared the necessary database schema, tables, and API routes for this feature.`;
  }

  /**
   * Update Header User Identity Display
   */
  function updateUserHeader(user) {
    els.headerUserName.textContent = user.full_name || user.username;
    els.headerUserRole.textContent = user.role.toUpperCase();
    els.headerUserRole.className = `user-role-badge role-${user.role}`;
  }

  /**
   * Helper: Return domain CSS class
   */
  function getDomainClass(domain) {
    if (domain === 'Statistical') return 'domain-statistical';
    if (domain === 'Technical') return 'domain-technical';
    if (domain === 'Digital Governance') return 'domain-digital-governance';
    if (domain === 'Behavioural / Managerial') return 'domain-behavioural-managerial';
    return 'domain-statistical';
  }

  /**
   * Load Employee Dashboard
   */
  async function loadEmployeeDashboard() {
    try {
      const data = await API.getProfile();
      state.profileData = data;
      const user = data.profile;
      const metrics = data.metrics;

      els.dashGreeting.textContent = `Welcome, ${user.full_name}`;
      els.dashSubtext.textContent = `${user.designation || 'Statistical Officer'} • ${user.department_name || 'MoSPI'} • ${user.cadre || 'Official Statistics'}`;

      if (data.has_baseline) {
        els.dashBaselineBannerBadge.innerHTML = `<span class="badge-pixel text-forest" style="background: var(--color-forest-light); padding: 4px 10px; border: 1px solid var(--color-forest);">✓ BASELINE ACTIVE</span>`;
        els.statBaselineStatus.textContent = 'ESTABLISHED';
        els.statBaselineStatus.style.color = 'var(--color-forest)';
        els.statBaselineDesc.textContent = `${metrics.total_attempts} Assessment(s) Completed`;

        els.statAvgBaseline.textContent = `${metrics.average_baseline_score}%`;
        els.statAvgCurrent.textContent = `${metrics.average_current_score}%`;
        els.statGrowthPct.textContent = `${metrics.growth_percentage >= 0 ? '+' : ''}${metrics.growth_percentage}%`;
        els.statGrowthPct.style.color = metrics.growth_percentage > 0 ? 'var(--color-forest)' : 'var(--color-ink)';

        els.btnDashTakeAssessment.textContent = 'RETAKE ASSESSMENT (UPDATE CURRENT) →';
        els.btnDashViewFullResult.style.display = 'inline-flex';
      } else {
        els.dashBaselineBannerBadge.innerHTML = `<span class="badge-pixel text-ochre" style="background: var(--color-ochre-light); padding: 4px 10px; border: 1px solid var(--color-ochre);">⚠ BASELINE PENDING</span>`;
        els.statBaselineStatus.textContent = 'PENDING';
        els.statBaselineStatus.style.color = 'var(--color-ochre)';
        els.statBaselineDesc.textContent = 'Take assessment to establish baseline';

        els.statAvgBaseline.textContent = '--';
        els.statAvgCurrent.textContent = '--';
        els.statGrowthPct.textContent = '0.0%';

        els.btnDashTakeAssessment.textContent = 'TAKE BASELINE ASSESSMENT NOW →';
        els.btnDashViewFullResult.style.display = 'none';
      }

      els.statCompCount.textContent = `${metrics.assessed_competencies_count} / 17`;

      // Render Competency Summary Grid
      renderDashboardCompetencies(data.competencies);

    } catch (err) {
      console.error('Dashboard load error:', err);
      window.showToast('Could not load profile data: ' + err.message, 'error');
    }
  }

  /**
   * Render Competency Cards on Dashboard
   */
  function renderDashboardCompetencies(competencies) {
    if (!competencies || competencies.length === 0) {
      els.dashCompetenciesContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-xl); color: var(--color-ink-muted);">
          <p>No competency scores recorded yet.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: var(--space-sm);" onclick="window.EmployeePortal.goToAssessment()">
            Take Initial Assessment
          </button>
        </div>
      `;
      return;
    }

    let html = '<div class="competencies-grid">';
    competencies.forEach(c => {
      const domainClass = getDomainClass(c.domain);
      const currentVal = c.current_score || 0;
      const targetVal = c.target_score || 80;
      const baselineVal = c.baseline_score || 0;

      html += `
        <div class="competency-card">
          <div>
            <div class="competency-header">
              <span class="domain-badge ${domainClass}">${c.domain}</span>
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-ink-muted);">${c.code}</span>
            </div>
            <div class="competency-title">${c.name}</div>
            <div style="font-size: 0.8rem; color: var(--color-ink-muted); margin-top: 2px;">${c.description || ''}</div>
          </div>

          <div style="margin-top: var(--space-sm);">
            <div class="competency-scores-row">
              <div class="score-item">
                <span class="score-item-label">Baseline</span>
                <span class="score-item-val" style="color: var(--color-sage);">${baselineVal}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Current</span>
                <span class="score-item-val" style="color: var(--color-forest-dark); font-size: 1.3rem;">${currentVal}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Target</span>
                <span class="score-item-val" style="color: var(--color-ochre);">${targetVal}%</span>
              </div>
            </div>

            <div class="progress-bar-container" title="Current: ${currentVal}% | Target: ${targetVal}%">
              <div class="progress-bar-fill" style="width: ${Math.min(currentVal, 100)}%;"></div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    els.dashCompetenciesContainer.innerHTML = html;
  }

  /**
   * Load Employee Profile View
   */
  async function loadEmployeeProfile() {
    try {
      if (state.departments.length === 0) {
        const deptRes = await API.getDepartments();
        state.departments = deptRes.departments || [];
        els.profDepartment.innerHTML = '';
        state.departments.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `${d.code} — ${d.name}`;
          els.profDepartment.appendChild(opt);
        });
      }

      const res = await API.getProfile();
      const u = res.profile;

      els.profUsername.value = u.username || '';
      els.profEmail.value = u.email || '';
      els.profFullName.value = u.full_name || '';
      els.profDesignation.value = u.designation || '';
      els.profCadre.value = u.cadre || '';
      els.profPhone.value = u.phone || '';
      els.profBio.value = u.bio || '';
      if (u.department_id) {
        els.profDepartment.value = u.department_id;
      }
    } catch (err) {
      console.error('Profile load error:', err);
      window.showToast('Could not load profile: ' + err.message, 'error');
    }
  }

  /**
   * Load Assessment Taking View
   */
  async function loadAssessmentView() {
    try {
      const res = await API.getAssessment();
      state.currentAssessment = res.assessment;
      const questions = res.questions || [];
      state.assessmentAnswers = {};

      els.assessTitle.textContent = res.assessment.title;
      els.assessDescription.textContent = res.assessment.description;

      if (res.has_baseline) {
        document.getElementById('assess-status-badge').textContent = 'RETAKE ASSESSMENT (UPDATE CURRENT)';
      } else {
        document.getElementById('assess-status-badge').textContent = 'INITIAL BASELINE ASSESSMENT';
      }

      renderAssessmentQuestions(questions);
      updateAssessmentProgress(questions.length);

    } catch (err) {
      console.error('Assessment load error:', err);
      window.showToast('Could not load assessment questions: ' + err.message, 'error');
    }
  }

  /**
   * Render Assessment Questions Form
   */
  function renderAssessmentQuestions(questions) {
    els.questionsListContainer.innerHTML = '';

    questions.forEach((q, idx) => {
      const qBox = document.createElement('div');
      qBox.className = 'question-box';
      qBox.id = `q-box-${q.id}`;

      const domainClass = getDomainClass(q.domain);

      let optionsHtml = '';
      q.options.forEach((optText, optIdx) => {
        optionsHtml += `
          <label class="option-item" id="opt-label-${q.id}-${optIdx}">
            <input type="radio" name="q_${q.id}" value="${optIdx}" class="option-radio" data-qid="${q.id}">
            <span>${optText}</span>
          </label>
        `;
      });

      qBox.innerHTML = `
        <div class="question-meta">
          <span class="question-number">QUESTION ${idx + 1} OF ${questions.length}</span>
          <div>
            <span class="domain-badge ${domainClass}">${q.domain}</span>
            <span class="badge-pixel text-muted" style="margin-left: 6px;">${q.competency_name}</span>
          </div>
        </div>
        <div class="question-text">${q.question_text}</div>
        <div class="options-list">
          ${optionsHtml}
        </div>
      `;

      els.questionsListContainer.appendChild(qBox);
    });

    const radios = els.questionsListContainer.querySelectorAll('.option-radio');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qid = e.target.dataset.qid;
        const optVal = Number(e.target.value);
        state.assessmentAnswers[qid] = optVal;

        const labels = document.querySelectorAll(`[id^="opt-label-${qid}-"]`);
        labels.forEach(l => l.classList.remove('selected'));
        const activeLabel = document.getElementById(`opt-label-${qid}-${optVal}`);
        if (activeLabel) activeLabel.classList.add('selected');

        updateAssessmentProgress(questions.length);
      });
    });
  }

  /**
   * Update Assessment Progress Counter
   */
  function updateAssessmentProgress(totalQuestions) {
    const answeredCount = Object.keys(state.assessmentAnswers).length;
    const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    els.assessProgressText.textContent = `${answeredCount} / ${totalQuestions} Questions Answered (${pct}%)`;
    els.assessProgressBar.style.width = `${pct}%`;
  }

  /**
   * Load Assessment Result View
   */
  async function loadAssessmentResultView() {
    try {
      const res = await API.getAssessmentResult();
      if (!res.has_result) {
        window.showToast('No assessment results found. Please complete the assessment first.', 'info');
        switchView('assessment');
        return;
      }

      els.resultBadgeType.textContent = res.is_baseline ? 'OFFICIAL BASELINE ESTABLISHED' : `ASSESSMENT ATTEMPT #${res.attempt_number}`;
      els.resStatAttempt.textContent = `Attempt #${res.attempt_number}`;
      els.resStatAttemptDesc.textContent = res.is_baseline ? 'Permanent Baseline' : 'Score Update';
      els.resStatOverall.textContent = `${res.overall_score}%`;

      const correctCount = (res.question_review || []).filter(q => q.is_correct).length;
      els.resStatCorrectCount.textContent = `${correctCount} of ${(res.question_review || []).length} correct`;

      renderResultCompetencies(res.competencies);
      renderResultReview(res.question_review);

    } catch (err) {
      console.error('Result load error:', err);
      window.showToast('Could not load assessment result: ' + err.message, 'error');
    }
  }

  function renderResultCompetencies(competencies) {
    let html = '';
    (competencies || []).forEach(c => {
      const domainClass = getDomainClass(c.domain);
      const isMet = (c.current_score >= c.target_score);

      html += `
        <div class="competency-card" style="border-left: 4px solid ${isMet ? 'var(--color-forest)' : 'var(--color-ochre)'};">
          <div class="competency-header">
            <span class="domain-badge ${domainClass}">${c.domain}</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-ink-muted);">${c.code}</span>
          </div>
          <div class="competency-title">${c.name}</div>
          <div style="margin-top: var(--space-xs);">
            <div class="competency-scores-row">
              <div class="score-item">
                <span class="score-item-label">Baseline</span>
                <span class="score-item-val">${c.baseline_score}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Current</span>
                <span class="score-item-val" style="color: var(--color-forest-dark);">${c.current_score}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Target</span>
                <span class="score-item-val" style="color: var(--color-ochre);">${c.target_score}%</span>
              </div>
            </div>
            <div class="progress-bar-container" style="margin-top: 4px;">
              <div class="progress-bar-fill" style="width: ${Math.min(c.current_score, 100)}%;"></div>
            </div>
          </div>
        </div>
      `;
    });
    els.resultCompetenciesGrid.innerHTML = html;
  }

  function renderResultReview(reviewList) {
    if (!reviewList || reviewList.length === 0) {
      els.resultReviewContainer.innerHTML = '<p class="text-muted">No review data available.</p>';
      return;
    }

    let html = '';
    reviewList.forEach((r, idx) => {
      html += `
        <div class="question-box" style="border-left: 4px solid ${r.is_correct ? 'var(--color-forest)' : 'var(--color-danger)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="question-number">QUESTION ${idx + 1}</span>
            <span class="badge-pixel ${r.is_correct ? 'text-forest' : 'text-danger'}">
              ${r.is_correct ? '✓ CORRECT' : '✕ INCORRECT'}
            </span>
          </div>
          <div class="question-text" style="font-size: 0.95rem;">${r.question_text}</div>
          
          <div style="margin-top: var(--space-xs); font-size: 0.86rem;">
            <div style="margin-bottom: 2px;">
              <strong>Your Answer:</strong> <span style="color: ${r.is_correct ? 'var(--color-forest)' : 'var(--color-danger)'};">${r.submitted_option_text}</span>
            </div>
            ${!r.is_correct ? `
              <div style="margin-bottom: 2px;">
                <strong>Correct Answer:</strong> <span style="color: var(--color-forest); font-weight: 700;">${r.correct_option_text}</span>
              </div>
            ` : ''}
            <div style="margin-top: 6px; padding: var(--space-xs); background: var(--color-paper-light); border: var(--border-subtle); font-size: 0.82rem;">
              <strong>Explanation:</strong> ${r.explanation || 'No explanation provided.'}
            </div>
          </div>
        </div>
      `;
    });
    els.resultReviewContainer.innerHTML = html;
  }

  /**
   * ==========================================================================
   * STAGE 2: INTELLIGENCE UI LOADERS & RENDERERS
   * ==========================================================================
   */

  let currentGapsData = null;
  let currentActiveDomainFilter = 'ALL';

  async function loadSkillGapsView() {
    try {
      if (!els.gapsListContainer) return;
      els.gapsListContainer.innerHTML = '<div style="text-align:center; padding: var(--space-xl); color: var(--color-ink-muted);">Computing competency deficiencies...</div>';

      const res = await API.intelligence.getSkillGaps();
      currentGapsData = res;

      if (!res.hasAssessment) {
        els.gapsStatActiveCount.textContent = '0';
        els.gapsStatHighCount.textContent = '0';
        els.gapsStatMedCount.textContent = '0';
        els.gapsStatMetCount.textContent = '0';

        els.gapsListContainer.innerHTML = `
          <div class="empty-state-card">
            <h3 class="empty-state-title">No Assessment Completed Yet</h3>
            <p class="empty-state-desc">${res.message || 'Complete your competency assessment to generate personalized skill gaps and recommendations.'}</p>
            <button class="btn btn-primary" onclick="window.EmployeePortal.goToAssessment()">
              Take Baseline Assessment Now →
            </button>
          </div>
        `;
        return;
      }

      const summary = res.summary;
      els.gapsStatActiveCount.textContent = summary.activeGapsCount;
      els.gapsStatHighCount.textContent = summary.highPriorityCount;
      els.gapsStatMedCount.textContent = summary.mediumPriorityCount;
      els.gapsStatMetCount.textContent = summary.metCount;

      renderSkillGapsList(res.allCompetencies, currentActiveDomainFilter);

    } catch (err) {
      console.error('Skill gaps load error:', err);
      window.showToast('Could not load skill gaps: ' + err.message, 'error');
    }
  }

  function renderSkillGapsList(competencies, filterDomain) {
    if (!competencies || competencies.length === 0) {
      els.gapsListContainer.innerHTML = '<div class="empty-state-card"><p>No competency data available.</p></div>';
      return;
    }

    const filtered = filterDomain === 'ALL'
      ? competencies
      : competencies.filter(c => c.domain === filterDomain);

    if (filtered.length === 0) {
      els.gapsListContainer.innerHTML = `
        <div class="empty-state-card">
          <p>No competencies found for domain: <strong>${filterDomain}</strong></p>
        </div>
      `;
      return;
    }

    let html = '<div class="competencies-grid">';
    filtered.forEach(c => {
      const domainClass = getDomainClass(c.domain);
      const isDeficiency = c.gap > 0;
      let badgeClass = 'badge-priority-met';
      let badgeLabel = 'BENCHMARK MET';

      if (c.priority === 'high') {
        badgeClass = 'badge-priority-high';
        badgeLabel = 'HIGH PRIORITY';
      } else if (c.priority === 'medium') {
        badgeClass = 'badge-priority-medium';
        badgeLabel = 'MEDIUM PRIORITY';
      } else if (c.priority === 'low') {
        badgeClass = 'badge-priority-low';
        badgeLabel = 'LOW PRIORITY';
      }

      html += `
        <div class="competency-card" style="border-left: 5px solid ${isDeficiency ? (c.priority === 'high' ? 'var(--color-danger)' : 'var(--color-ochre)') : 'var(--color-forest)'};">
          <div>
            <div class="competency-header">
              <span class="domain-badge ${domainClass}">${c.domain}</span>
              <span class="${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="competency-title">${c.competency || c.name}</div>
            <div style="font-size: 0.8rem; color: var(--color-ink-muted); margin-top: 2px;">
              ${c.description || ''}
            </div>
          </div>

          <div style="margin-top: var(--space-sm);">
            <div class="competency-scores-row">
              <div class="score-item">
                <span class="score-item-label">Current</span>
                <span class="score-item-val" style="color: var(--color-forest-dark); font-size: 1.25rem;">${c.currentScore}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Target</span>
                <span class="score-item-val" style="color: var(--color-ochre);">${c.targetScore}%</span>
              </div>
              <div class="score-item">
                <span class="score-item-label">Deficiency Gap</span>
                <span class="score-item-val ${isDeficiency ? 'gap-delta-negative' : 'gap-delta-positive'}">
                  ${isDeficiency ? `-${c.gap} pts` : '0 pts'}
                </span>
              </div>
            </div>

            <div class="progress-bar-container" style="margin-top: 6px;" title="Current: ${c.currentScore}% | Target: ${c.targetScore}%">
              <div class="progress-bar-fill" style="width: ${Math.min(c.currentScore, 100)}%;"></div>
            </div>

            ${isDeficiency ? `
              <div style="margin-top: var(--space-xs); display: flex; justify-content: flex-end;">
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeePortal.switchView('recommendations')" title="Explore courses addressing this gap">
                  Find Training →
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';

    els.gapsListContainer.innerHTML = html;
  }

  async function loadRecommendationsView() {
    try {
      if (!els.recommendationsContainer) return;
      els.recommendationsContainer.innerHTML = '<div style="text-align:center; padding: var(--space-xl); color: var(--color-ink-muted);">Curating personalized learning recommendations...</div>';

      const res = await API.intelligence.getRecommendations();

      if (!res.hasAssessment) {
        els.recommendationsContainer.innerHTML = `
          <div class="empty-state-card">
            <h3 class="empty-state-title">Competency Evaluation Required</h3>
            <p class="empty-state-desc">${res.message || 'Complete your competency assessment to generate personalized skill gaps and recommendations.'}</p>
            <button class="btn btn-primary" onclick="window.EmployeePortal.goToAssessment()">
              Take Baseline Assessment Now →
            </button>
          </div>
        `;
        return;
      }

      if (!res.recommendations || res.recommendations.length === 0) {
        els.recommendationsContainer.innerHTML = `
          <div class="empty-state-card">
            <h3 class="empty-state-title">No Active Recommendations Needed</h3>
            <p class="empty-state-desc">${res.message || 'All your competency benchmarks have been achieved!'}</p>
            <button class="btn btn-secondary" onclick="window.EmployeePortal.switchView('roadmap')">
              View Learning Roadmap →
            </button>
          </div>
        `;
        return;
      }

      renderRecommendationsGrid(res.recommendations);

    } catch (err) {
      console.error('Recommendations load error:', err);
      window.showToast('Could not load course recommendations: ' + err.message, 'error');
    }
  }

  function renderRecommendationsGrid(recommendations) {
    let html = '<div class="recommendations-grid">';

    recommendations.forEach(course => {
      const domainClass = getDomainClass(course.domain);

      let matchedPills = '';
      (course.matchedCompetencies || []).forEach(m => {
        let badgeClass = 'badge-priority-low';
        if (m.priority === 'high') badgeClass = 'badge-priority-high';
        else if (m.priority === 'medium') badgeClass = 'badge-priority-medium';

        matchedPills += `
          <span class="matched-comp-pill">
            <strong>${m.name}</strong>
            <span class="${badgeClass}">${m.priority.toUpperCase()} (-${m.gap} pts)</span>
          </span>
        `;
      });

      html += `
        <div class="recommendation-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-xs); margin-bottom: 6px;">
              <span class="domain-badge ${domainClass}">${course.domain || 'Statistical'}</span>
              <span class="badge-source">${course.sourceDisplayName || course.source}</span>
            </div>

            <h3 style="font-size: 1.05rem; margin-bottom: 4px; color: var(--color-ink);">${course.title}</h3>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-muted); margin-bottom: var(--space-xs);">
              ${course.courseCode} • ${course.durationHours} Hours • ${(course.difficultyLevel || 'INTERMEDIATE').toUpperCase()}
            </div>

            <p style="font-size: 0.85rem; color: var(--color-ink-light); margin-bottom: var(--space-sm); line-height: 1.45;">
              ${course.description || ''}
            </p>

            <div style="margin-bottom: var(--space-xs);">
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-ink-muted); margin-bottom: 4px;">TARGETED DEFICIENCIES:</div>
              <div style="display: flex; flex-wrap: wrap;">
                ${matchedPills}
              </div>
            </div>

            <div class="reason-box">
              <strong>Recommendation Rationale:</strong> ${course.reason}
            </div>
          </div>

          <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-xs);">
            <span style="font-size: 0.78rem; color: var(--color-ink-muted); font-family: var(--font-mono);">
              Relevance: ${course.rankingScore}
            </span>
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn-secondary btn-sm" onclick="window.EmployeePortal.switchView('roadmap')">
                In Roadmap
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.EmployeePortal.openCourse(${course.courseId})">
                Start Course →
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    els.recommendationsContainer.innerHTML = html;
  }

  async function loadRoadmapView() {
    try {
      if (!els.roadmapPhasesContainer) return;
      els.roadmapPhasesContainer.innerHTML = '<div style="text-align:center; padding: var(--space-xl); color: var(--color-ink-muted);">Generating dynamic learning roadmap...</div>';

      const res = await API.intelligence.getRoadmap();

      if (!res.hasAssessment) {
        els.roadmapStatStages.textContent = '0';
        els.roadmapStatGaps.textContent = '0';
        els.roadmapStatHours.textContent = '0 hrs';
        els.roadmapStatDomain.textContent = '--';

        els.roadmapPhasesContainer.innerHTML = `
          <div class="empty-state-card">
            <h3 class="empty-state-title">Roadmap Uninitialized</h3>
            <p class="empty-state-desc">${res.message || 'Complete your competency assessment to generate personalized skill gaps and recommendations.'}</p>
            <button class="btn btn-primary" onclick="window.EmployeePortal.goToAssessment()">
              Take Baseline Assessment Now →
            </button>
          </div>
        `;
        return;
      }

      const summary = res.roadmapSummary;
      els.roadmapStatStages.textContent = summary.totalStages;
      els.roadmapStatGaps.textContent = summary.totalGapsToBridge;
      els.roadmapStatHours.textContent = `${summary.totalEstimatedHours} hrs`;
      els.roadmapStatDomain.textContent = summary.primaryFocusDomain;

      renderRoadmapPhases(res.stages);

    } catch (err) {
      console.error('Roadmap load error:', err);
      window.showToast('Could not load learning roadmap: ' + err.message, 'error');
    }
  }

  function renderRoadmapPhases(stages) {
    if (!stages || stages.length === 0) {
      els.roadmapPhasesContainer.innerHTML = `
        <div class="empty-state-card">
          <h3 class="empty-state-title">Roadmap Complete!</h3>
          <p class="empty-state-desc">All official statistical competency targets are satisfied.</p>
        </div>
      `;
      return;
    }

    let html = '';

    stages.forEach(stage => {
      let phaseBadgeClass = 'badge-priority-met';
      if (stage.priority === 'high') phaseBadgeClass = 'badge-priority-high';
      else if (stage.priority === 'medium') phaseBadgeClass = 'badge-priority-medium';
      else if (stage.priority === 'low') phaseBadgeClass = 'badge-priority-low';

      let itemsHtml = '';
      (stage.items || []).forEach(item => {
        const domainClass = getDomainClass(item.domain);
        const isDeficiency = item.gap > 0;

        let coursesHtml = '';
        if (item.recommendedCourses && item.recommendedCourses.length > 0) {
          item.recommendedCourses.forEach(crs => {
            const courseTargetId = crs.course_id || crs.courseId || crs.id;
            coursesHtml += `
              <div class="milestone-course-chip">
                <div>
                  <strong>${crs.title}</strong>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-ink-muted); margin-left: 6px;">(${crs.sourceDisplayName || crs.source} • ${crs.durationHours} hrs)</span>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeePortal.openCourse(${courseTargetId})">
                  Start Learning →
                </button>
              </div>
            `;
          });
        } else {
          coursesHtml = `<div style="font-size: 0.8rem; color: var(--color-ink-muted); font-style: italic;">No specific course mapped yet. Follow self-paced applied exercises.</div>`;
        }

        itemsHtml += `
          <div class="roadmap-milestone-item">
            <div class="milestone-order-circle">${item.order}</div>
            <div class="milestone-details">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-xs);">
                <div>
                  <span class="domain-badge ${domainClass}">${item.domain}</span>
                  <span style="font-weight: 700; font-size: 1.05rem; margin-left: 6px;">${item.competency}</span>
                  <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-muted); margin-left: 6px;">(${item.competencyCode})</span>
                </div>
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.84rem; font-weight: 700;">
                    Score: ${item.currentScore} / Target: ${item.targetScore}
                  </span>
                  <span class="gap-delta-indicator ${isDeficiency ? 'gap-delta-negative' : 'gap-delta-positive'}" style="margin-left: 6px;">
                    (${isDeficiency ? `-${item.gap} gap` : 'Met'})
                  </span>
                </div>
              </div>

              <div style="font-size: 0.86rem; color: var(--color-ink-light); margin: var(--space-xs) 0;">
                <strong>Pedagogical Focus:</strong> ${item.suggestedFocus}
              </div>

              <div class="milestone-courses-list">
                <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-ink-muted);">RECOMMENDED TRAINING:</div>
                ${coursesHtml}
              </div>
            </div>
          </div>
        `;
      });

      html += `
        <div class="roadmap-phase-container">
          <div class="roadmap-phase-header">
            <div>
              <h3 style="margin-bottom: 2px;">${stage.title}</h3>
              <p class="text-muted" style="font-size: 0.84rem;">${stage.description}</p>
            </div>
            <span class="${phaseBadgeClass}">${stage.badge}</span>
          </div>
          <div class="roadmap-milestones-list">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    els.roadmapPhasesContainer.innerHTML = html;
  }

  async function loadAssistantView() {
    try {
      if (state.currentUser) {
        if (els.astOfficerName) els.astOfficerName.textContent = state.currentUser.full_name;
        if (els.astOfficerDept) els.astOfficerDept.textContent = state.currentUser.department_name || 'MoSPI Division';
      }

      if (els.chatThreadContainer && els.chatThreadContainer.children.length === 0) {
        const initialMsg = `Hello ${state.currentUser ? state.currentUser.full_name : 'Officer'}. I am your NAVBODH Explainable Study Assistant.\n\nI can analyze your official statistical competency scores, break down your skill gaps, and guide your learning sequence.\n\nTry clicking any of the quick inquiries above or type a question below!`;
        appendAssistantMessage(initialMsg, 'NAVBODH Rule-Based Intelligence Engine (Demo)');
      }
    } catch (err) {
      console.error('Assistant view error:', err);
    }
  }

  function appendUserMessage(text) {
    if (!els.chatThreadContainer) return;
    const row = document.createElement('div');
    row.className = 'chat-message-row user-msg';
    row.innerHTML = `
      <div class="chat-bubble user-bubble">${escapeHtml(text)}</div>
    `;
    els.chatThreadContainer.appendChild(row);
    els.chatThreadContainer.scrollTop = els.chatThreadContainer.scrollHeight;
  }

  function appendAssistantMessage(text, engineLabel) {
    if (!els.chatThreadContainer) return;
    const row = document.createElement('div');
    row.className = 'chat-message-row assistant-msg';
    row.innerHTML = `
      <div class="assistant-avatar-icon">NB</div>
      <div>
        <div class="chat-bubble assistant-bubble">${formatAssistantMarkdown(text)}</div>
        <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--color-ink-muted); margin-top: 3px; padding-left: 4px;">
          ${engineLabel || 'NAVBODH Intelligence Engine'}
        </div>
      </div>
    `;
    els.chatThreadContainer.appendChild(row);
    els.chatThreadContainer.scrollTop = els.chatThreadContainer.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatAssistantMarkdown(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/• (.*?)(?=\n|$)/g, '• $1');
    return safe;
  }

  async function sendAssistantQuery(query) {
    if (!query || !query.trim()) return;

    appendUserMessage(query.trim());
    els.inputAssistantQuery.value = '';

    const loadingRow = document.createElement('div');
    loadingRow.className = 'chat-message-row assistant-msg';
    loadingRow.id = 'ast-loading-indicator';
    loadingRow.innerHTML = `
      <div class="assistant-avatar-icon">NB</div>
      <div class="chat-bubble assistant-bubble" style="font-style: italic; color: var(--color-ink-muted);">
        Analyzing competency benchmarks & generating response...
      </div>
    `;
    els.chatThreadContainer.appendChild(loadingRow);
    els.chatThreadContainer.scrollTop = els.chatThreadContainer.scrollHeight;

    try {
      const res = await API.intelligence.askStudyAssistant(query.trim());
      loadingRow.remove();
      appendAssistantMessage(res.reply, res.engine);
    } catch (err) {
      loadingRow.remove();
      appendAssistantMessage(`An error occurred while processing your study assistant request: ${err.message}`, 'System Error Handler');
    }
  }

  /**
   * ==========================================================================
   * STAGE 3: LEARNING UI LOADERS & RENDERERS (Owner: Pathika)
   * ==========================================================================
   */

  /**
   * Load Courses Catalogue View
   */
  async function loadCoursesView() {
    try {
      if (!els.coursesListContainer) return;
      els.coursesListContainer.innerHTML = '<div style="text-align:center; padding: var(--space-xl); color: var(--color-ink-muted);">Loading official course catalogue...</div>';

      const res = await API.learning.getCourses();
      state.allCourses = res.courses || [];

      // Calculate aggregated metrics
      let inProgressCount = 0;
      let completedCoursesCount = 0;
      let totalLessonsCompleted = 0;

      state.allCourses.forEach(c => {
        if (c.progress) {
          totalLessonsCompleted += (c.progress.completed_lessons || 0);
          if (c.progress.status === 'completed' || c.progress.progress_percent >= 100) {
            completedCoursesCount++;
          } else if (c.progress.status === 'in_progress' || (c.progress.completed_lessons || 0) > 0) {
            inProgressCount++;
          }
        }
      });

      if (els.crsStatTotal) els.crsStatTotal.textContent = state.allCourses.length;
      if (els.crsStatInProgress) els.crsStatInProgress.textContent = inProgressCount;
      if (els.crsStatCompleted) els.crsStatCompleted.textContent = completedCoursesCount;
      if (els.crsStatLessonsCompleted) els.crsStatLessonsCompleted.textContent = totalLessonsCompleted;

      renderCoursesGrid(state.allCourses, state.activeCourseDomainFilter);

    } catch (err) {
      console.error('Courses load error:', err);
      window.showToast('Could not load courses: ' + err.message, 'error');
    }
  }

  /**
   * Render Courses Grid
   */
  function renderCoursesGrid(courses, filterDomain) {
    if (!courses || courses.length === 0) {
      els.coursesListContainer.innerHTML = '<div class="empty-state-card"><p>No courses available at this time.</p></div>';
      return;
    }

    const filtered = filterDomain === 'ALL'
      ? courses
      : courses.filter(c => c.domain === filterDomain);

    if (filtered.length === 0) {
      els.coursesListContainer.innerHTML = `
        <div class="empty-state-card">
          <p>No courses found for domain: <strong>${filterDomain}</strong></p>
        </div>
      `;
      return;
    }

    let html = '<div class="recommendations-grid">';
    filtered.forEach(course => {
      const domainClass = getDomainClass(course.domain);
      const progress = course.progress || { progress_percent: 0, status: 'enrolled', completed_lessons: 0, total_lessons: course.total_lessons || 0 };
      const isComplete = (progress.status === 'completed' || progress.progress_percent >= 100);

      let statusBadge = '<span class="badge-pixel text-muted">ENROLLED</span>';
      if (isComplete) {
        statusBadge = '<span class="badge-pixel text-forest" style="background: var(--color-forest-light); border: 1px solid var(--color-forest);">✓ COMPLETED</span>';
      } else if (progress.status === 'in_progress' || progress.completed_lessons > 0) {
        statusBadge = '<span class="badge-pixel text-ochre" style="background: var(--color-ochre-light); border: 1px solid var(--color-ochre);">IN PROGRESS</span>';
      }

      let compPills = '';
      (course.competencies || []).forEach(comp => {
        compPills += `
          <span class="matched-comp-pill" style="font-size: 0.72rem;">
            ${comp.name} (+${comp.growth_impact_score} pts)
          </span>
        `;
      });

      html += `
        <div class="recommendation-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-xs); margin-bottom: 6px;">
              <span class="domain-badge ${domainClass}">${course.domain}</span>
              ${statusBadge}
            </div>

            <h3 style="font-size: 1.05rem; margin-bottom: 4px; color: var(--color-ink);">${course.title}</h3>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-muted); margin-bottom: var(--space-xs);">
              ${course.code} • ${course.duration_hours} Hours • ${(course.difficulty_level || 'INTERMEDIATE').toUpperCase()} • ${course.total_lessons} Lessons
            </div>

            <div class="badge-source" style="margin-bottom: var(--space-xs); display: inline-block;">
              ${course.source_display_name || course.source_label}
            </div>

            <p style="font-size: 0.85rem; color: var(--color-ink-light); margin-bottom: var(--space-sm); line-height: 1.45;">
              ${course.description || ''}
            </p>

            <div style="margin-bottom: var(--space-sm);">
              <div style="font-size: 0.76rem; font-weight: 700; color: var(--color-ink-muted); margin-bottom: 4px;">TARGETED COMPETENCIES:</div>
              <div style="display: flex; flex-wrap: wrap;">
                ${compPills}
              </div>
            </div>

            <div style="margin-bottom: var(--space-xs);">
              <div style="display: flex; justify-content: space-between; font-size: 0.76rem; font-weight: 700; color: var(--color-ink-muted); margin-bottom: 2px;">
                <span>PROGRESS</span>
                <span>${progress.completed_lessons} / ${progress.total_lessons} Lessons (${progress.progress_percent}%)</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${progress.progress_percent}%;"></div>
              </div>
            </div>
          </div>

          <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: var(--border-subtle); display: flex; justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" onclick="window.EmployeePortal.openCourse(${course.id})">
              ${isComplete ? 'Review Course →' : (progress.completed_lessons > 0 ? 'Continue Course →' : 'Start Course →')}
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    els.coursesListContainer.innerHTML = html;
  }

  /**
   * Load Course Detail View
   */
  async function loadCourseDetailView(courseId) {
    try {
      if (!els.viewCourseDetail) return;

      const res = await API.learning.getCourse(courseId);
      const course = res.course;
      const competencies = res.competencies || [];
      const lessons = res.lessons || [];
      const quizzes = res.quizzes || [];
      const progress = res.progress || { progress_percent: 0, status: 'enrolled', completed_lessons: 0, total_lessons: lessons.length };

      state.currentCourse = res;

      // Populate header & meta
      els.courseDetailTitle.textContent = course.title;
      els.courseDetailDomainBadge.textContent = course.domain.toUpperCase();
      els.courseDetailDomainBadge.className = `domain-badge ${getDomainClass(course.domain)}`;
      els.courseDetailSourceBadge.innerHTML = `<span class="badge-source">${course.source_display_name || course.source_label}</span>`;
      els.courseDetailMeta.textContent = `${course.code} • ${course.duration_hours} HOURS • ${(course.difficulty_level || 'INTERMEDIATE').toUpperCase()}`;
      els.courseDetailDescription.textContent = course.description || '';

      // Competencies
      let compHtml = '';
      competencies.forEach(c => {
        compHtml += `
          <span class="matched-comp-pill">
            <strong>${c.name}</strong> (${c.code}) • Score: ${c.current_score}% / Target: ${c.target_score}% (+${c.growth_impact_score} pts)
          </span>
        `;
      });
      els.courseDetailCompetenciesList.innerHTML = compHtml || '<span class="text-muted">No mapped competencies.</span>';

      // Progress bar
      els.courseDetailProgressLabel.textContent = `${progress.progress_percent}% (${progress.completed_lessons} / ${progress.total_lessons} Lessons Completed)`;
      els.courseDetailProgressBar.style.width = `${progress.progress_percent}%`;

      // Lessons list
      els.courseDetailLessonsCount.textContent = `${lessons.length} LESSONS`;
      let lessonsHtml = '';
      lessons.forEach((l, idx) => {
        const isCompleted = Boolean(l.is_completed);
        lessonsHtml += `
          <div class="curriculum-lesson-item ${isCompleted ? 'completed' : ''}">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div class="lesson-seq-badge">${l.sequence_order || (idx + 1)}</div>
              <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-ink);">
                  ${l.title}
                </div>
                <div style="font-size: 0.8rem; color: var(--color-ink-muted); margin-top: 2px;">
                  ${l.duration_minutes} Mins • ${l.content_summary || ''}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: var(--space-sm); flex-shrink: 0;">
              ${isCompleted ? `
                <span class="badge-pixel text-forest" style="background: var(--color-forest-light); padding: 3px 8px; border: 1px solid var(--color-forest);">
                  ✓ COMPLETED
                </span>
              ` : `
                <span class="badge-pixel text-muted" style="padding: 3px 8px;">
                  PENDING
                </span>
              `}
              <button class="btn btn-secondary btn-sm" onclick="window.EmployeePortal.openLesson(${l.id})">
                ${isCompleted ? 'Review Lesson' : 'Open Lesson →'}
              </button>
            </div>
          </div>
        `;
      });
      els.courseDetailLessonsList.innerHTML = lessonsHtml || '<p class="text-muted">No lessons available for this course.</p>';

      // Quiz card
      let quizHtml = '';
      if (quizzes.length > 0) {
        quizzes.forEach(q => {
          const hasPassed = Boolean(q.user_passed);
          const hasAttempt = (q.attempts_count || 0) > 0;

          quizHtml += `
            <div class="quiz-card-box">
              <div>
                <div style="display: flex; align-items: center; gap: var(--space-xs); margin-bottom: 4px;">
                  <h3 style="font-size: 1.05rem; margin-bottom: 0;">${q.title}</h3>
                  ${hasPassed ? '<span class="quiz-badge-passed">✓ PASSED</span>' : (hasAttempt ? '<span class="quiz-badge-pending">ATTEMPTED</span>' : '<span class="badge-pixel text-muted">NOT ATTEMPTED</span>')}
                </div>
                <div style="font-size: 0.82rem; color: var(--color-ink-muted);">
                  Pass Benchmark: ${q.pass_percentage}% • ${q.total_questions} Questions ${hasAttempt ? `• Best Score: ${q.user_best_score}% (${q.attempts_count} Attempts)` : ''}
                </div>
                <p style="font-size: 0.85rem; color: var(--color-ink-light); margin-top: var(--space-xs); margin-bottom: 0;">
                  ${q.description || 'Test your understanding of the concepts covered in this course.'}
                </p>
              </div>
              <button class="btn btn-primary btn-sm" onclick="window.EmployeePortal.openQuiz(${q.id})">
                ${hasPassed ? 'Retake Quiz →' : 'Take Knowledge Quiz →'}
              </button>
            </div>
          `;
        });
      } else {
        quizHtml = '<p class="text-muted">No quiz currently associated with this course.</p>';
      }
      els.courseDetailQuizContainer.innerHTML = quizHtml;

    } catch (err) {
      console.error('Course detail load error:', err);
      window.showToast('Could not load course details: ' + err.message, 'error');
    }
  }

  /**
   * Load Lesson Detail View (Interactive Reader)
   */
  async function loadLessonDetailView(lessonId) {
    try {
      if (!els.viewLessonDetail) return;

      const res = await API.learning.getLesson(lessonId);
      const lesson = res.lesson;
      const course = res.course;
      const materials = res.materials || [];
      const nav = res.navigation || {};

      state.currentLesson = res;

      // Header info
      els.lessonHeaderBreadcrumb.textContent = `${course.title} / Lesson ${nav.current_index || lesson.sequence_order} of ${nav.total_lessons || 1}`;
      els.lessonDetailTitle.textContent = lesson.title;
      els.lessonDetailMeta.textContent = `Lesson ${lesson.sequence_order} • ${lesson.duration_minutes} Minutes Duration • ${course.code}`;

      if (lesson.is_completed) {
        els.lessonDetailStatusBadge.innerHTML = `<span class="badge-pixel text-forest" style="background: var(--color-forest-light); padding: 4px 10px; border: 1px solid var(--color-forest);">✓ COMPLETED</span>`;
        els.lessonCompletionStatusText.textContent = '✓ Lesson Completed';
        els.lessonCompletionStatusText.style.color = 'var(--color-forest)';
        els.lessonCompletionStatusDesc.textContent = `Completed on ${new Date(lesson.completed_at || Date.now()).toLocaleDateString()}. Your progress is permanently saved.`;
        els.btnMarkLessonComplete.textContent = '✓ LESSON ALREADY COMPLETED';
        els.btnMarkLessonComplete.className = 'btn btn-secondary btn-lg';
      } else {
        els.lessonDetailStatusBadge.innerHTML = `<span class="badge-pixel text-ochre" style="background: var(--color-ochre-light); padding: 4px 10px; border: 1px solid var(--color-ochre);">IN PROGRESS</span>`;
        els.lessonCompletionStatusText.textContent = 'Lesson Progress: Pending Completion';
        els.lessonCompletionStatusText.style.color = 'var(--color-ink)';
        els.lessonCompletionStatusDesc.textContent = 'Click to record completion in your official training record.';
        els.btnMarkLessonComplete.textContent = '✓ MARK LESSON AS COMPLETED';
        els.btnMarkLessonComplete.className = 'btn btn-primary btn-lg';
      }

      // Detailed Lesson Body
      renderLessonContent(lesson, course);

      // Attached Materials
      if (materials.length > 0) {
        let matHtml = '';
        materials.forEach(m => {
          let icon = '📄';
          if (m.material_type === 'dataset') icon = '📊';
          else if (m.material_type === 'reference_manual') icon = '📚';
          else if (m.material_type === 'guideline') icon = '🛡️';

          matHtml += `
            <div class="material-chip">
              <span class="material-chip-icon">${icon}</span>
              <div>
                <strong>${m.title}</strong>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-ink-muted);">
                  ${(m.material_type || 'DOCUMENT').toUpperCase()} • Ref: ${m.file_url_or_ref || 'Internal Library'}
                </div>
              </div>
            </div>
          `;
        });
        els.lessonMaterialsList.innerHTML = matHtml;
        document.getElementById('lesson-materials-section').style.display = 'block';
      } else {
        document.getElementById('lesson-materials-section').style.display = 'none';
      }

      // Prev / Next Navigation buttons
      if (nav.prev_lesson_id) {
        els.btnLessonPrev.style.display = 'inline-flex';
        els.btnLessonPrev.onclick = () => loadLessonDetailView(nav.prev_lesson_id);
      } else {
        els.btnLessonPrev.style.display = 'none';
      }

      if (nav.next_lesson_id) {
        els.btnLessonNext.style.display = 'inline-flex';
        els.btnLessonNext.textContent = 'Next Lesson →';
        els.btnLessonNext.onclick = () => loadLessonDetailView(nav.next_lesson_id);
      } else {
        els.btnLessonNext.style.display = 'inline-flex';
        els.btnLessonNext.textContent = 'Return to Course Summary →';
        els.btnLessonNext.onclick = () => loadCourseDetailView(lesson.course_id);
      }

    } catch (err) {
      console.error('Lesson detail load error:', err);
      window.showToast('Could not load lesson: ' + err.message, 'error');
    }
  }

  /**
   * Render structured lesson content
   */
  function renderLessonContent(lesson, course) {
    let contentHtml = `
      <div class="lesson-section-title">1. Operational Overview & Learning Objectives</div>
      <p style="margin-bottom: var(--space-sm);">
        ${lesson.content_summary}
      </p>
      <p>
        In accordance with official statistical standards maintained by the Ministry of Statistics and Programme Implementation (MoSPI) and training frameworks established under NSSTA, this module emphasizes rigorous applied methodologies, systematic field validation, and reproducible statistical computation.
      </p>

      <div class="lesson-key-takeaways">
        <strong>📌 Key Methodological Takeaways:</strong>
        <ul>
          <li>Structured adherence to national standard taxonomies and quality frameworks.</li>
          <li>Systematic error detection protocols and outlier mitigation mechanisms.</li>
          <li>Data confidentiality safeguards compliant with the Digital Personal Data Protection Act.</li>
        </ul>
      </div>

      <div class="lesson-section-title">2. Methodological Standards & Practical Protocols</div>
      <p style="margin-bottom: var(--space-sm);">
        When implementing the techniques outlined in <em>${lesson.title}</em>, statistical officers should ensure that all sampling frames, intermediate aggregation matrices, and microdata registries maintain full audit traceability.
      </p>
      <p>
        Refer to the attached reference manuals and sample datasets below for comprehensive formulas, data dictionary definitions, and practical scripts.
      </p>
    `;

    els.lessonContentBody.innerHTML = contentHtml;
  }

  /**
   * Load Quizzes List View
   */
  async function loadQuizzesListView() {
    try {
      if (!els.quizzesGridContainer) return;
      els.quizzesGridContainer.innerHTML = '<div style="text-align:center; padding: var(--space-xl); color: var(--color-ink-muted);">Loading knowledge quizzes...</div>';

      const res = await API.learning.getQuizzes();
      const quizzes = res.quizzes || [];

      if (quizzes.length === 0) {
        els.quizzesGridContainer.innerHTML = '<div class="empty-state-card"><p>No quizzes currently available.</p></div>';
        return;
      }

      let html = '';
      quizzes.forEach(q => {
        const hasPassed = Boolean(q.has_passed);
        const hasAttempt = (q.total_attempts || 0) > 0;

        html += `
          <div class="recommendation-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-xs); margin-bottom: 6px;">
                <span class="domain-badge ${getDomainClass(q.course_domain || 'Statistical')}">${q.course_domain || 'Statistical'}</span>
                ${hasPassed ? '<span class="quiz-badge-passed">✓ PASSED</span>' : (hasAttempt ? '<span class="quiz-badge-pending">ATTEMPTED</span>' : '<span class="badge-pixel text-muted">PENDING</span>')}
              </div>

              <h3 style="font-size: 1.05rem; margin-bottom: 4px; color: var(--color-ink);">${q.title}</h3>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-muted); margin-bottom: var(--space-xs);">
                Course: ${q.course_title || q.course_code || 'Official Course'} • ${q.total_questions} Questions • Pass: ${q.pass_percentage}%
              </div>

              <p style="font-size: 0.85rem; color: var(--color-ink-light); margin-bottom: var(--space-sm); line-height: 1.45;">
                ${q.description || 'Knowledge check verification for statistical officers.'}
              </p>

              ${hasAttempt ? `
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-ink); background: var(--color-paper-light); padding: 4px 8px; border: var(--border-subtle); margin-bottom: var(--space-xs);">
                  Best Score: <strong>${q.best_score}%</strong> • Total Attempts: ${q.total_attempts}
                </div>
              ` : ''}
            </div>

            <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: var(--border-subtle); display: flex; justify-content: flex-end;">
              <button class="btn btn-primary btn-sm" onclick="window.EmployeePortal.openQuiz(${q.id})">
                ${hasPassed ? 'Retake Quiz →' : 'Take Quiz →'}
              </button>
            </div>
          </div>
        `;
      });

      els.quizzesGridContainer.innerHTML = html;

    } catch (err) {
      console.error('Quizzes list error:', err);
      window.showToast('Could not load quizzes: ' + err.message, 'error');
    }
  }

  /**
   * Load Quiz Detail View (Take Quiz)
   */
  async function loadQuizDetailView(quizId) {
    try {
      if (!els.viewQuizDetail) return;

      const res = await API.learning.getQuiz(quizId);
      const quiz = res.quiz;
      const questions = res.questions || [];

      state.currentQuiz = quiz;
      state.quizAnswers = {};

      els.quizDetailTitle.textContent = quiz.title;
      els.quizPassMarkBadge.textContent = `PASS MARK: ${quiz.pass_percentage}%`;
      els.quizDetailDescription.textContent = quiz.description || 'Answer all questions. Results and question explanations are evaluated and generated server-side.';

      renderQuizQuestions(questions);
      updateQuizProgress(questions.length);

    } catch (err) {
      console.error('Quiz detail load error:', err);
      window.showToast('Could not load quiz: ' + err.message, 'error');
    }
  }

  /**
   * Render Quiz Questions Form
   */
  function renderQuizQuestions(questions) {
    els.quizQuestionsContainer.innerHTML = '';

    questions.forEach((q, idx) => {
      const qBox = document.createElement('div');
      qBox.className = 'question-box';
      qBox.id = `qz-box-${q.id}`;

      let optionsHtml = '';
      (q.options || []).forEach((optText, optIdx) => {
        optionsHtml += `
          <label class="option-item" id="qz-opt-label-${q.id}-${optIdx}">
            <input type="radio" name="qz_${q.id}" value="${optIdx}" class="qz-option-radio" data-qid="${q.id}">
            <span>${optText}</span>
          </label>
        `;
      });

      qBox.innerHTML = `
        <div class="question-meta">
          <span class="question-number">QUESTION ${idx + 1} OF ${questions.length}</span>
        </div>
        <div class="question-text">${q.question_text}</div>
        <div class="options-list">
          ${optionsHtml}
        </div>
      `;

      els.quizQuestionsContainer.appendChild(qBox);
    });

    const radios = els.quizQuestionsContainer.querySelectorAll('.qz-option-radio');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qid = e.target.dataset.qid;
        const optVal = Number(e.target.value);
        state.quizAnswers[qid] = optVal;

        const labels = document.querySelectorAll(`[id^="qz-opt-label-${qid}-"]`);
        labels.forEach(l => l.classList.remove('selected'));
        const activeLabel = document.getElementById(`qz-opt-label-${qid}-${optVal}`);
        if (activeLabel) activeLabel.classList.add('selected');

        updateQuizProgress(questions.length);
      });
    });
  }

  function updateQuizProgress(totalQuestions) {
    const answeredCount = Object.keys(state.quizAnswers).length;
    const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    els.quizProgressText.textContent = `${answeredCount} / ${totalQuestions} Questions Answered (${pct}%)`;
    els.quizProgressBar.style.width = `${pct}%`;
  }

  /**
   * Load Quiz Result & Review View
   */
  function loadQuizResultView(result) {
    if (!els.viewQuizResult || !result) return;

    const isPassed = Boolean(result.passed);
    els.quizResultTitle.textContent = `${result.quiz_title || 'Quiz'} — Result`;
    
    if (isPassed) {
      els.quizResultPassBadge.textContent = '✓ PASSED';
      els.quizResultPassBadge.className = 'badge-pixel text-forest';
      els.quizResultPassBadge.style.background = 'var(--color-forest-light)';
      els.quizResultPassBadge.style.border = '1px solid var(--color-forest)';
    } else {
      els.quizResultPassBadge.textContent = '✕ DID NOT PASS';
      els.quizResultPassBadge.className = 'badge-pixel text-danger';
      els.quizResultPassBadge.style.background = 'var(--color-danger-light)';
      els.quizResultPassBadge.style.border = '1px solid var(--color-danger)';
    }

    els.quizResStatScore.textContent = `${result.score}%`;
    els.quizResStatScore.style.color = isPassed ? 'var(--color-forest)' : 'var(--color-danger)';
    els.quizResStatPassDesc.textContent = `Pass Mark: ${result.pass_percentage}%`;
    els.quizResStatCorrect.textContent = `${result.total_correct} / ${result.total_questions}`;

    // Render question-by-question review
    let reviewHtml = '';
    (result.question_review || []).forEach((r, idx) => {
      reviewHtml += `
        <div class="question-box" style="border-left: 4px solid ${r.is_correct ? 'var(--color-forest)' : 'var(--color-danger)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="question-number">QUESTION ${idx + 1}</span>
            <span class="badge-pixel ${r.is_correct ? 'text-forest' : 'text-danger'}">
              ${r.is_correct ? '✓ CORRECT' : '✕ INCORRECT'}
            </span>
          </div>
          <div class="question-text" style="font-size: 0.95rem;">${r.question_text}</div>
          
          <div style="margin-top: var(--space-xs); font-size: 0.86rem;">
            <div style="margin-bottom: 2px;">
              <strong>Your Selection:</strong> <span style="color: ${r.is_correct ? 'var(--color-forest)' : 'var(--color-danger)'};">${r.submitted_option_text}</span>
            </div>
            ${!r.is_correct ? `
              <div style="margin-bottom: 2px;">
                <strong>Correct Key:</strong> <span style="color: var(--color-forest); font-weight: 700;">${r.correct_option_text}</span>
              </div>
            ` : ''}
            <div style="margin-top: 6px; padding: var(--space-xs); background: var(--color-paper-light); border: var(--border-subtle); font-size: 0.82rem;">
              <strong>Explanation:</strong> ${r.explanation || 'No explanation provided.'}
            </div>
          </div>
        </div>
      `;
    });

    els.quizReviewContainer.innerHTML = reviewHtml || '<p class="text-muted">No review items available.</p>';
  }

  /**
   * Event Listeners Setup
   */
  function initEventListeners() {
    // Brand link click
    document.getElementById('brand-link').addEventListener('click', (e) => {
      e.preventDefault();
      if (state.currentUser) {
        if (state.currentUser.role === 'admin') {
          switchView('admin-dashboard');
        } else {
          switchView('dashboard');
        }
      }
    });

    // Login Form Submit
    els.formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = els.inputIdentifier.value.trim();
      const password = els.inputPassword.value;

      try {
        const res = await API.auth.login(identifier, password);
        state.currentUser = res.user;
        updateUserHeader(res.user);
        renderNavTabs(res.user);

        window.showToast(`Welcome, ${res.user.full_name}!`, 'success');

        if (res.user.role === 'admin') {
          switchView('admin-dashboard');
        } else {
          switchView('dashboard');
        }
      } catch (err) {
        console.error('Login error:', err);
        window.showToast(err.message || 'Login failed', 'error');
      }
    });

    // Quick Login Demo Buttons
    els.btnFillEmp1.addEventListener('click', () => {
      els.inputIdentifier.value = 'emp.sharma';
      els.inputPassword.value = 'Password123!';
    });

    els.btnFillEmp2.addEventListener('click', () => {
      els.inputIdentifier.value = 'emp.verma';
      els.inputPassword.value = 'Password123!';
    });

    els.btnFillAdmin.addEventListener('click', () => {
      els.inputIdentifier.value = 'admin.navbodh';
      els.inputPassword.value = 'AdminPass123!';
    });

    // Logout Button
    els.btnLogout.addEventListener('click', async () => {
      try {
        await API.auth.logout();
        state.currentUser = null;
        window.showToast('Logged out successfully.', 'info');
        switchView('login');
      } catch (err) {
        console.error('Logout error:', err);
        switchView('login');
      }
    });

    // Dashboard Actions
    els.btnDashTakeAssessment.addEventListener('click', () => {
      switchView('assessment');
    });

    els.btnDashViewProfile.addEventListener('click', () => {
      switchView('profile');
    });

    els.btnDashViewFullResult.addEventListener('click', () => {
      switchView('result');
    });

    // Profile Form Actions
    els.btnCancelProfile.addEventListener('click', () => {
      switchView('dashboard');
    });

    els.formProfileEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: els.profFullName.value.trim(),
        designation: els.profDesignation.value.trim(),
        department_id: Number(els.profDepartment.value),
        cadre: els.profCadre.value.trim(),
        phone: els.profPhone.value.trim(),
        bio: els.profBio.value.trim()
      };

      try {
        const res = await API.updateProfile(payload);
        state.currentUser = res.user;
        updateUserHeader(res.user);
        window.showToast('Profile updated successfully!', 'success');
        switchView('dashboard');
      } catch (err) {
        console.error('Profile update error:', err);
        window.showToast(err.message || 'Could not update profile', 'error');
      }
    });

    // Assessment Actions
    els.btnCancelAssessment.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel? Your unsubmitted answers will be lost.')) {
        switchView('dashboard');
      }
    });

    els.formAssessment.addEventListener('submit', async (e) => {
      e.preventDefault();
      const totalQ = (state.currentAssessment && state.currentAssessment.total_questions) || 17;
      const answeredCount = Object.keys(state.assessmentAnswers).length;

      if (answeredCount < totalQ) {
        const confirmSubmit = confirm(`You have answered ${answeredCount} of ${totalQ} questions. Unanswered questions will receive 0 score. Do you want to proceed?`);
        if (!confirmSubmit) return;
      }

      try {
        window.showToast('Evaluating assessment and calculating baseline...', 'info');
        const res = await API.submitAssessment(state.currentAssessment.id, state.assessmentAnswers);
        
        if (res.is_baseline) {
          window.showToast('Initial Baseline established successfully!', 'success');
        } else {
          window.showToast('Assessment submitted! Current competency scores updated.', 'success');
        }

        switchView('result');
      } catch (err) {
        console.error('Assessment submit error:', err);
        window.showToast(err.message || 'Could not submit assessment', 'error');
      }
    });

    // Result Actions
    els.btnResultToDashboard.addEventListener('click', () => {
      switchView('dashboard');
    });

    els.btnRetakeAssessment.addEventListener('click', () => {
      switchView('assessment');
    });

    els.btnToggleReview.addEventListener('click', () => {
      const cont = els.resultReviewContainer;
      if (cont.style.display === 'none' || !cont.style.display) {
        cont.style.display = 'block';
        els.btnToggleReview.textContent = 'Hide Review';
      } else {
        cont.style.display = 'none';
        els.btnToggleReview.textContent = 'Toggle Answers & Explanations';
      }
    });

    // Stage 2: Skill Gaps Filters & Actions
    if (els.gapsDomainFilters) {
      els.gapsDomainFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-filter');
        if (!btn) return;
        const dom = btn.dataset.domain;
        currentActiveDomainFilter = dom;

        els.gapsDomainFilters.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (currentGapsData && currentGapsData.allCompetencies) {
          renderSkillGapsList(currentGapsData.allCompetencies, dom);
        }
      });
    }

    if (els.btnGapsToRecommendations) {
      els.btnGapsToRecommendations.addEventListener('click', () => {
        switchView('recommendations');
      });
    }

    if (els.btnGapsToRoadmap) {
      els.btnGapsToRoadmap.addEventListener('click', () => {
        switchView('roadmap');
      });
    }

    // Stage 2: Recommendations Actions
    if (els.btnRecsToRoadmap) {
      els.btnRecsToRoadmap.addEventListener('click', () => {
        switchView('roadmap');
      });
    }

    if (els.btnRecsToGaps) {
      els.btnRecsToGaps.addEventListener('click', () => {
        switchView('skill-gaps');
      });
    }

    // Stage 2: Roadmap Actions
    if (els.btnRoadmapToAssistant) {
      els.btnRoadmapToAssistant.addEventListener('click', () => {
        switchView('assistant');
      });
    }

    if (els.btnRoadmapToRecs) {
      els.btnRoadmapToRecs.addEventListener('click', () => {
        switchView('learning');
      });
    }

    // Stage 2: Study Assistant Actions
    if (els.formStudyAssistant) {
      els.formStudyAssistant.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = els.inputAssistantQuery.value.trim();
        if (text) {
          sendAssistantQuery(text);
        }
      });
    }

    // Quick Prompt Chips
    document.querySelectorAll('.quick-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        if (query) {
          sendAssistantQuery(query);
        }
      });
    });

    // Stage 3: Courses Domain Filters
    if (els.coursesDomainFilters) {
      els.coursesDomainFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-filter');
        if (!btn) return;
        const dom = btn.dataset.domain;
        state.activeCourseDomainFilter = dom;

        els.coursesDomainFilters.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderCoursesGrid(state.allCourses, dom);
      });
    }

    // Stage 3: Back to Courses Button
    if (els.btnBackToCourses) {
      els.btnBackToCourses.addEventListener('click', () => {
        switchView('learning');
      });
    }

    // Stage 3: Back to Course from Lesson
    if (els.btnLessonBackToCourse) {
      els.btnLessonBackToCourse.addEventListener('click', () => {
        if (state.currentLesson && state.currentLesson.lesson) {
          switchView('course-detail', { courseId: state.currentLesson.lesson.course_id });
        } else {
          switchView('learning');
        }
      });
    }

    // Stage 3: Mark Lesson Completed Button
    if (els.btnMarkLessonComplete) {
      els.btnMarkLessonComplete.addEventListener('click', async () => {
        if (!state.currentLesson || !state.currentLesson.lesson) return;
        const lessonId = state.currentLesson.lesson.id;

        try {
          const res = await API.learning.completeLesson(lessonId);
          window.showToast('Lesson marked as completed! Course progress updated.', 'success');
          // Reload lesson view to reflect persistent updated state
          loadLessonDetailView(lessonId);
        } catch (err) {
          console.error('Lesson completion error:', err);
          window.showToast('Could not record lesson completion: ' + err.message, 'error');
        }
      });
    }

    // Stage 3: Cancel Quiz Button
    if (els.btnQuizCancel || els.btnCancelQuizForm) {
      const cancelHandler = () => {
        if (state.currentQuiz && state.currentQuiz.course_id) {
          switchView('course-detail', { courseId: state.currentQuiz.course_id });
        } else {
          switchView('quizzes');
        }
      };
      if (els.btnQuizCancel) els.btnQuizCancel.addEventListener('click', cancelHandler);
      if (els.btnCancelQuizForm) els.btnCancelQuizForm.addEventListener('click', cancelHandler);
    }

    // Stage 3: Quiz Form Submit (Server-side scoring)
    if (els.formQuiz) {
      els.formQuiz.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.currentQuiz) return;

        const totalQ = state.currentQuiz.total_questions || 3;
        const answeredCount = Object.keys(state.quizAnswers).length;

        if (answeredCount < totalQ) {
          const confirmSubmit = confirm(`You have answered ${answeredCount} of ${totalQ} questions. Unanswered questions will receive 0 score. Do you want to submit?`);
          if (!confirmSubmit) return;
        }

        try {
          window.showToast('Evaluating quiz answers on server...', 'info');
          const res = await API.learning.submitQuiz(state.currentQuiz.id, state.quizAnswers);

          if (res.passed) {
            window.showToast(`Congratulations! You passed with ${res.score}%!`, 'success');
          } else {
            window.showToast(`Quiz completed with ${res.score}%. Pass benchmark is ${res.pass_percentage}%.`, 'info');
          }

          switchView('quiz-result', { result: res });
        } catch (err) {
          console.error('Quiz submit error:', err);
          window.showToast('Could not submit quiz: ' + err.message, 'error');
        }
      });
    }

    // Stage 3: Quiz Result Actions
    if (els.btnQuizResToCourse) {
      els.btnQuizResToCourse.addEventListener('click', () => {
        if (state.currentQuiz && state.currentQuiz.course_id) {
          switchView('course-detail', { courseId: state.currentQuiz.course_id });
        } else {
          switchView('learning');
        }
      });
    }

    if (els.btnQuizResRetake) {
      els.btnQuizResRetake.addEventListener('click', () => {
        if (state.currentQuiz && state.currentQuiz.id) {
          switchView('quiz-detail', { quizId: state.currentQuiz.id });
        }
      });
    }

    if (els.btnQuizResToCatalog) {
      els.btnQuizResToCatalog.addEventListener('click', () => {
        switchView('learning');
      });
    }
  }

  /**
   * Check Existing Session on Load
   */
  async function checkInitialSession() {
    try {
      const res = await API.auth.me();
      if (res && res.user) {
        state.currentUser = res.user;
        updateUserHeader(res.user);
        renderNavTabs(res.user);

        if (res.user.role === 'admin') {
          switchView('admin-dashboard');
        } else {
          switchView('dashboard');
        }
      } else {
        switchView('login');
      }
    } catch (err) {
      switchView('login');
    }
  }

  // Public Interface for Employee Portal
  window.EmployeePortal = {
    init() {
      initEventListeners();
      checkInitialSession();
    },
    goToAssessment() {
      switchView('assessment');
    },
    openCourse(courseId) {
      switchView('course-detail', { courseId });
    },
    openLesson(lessonId) {
      switchView('lesson-detail', { lessonId });
    },
    openQuiz(quizId) {
      switchView('quiz-detail', { quizId });
    },
    switchView
  };

  // Bootstrap when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.EmployeePortal.init();
  });
})();
