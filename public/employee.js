/**
 * NAVBODH - Employee Portal Logic & SPA View Controller
 * 
 * Handles authentication state, employee dashboard, profile editing,
 * competency assessment taking, and assessment results display.
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
    activeTab: 'dashboard'
  };

  // DOM Elements
  const els = {
    headerAuthControls: document.getElementById('header-auth-controls'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserRole: document.getElementById('header-user-role'),
    btnLogout: document.getElementById('btn-logout'),
    appNavBar: document.getElementById('app-nav-bar'),
    navTabsContainer: document.getElementById('nav-tabs-container'),
    
    // Views
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
        { id: 'assistant', label: 'Study Assistant', future: false },
        { id: 'assessment', label: 'Assessment', future: false },
        { id: 'result', label: 'Results', future: false },
        { id: 'profile', label: 'Profile', future: false },
        { id: 'learning', label: 'Learning', future: true, stage: 'Stage 3', owner: 'Pathika', desc: 'Interactive lessons, micro-modules, and self-paced statistical coursework.' },
        { id: 'quizzes', label: 'Quizzes', future: true, stage: 'Stage 3', owner: 'Pathika', desc: 'Competency post-tests and lesson verification knowledge checks.' },
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
      // Load departments if not loaded
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

    // Attach click listeners for radio change
    const radios = els.questionsListContainer.querySelectorAll('.option-radio');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qid = e.target.dataset.qid;
        const optVal = Number(e.target.value);
        state.assessmentAnswers[qid] = optVal;

        // Update selected class on labels
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
  /**
   * ==========================================================================
   * STAGE 2: INTELLIGENCE UI LOADERS & RENDERERS
   * ==========================================================================
   */

  let currentGapsData = null;
  let currentActiveDomainFilter = 'ALL';

  /**
   * Load Skill Gaps View
   */
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

  /**
   * Render Skill Gaps Cards / Table
   */
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

  /**
   * Load Recommendations View
   */
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

  /**
   * Render Recommendations Grid
   */
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
              ${course.courseCode} • ${course.durationHours} Hours • ${course.difficultyLevel.toUpperCase()}
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

          <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.78rem; color: var(--color-ink-muted); font-family: var(--font-mono);">
              Relevance: ${course.rankingScore}
            </span>
            <button class="btn btn-primary btn-sm" onclick="window.EmployeePortal.switchView('roadmap')">
              View in Roadmap →
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    els.recommendationsContainer.innerHTML = html;
  }

  /**
   * Load Roadmap View
   */
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

  /**
   * Render Roadmap Phases & Milestones
   */
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
            coursesHtml += `
              <div class="milestone-course-chip">
                <div>
                  <strong>${crs.title}</strong>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-ink-muted); margin-left: 6px;">(${crs.sourceDisplayName || crs.source} • ${crs.durationHours} hrs)</span>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.EmployeePortal.switchView('recommendations')">
                  Explore Course
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

  /**
   * Load Study Assistant View
   */
  async function loadAssistantView() {
    try {
      if (state.currentUser) {
        if (els.astOfficerName) els.astOfficerName.textContent = state.currentUser.full_name;
        if (els.astOfficerDept) els.astOfficerDept.textContent = state.currentUser.department_name || 'MoSPI Division';
      }

      // Initial welcome message if thread is empty
      if (els.chatThreadContainer && els.chatThreadContainer.children.length === 0) {
        const initialMsg = `Hello ${state.currentUser ? state.currentUser.full_name : 'Officer'}. I am your NAVBODH Explainable Study Assistant.\n\nI can analyze your official statistical competency scores, break down your skill gaps, and guide your learning sequence.\n\nTry clicking any of the quick inquiries above or type a question below!`;
        appendAssistantMessage(initialMsg, 'NAVBODH Rule-Based Intelligence Engine (Demo)');
      }
    } catch (err) {
      console.error('Assistant view error:', err);
    }
  }

  /**
   * Append User Message to Chat Thread
   */
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

  /**
   * Append Assistant Message to Chat Thread
   */
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

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Helper: Lightweight Markdown format for assistant output
   */
  function formatAssistantMarkdown(text) {
    let safe = escapeHtml(text);
    // Bold
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    safe = safe.replace(/• (.*?)(?=\n|$)/g, '• $1');
    return safe;
  }

  /**
   * Send Query to Study Assistant Endpoint
   */
  async function sendAssistantQuery(query) {
    if (!query || !query.trim()) return;

    appendUserMessage(query.trim());
    els.inputAssistantQuery.value = '';

    // Temporary loading indicator
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
        switchView('recommendations');
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
      // Unauthenticated, show login view
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
    switchView
  };

  // Bootstrap when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.EmployeePortal.init();
  });
})();
