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
        { id: 'profile', label: 'Profile', future: false },
        { id: 'assessment', label: 'Assessment', future: false },
        { id: 'result', label: 'Assessment Result', future: false },
        { id: 'skill-gaps', label: 'Skill Gaps', future: true, stage: 'Stage 2', owner: 'Rucha', desc: 'Automated skill-gap identification and prioritized competency deficiency scoring.' },
        { id: 'learning', label: 'Learning', future: true, stage: 'Stage 3', owner: 'Pathika', desc: 'Interactive lessons, micro-modules, and self-paced statistical coursework.' },
        { id: 'roadmap', label: 'Roadmap', future: true, stage: 'Stage 2', owner: 'Rucha', desc: 'Personalized step-by-step career and competency growth learning path.' },
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
  async function loadAssessmentResultView() {
    try {
      const res = await API.getAssessmentResult();
      if (!res.has_result) {
        els.resStatAttempt.textContent = 'No Attempts';
        els.resStatAttemptDesc.textContent = 'No assessment taken yet.';
        els.resStatOverall.textContent = '--';
        els.resStatCorrectCount.textContent = '--';
        els.resultCompetenciesGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-xl); color: var(--color-ink-muted);">
            No assessment results available. Please take the initial assessment first.
          </div>
        `;
        return;
      }

      els.resultBadgeType.textContent = res.is_baseline ? 'INITIAL BASELINE ESTABLISHED' : 'SUBSEQUENT ATTEMPT (CURRENT UPDATED)';
      els.resStatAttempt.textContent = `Attempt #${res.attempt_number}`;
      els.resStatAttemptDesc.textContent = res.is_baseline ? 'Permanent Baseline Record' : 'Current Scores Updated';
      els.resStatOverall.textContent = `${res.overall_score}%`;
      
      const correctCount = (res.question_review || []).filter(q => q.is_correct).length;
      els.resStatCorrectCount.textContent = `${correctCount} of ${(res.question_review || []).length} Correct`;

      // Render Competencies Grid
      renderResultCompetencies(res.competencies);

      // Render Review List
      renderQuestionReview(res.question_review);

    } catch (err) {
      console.error('Result load error:', err);
      window.showToast('Could not load assessment result: ' + err.message, 'error');
    }
  }

  /**
   * Render Result Competencies Grid
   */
  function renderResultCompetencies(competencies) {
    if (!competencies || competencies.length === 0) {
      els.resultCompetenciesGrid.innerHTML = '<p>No competency data.</p>';
      return;
    }

    let html = '';
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
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-muted);">${c.code}</span>
            </div>
            <div class="competency-title">${c.name}</div>
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

            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${Math.min(currentVal, 100)}%;"></div>
            </div>
          </div>
        </div>
      `;
    });

    els.resultCompetenciesGrid.innerHTML = html;
  }

  /**
   * Render Question Review Accordion
   */
  function renderQuestionReview(reviewList) {
    if (!reviewList || reviewList.length === 0) {
      els.resultReviewContainer.innerHTML = '<p class="text-muted">Review details unavailable.</p>';
      return;
    }

    let html = '';
    reviewList.forEach((q, idx) => {
      const isCorrect = q.is_correct;
      const domainClass = getDomainClass(q.domain);

      html += `
        <div class="question-box" style="border-left: 5px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'};">
          <div class="question-meta">
            <span class="question-number">QUESTION ${idx + 1}</span>
            <div>
              <span class="domain-badge ${domainClass}">${q.domain}</span>
              <span class="badge-pixel ${isCorrect ? 'text-success' : 'text-danger'}" style="margin-left: 8px;">
                ${isCorrect ? '✓ CORRECT (+100)' : '✕ INCORRECT (0)'}
              </span>
            </div>
          </div>
          <div class="question-text">${q.question_text}</div>

          <div style="font-size: 0.88rem; margin: var(--space-xs) 0;">
            <div><strong>Your Answer:</strong> <span style="color: ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}; font-weight: 600;">${q.submitted_option_text}</span></div>
            ${!isCorrect ? `<div><strong>Correct Answer:</strong> <span style="color: var(--color-success); font-weight: 600;">${q.correct_option_text}</span></div>` : ''}
          </div>

          <div class="explanation-box">
            <strong>Statistical Insight:</strong> ${q.explanation || 'No explanation provided.'}
          </div>
        </div>
      `;
    });

    els.resultReviewContainer.innerHTML = html;
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
