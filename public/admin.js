/**
 * NAVBODH - Enterprise Admin Portal Controller (Stage 5: Owner Palak)
 *
 * Provides:
 *  - High-level workforce analytics & KPI dashboard
 *  - Officer-level competency inventory & learning profile inspection
 *  - Learning content & curriculum ecosystem oversight
 *  - Real-time system integration & adapter status monitoring
 */

(function () {
  'use strict';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // Admin State
  const adminState = {
    overviewData: null,
    employeesData: [],
    contentData: null,
    integrationsData: null,
    activeSourceFilter: 'ALL',
    selectedDepartmentId: '',
    searchKeyword: ''
  };

  // DOM Elements
  const els = {
    // Overview elements
    admStatUsers: document.getElementById('adm-stat-users'),
    admStatUserBreakdown: document.getElementById('adm-stat-user-breakdown'),
    admStatActiveLearners: document.getElementById('adm-stat-active-learners'),
    admStatDepts: document.getElementById('adm-stat-depts'),
    admStatComps: document.getElementById('adm-stat-comps'),
    admStatAttempts: document.getElementById('adm-stat-attempts'),
    admStatAvgScore: document.getElementById('adm-stat-avg-score'),
    admStatCourses: document.getElementById('adm-stat-courses'),
    admStatLessons: document.getElementById('adm-stat-lessons'),
    admStatPoints: document.getElementById('adm-stat-points'),
    admStatAchievements: document.getElementById('adm-stat-achievements'),
    admStatIntegrations: document.getElementById('adm-stat-integrations'),
    admDomainCardsContainer: document.getElementById('adm-domain-cards-container'),
    admTopGapsContainer: document.getElementById('adm-top-gaps-container'),
    admTableDepartmentsBody: document.getElementById('adm-table-departments-body'),
    admTableRecentBody: document.getElementById('adm-table-recent-body'),

    // Employee Roster elements
    admEmpCountBadge: document.getElementById('adm-emp-count-badge'),
    admEmpSearchInput: document.getElementById('adm-emp-search-input'),
    admEmpDeptFilter: document.getElementById('adm-emp-dept-filter'),
    admEmpBtnResetFilters: document.getElementById('adm-emp-btn-reset-filters'),
    admTableEmployeesBody: document.getElementById('adm-table-employees-body'),
    admOfficerModal: document.getElementById('adm-officer-modal'),
    admModalOfficerName: document.getElementById('adm-modal-officer-name'),
    admModalOfficerMeta: document.getElementById('adm-modal-officer-meta'),
    admModalBody: document.getElementById('adm-modal-body'),
    admModalBtnClose: document.getElementById('adm-modal-btn-close'),

    // Content Management elements
    admCntStatCourses: document.getElementById('adm-cnt-stat-courses'),
    admCntStatLessons: document.getElementById('adm-cnt-stat-lessons'),
    admCntStatComps: document.getElementById('adm-cnt-stat-comps'),
    admCntStatQuizzes: document.getElementById('adm-cnt-stat-quizzes'),
    admCoursesContainer: document.getElementById('adm-courses-container'),

    // Integrations elements
    admIntegrationsCardsContainer: document.getElementById('adm-integrations-cards-container'),
    admTableAdaptersBody: document.getElementById('adm-table-adapters-body')
  };

  /**
   * 1. LOAD ADMIN OVERVIEW / DASHBOARD
   */
  async function loadAdminOverview() {
    try {
      const data = await API.admin.getOverview();
      adminState.overviewData = data;
      const s = data.summary;

      // Fill KPI stats
      if (els.admStatUsers) els.admStatUsers.textContent = s.total_users;
      if (els.admStatUserBreakdown) {
        els.admStatUserBreakdown.textContent = `${s.total_employees} Officers • ${s.total_admins} Admin(s)`;
      }
      if (els.admStatActiveLearners) els.admStatActiveLearners.textContent = s.active_employees;
      if (els.admStatDepts) els.admStatDepts.textContent = s.total_departments;
      if (els.admStatComps) els.admStatComps.textContent = s.total_competencies;
      if (els.admStatAttempts) els.admStatAttempts.textContent = s.total_assessment_attempts;
      if (els.admStatAvgScore) {
        els.admStatAvgScore.textContent = `Avg Score: ${data.assessment_metrics ? data.assessment_metrics.avg_score : 0}%`;
      }
      if (els.admStatCourses) els.admStatCourses.textContent = s.total_sample_courses;
      if (els.admStatLessons) {
        els.admStatLessons.textContent = `${s.total_lessons} Lessons • ${s.total_quizzes} Quizzes`;
      }
      if (els.admStatPoints) els.admStatPoints.textContent = (s.total_points_distributed || 0).toLocaleString() + ' pts';
      if (els.admStatAchievements) {
        els.admStatAchievements.textContent = `${s.total_achievements_unlocked || 0} Achievements unlocked`;
      }
      if (els.admStatIntegrations) {
        const intStatus = data.integrations_summary;
        const allOk = intStatus && Object.values(intStatus).every(st => st === 'operational' || st === 'simulated');
        els.admStatIntegrations.textContent = allOk ? 'Operational' : 'Attention Needed';
      }

      // Render Domain Cards
      renderDomainCards(data.workforce_analytics ? data.workforce_analytics.domains : []);

      // Render Top Skill Gaps
      renderTopSkillGaps(data.workforce_analytics ? data.workforce_analytics.top_skill_gaps : []);

      // Render Department Breakdown Table
      renderDepartmentTable(data.workforce_analytics ? data.workforce_analytics.departments : []);

      // Render Recent Assessments Audit Table
      renderRecentAssessmentsTable(data.assessment_metrics ? data.assessment_metrics.recent_assessments : []);

    } catch (err) {
      console.error('[Admin] Overview load error:', err);
      if (err.status === 403) {
        window.showToast('Access denied: Administrator credentials required.', 'error');
      } else {
        window.showToast('Could not load admin overview: ' + err.message, 'error');
      }
    }
  }

  /**
   * Render Domain Health Cards
   */
  function renderDomainCards(domains) {
    if (!els.admDomainCardsContainer) return;
    if (!domains || domains.length === 0) {
      els.admDomainCardsContainer.innerHTML = '<div class="text-muted">No domain proficiency data available.</div>';
      return;
    }

    let html = '';
    domains.forEach(d => {
      const avgCurr = d.avg_current_score || 0.0;
      const avgBase = d.avg_baseline_score || 0.0;
      const target = d.avg_target_score || 80.0;
      const pct = Math.min(100, Math.round((avgCurr / target) * 100));

      html += `
        <div class="block-card" style="margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs);">
            <div style="font-family: var(--font-brand); font-size: 0.95rem; font-weight: 700;">
              ${d.domain}
            </div>
            <span class="badge-pixel text-forest">${d.total_competencies} Competencies</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: var(--space-2xs);">
            <span class="text-muted">Avg Current: <strong>${avgCurr}%</strong></span>
            <span class="text-muted">Target: <strong>${target}%</strong></span>
          </div>
          <div class="progress-bar-container" style="height: 10px; margin-bottom: var(--space-2xs);">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: var(--color-forest);"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-ink-muted);">
            <span>Baseline: ${avgBase}%</span>
            <span>${pct}% of Target Benchmark</span>
          </div>
        </div>
      `;
    });

    els.admDomainCardsContainer.innerHTML = html;
  }

  /**
   * Render Top Skill Gaps in Workforce
   */
  function renderTopSkillGaps(gaps) {
    if (!els.admTopGapsContainer) return;
    if (!gaps || gaps.length === 0) {
      els.admTopGapsContainer.innerHTML = `
        <div class="explanation-box" style="background-color: var(--color-forest-light); border-left: 4px solid var(--color-forest);">
          ✓ <strong>All Assessed Officers On Track:</strong> No critical institutional competency deficiencies identified across assessed workforce cohorts.
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: var(--space-sm);">';
    gaps.forEach((g, idx) => {
      html += `
        <div class="block-card" style="margin-bottom: 0; padding: var(--space-sm) var(--space-md); border-left: 4px solid var(--color-danger);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-xs);">
            <div>
              <span style="font-family: var(--font-brand); font-size: 0.88rem; font-weight: 700;">#${idx + 1} ${g.name}</span>
              <span class="badge-pixel" style="margin-left: var(--space-xs); font-size: 0.75rem;">${g.domain}</span>
            </div>
            <div style="display: flex; gap: var(--space-sm); align-items: center;">
              <span style="font-size: 0.85rem; color: var(--color-ink-muted);">Avg Current: <strong>${g.avg_current_score}%</strong> (Target: ${g.target_score}%)</span>
              <span class="badge-priority-high" style="font-size: 0.82rem;">Deficit: -${g.avg_gap} pts</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    els.admTopGapsContainer.innerHTML = html;
  }

  /**
   * Render Department Breakdown Table
   */
  function renderDepartmentTable(depts) {
    if (!els.admTableDepartmentsBody) return;
    if (!depts || depts.length === 0) {
      els.admTableDepartmentsBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--color-ink-muted); padding: var(--space-md);">
            No department records found.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    depts.forEach(d => {
      const avgScore = d.avg_assessment_score ? `${d.avg_assessment_score}%` : '--';
      const assessedRate = d.employee_count > 0 ? `${d.assessed_employees_count} / ${d.employee_count}` : '0 / 0';
      const isHealthy = d.avg_assessment_score >= 70;

      html += `
        <tr>
          <td style="font-weight: 600;">${escapeHtml(d.name)}</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-forest);">${escapeHtml(d.code)}</td>
          <td>${d.employee_count || 0}</td>
          <td>${assessedRate}</td>
          <td>
            <span class="badge-pixel ${d.avg_assessment_score ? 'text-forest' : 'text-muted'}">
              ${avgScore}
            </span>
          </td>
          <td>
            <span class="badge-pixel ${isHealthy ? 'text-forest' : (d.avg_assessment_score ? 'text-ochre' : 'text-muted')}">
              ${d.avg_assessment_score ? (isHealthy ? 'BENCHMARK MET' : 'GROWTH FOCUS') : 'PENDING'}
            </span>
          </td>
        </tr>
      `;
    });

    els.admTableDepartmentsBody.innerHTML = html;
  }

  /**
   * Render Recent Assessments in Admin Table
   */
  function renderRecentAssessmentsTable(attempts) {
    if (!els.admTableRecentBody) return;

    if (!attempts || attempts.length === 0) {
      els.admTableRecentBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--color-ink-muted); padding: var(--space-md);">
            No assessment attempts recorded in the database yet.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    attempts.forEach(a => {
      const dateStr = a.completed_at ? new Date(a.completed_at).toLocaleString() : '--';
      const isBaseline = Boolean(a.is_baseline);

      html += `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700;">#ATT-${a.id}</td>
          <td style="font-weight: 600;">${escapeHtml(a.employee_name || 'Officer')}</td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-ink-muted);">${escapeHtml(a.username)}</td>
          <td>${escapeHtml(a.department_name || 'MoSPI')}</td>
          <td>
            <span class="badge-pixel text-forest" style="font-size: 0.9rem; font-weight: bold;">
              ${a.overall_score}%
            </span>
          </td>
          <td>
            <span class="badge-pixel ${isBaseline ? 'text-forest' : 'text-muted'}">
              ${isBaseline ? '✓ BASELINE' : 'SUBSEQUENT'}
            </span>
          </td>
          <td style="font-size: 0.8rem; color: var(--color-ink-muted);">${escapeHtml(dateStr)}</td>
        </tr>
      `;
    });

    els.admTableRecentBody.innerHTML = html;
  }

  /**
   * 2. LOAD ADMIN EMPLOYEE ROSTER
   */
  async function loadAdminEmployees() {
    try {
      // Ensure department filter dropdown is populated
      if (els.admEmpDeptFilter && els.admEmpDeptFilter.options.length <= 1) {
        const deptsData = await API.getDepartments();
        if (deptsData && deptsData.departments) {
          deptsData.departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.id;
            opt.textContent = `${dept.code} - ${dept.name}`;
            els.admEmpDeptFilter.appendChild(opt);
          });
        }
      }

      const params = {};
      if (adminState.selectedDepartmentId) {
        params.department_id = adminState.selectedDepartmentId;
      }
      if (adminState.searchKeyword) {
        params.search = adminState.searchKeyword;
      }

      const res = await API.admin.getEmployees(params);
      adminState.employeesData = res.employees || [];

      if (els.admEmpCountBadge) {
        els.admEmpCountBadge.textContent = `${res.total_count} OFFICER${res.total_count === 1 ? '' : 'S'}`;
      }

      renderEmployeesTable(adminState.employeesData);

    } catch (err) {
      console.error('[Admin] Employees load error:', err);
      window.showToast('Could not load workforce roster: ' + err.message, 'error');
    }
  }

  /**
   * Render Employee Roster Table
   */
  function renderEmployeesTable(employees) {
    if (!els.admTableEmployeesBody) return;

    if (!employees || employees.length === 0) {
      els.admTableEmployeesBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--color-ink-muted); padding: var(--space-xl);">
            No officers found matching the selected filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    employees.forEach(emp => {
      const comp = emp.competency_metrics;
      const assess = emp.assessment_metrics;
      const learn = emp.learning_metrics;
      const quiz = emp.quiz_metrics;
      const gam = emp.gamification_metrics;

      const growthDisplay = comp.growth_display || '0.0%';
      const growthColor = comp.growth_percent > 0 ? 'text-forest' : (comp.is_zero_baseline ? 'text-ochre' : 'text-muted');

      html += `
        <tr>
          <td>
            <div style="font-weight: 700;">${escapeHtml(emp.full_name)}</div>
            <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--color-ink-muted);">${escapeHtml(emp.username)}</div>
            <div style="font-size: 0.78rem; color: var(--color-forest);">${escapeHtml(emp.designation || 'Statistical Officer')}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(emp.department_name)}</div>
            <div style="font-size: 0.75rem; color: var(--color-ink-muted);">${escapeHtml(emp.cadre || 'Official Cadre')}</div>
          </td>
          <td>
            <span class="badge-pixel ${comp.assessed_count > 0 ? 'text-forest' : 'text-muted'}">
              ${comp.assessed_count} / ${comp.total_competencies}
            </span>
          </td>
          <td>
            <div style="font-size: 0.85rem;">
              <span class="text-muted">${comp.avg_baseline_score}%</span> → <strong>${comp.avg_current_score}%</strong>
            </div>
          </td>
          <td>
            <span class="badge-pixel ${growthColor}" style="font-size: 0.88rem; font-weight: 700;">
              ${escapeHtml(growthDisplay)}
            </span>
          </td>
          <td>
            <div style="font-size: 0.82rem;">
              <strong>${learn.completed_courses}</strong>/${learn.enrolled_courses} courses
            </div>
            <div style="font-size: 0.75rem; color: var(--color-ink-muted);">
              ${learn.lessons_completed} lessons completed
            </div>
          </td>
          <td>
            <span class="badge-pixel ${quiz.quizzes_passed > 0 ? 'text-forest' : 'text-muted'}">
              ${quiz.quizzes_passed}/${quiz.quizzes_attempted}
            </span>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-forest);">${gam.total_points.toLocaleString()} pts</div>
            <div style="font-size: 0.75rem; color: var(--color-ochre);">${gam.achievements_count} 🏆</div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm adm-btn-inspect" data-emp-id="${emp.id}">
              Inspect Profile
            </button>
          </td>
        </tr>
      `;
    });

    els.admTableEmployeesBody.innerHTML = html;

    // Attach click handlers to inspect buttons
    const inspectBtns = els.admTableEmployeesBody.querySelectorAll('.adm-btn-inspect');
    inspectBtns.forEach(btn => {
      btn.onclick = () => {
        const empId = Number(btn.dataset.empId);
        const emp = adminState.employeesData.find(e => e.id === empId);
        if (emp) openOfficerModal(emp);
      };
    });
  }

  /**
   * Open Officer Competency Detail Modal
   */
  function openOfficerModal(emp) {
    if (!els.admOfficerModal) return;

    if (els.admModalOfficerName) els.admModalOfficerName.textContent = emp.full_name;
    if (els.admModalOfficerMeta) {
      els.admModalOfficerMeta.textContent = `${emp.designation || 'Officer'} • ${emp.department_name} (${emp.department_code}) • ${emp.email}`;
    }

    if (els.admModalBody) {
      const comp = emp.competency_metrics;
      const comps = comp.competencies || [];

      let compRowsHtml = '';
      comps.forEach(c => {
        const isMet = c.is_met === 1;
        const gap = c.gap || 0;
        compRowsHtml += `
          <tr>
            <td style="font-weight: 600;">${escapeHtml(c.competency_name)}</td>
            <td><span class="badge-pixel" style="font-size: 0.75rem;">${escapeHtml(c.domain)}</span></td>
            <td>${c.baseline_score}%</td>
            <td><strong>${c.current_score}%</strong></td>
            <td>${c.target_score}%</td>
            <td>
              <span class="badge-pixel ${isMet ? 'text-forest' : (gap >= 25 ? 'badge-priority-high' : 'text-ochre')}">
                ${isMet ? '✓ TARGET MET' : `-${gap} pts`}
              </span>
            </td>
          </tr>
        `;
      });

      els.admModalBody.innerHTML = `
        <div class="stats-grid" style="margin-bottom: var(--space-md);">
          <div class="stat-tile">
            <div class="stat-tile-label">Baseline Score</div>
            <div class="stat-tile-value">${comp.avg_baseline_score}%</div>
            <div class="stat-tile-desc">Permanent baseline</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Current Score</div>
            <div class="stat-tile-value text-forest">${comp.avg_current_score}%</div>
            <div class="stat-tile-desc">Latest proficiency</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Growth %</div>
            <div class="stat-tile-value text-ochre">${comp.growth_display}</div>
            <div class="stat-tile-desc">From permanent baseline</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Reward Points</div>
            <div class="stat-tile-value text-copper">${emp.gamification_metrics.total_points} pts</div>
            <div class="stat-tile-desc">${emp.gamification_metrics.achievements_count} achievements</div>
          </div>
        </div>

        <div class="block-card" style="margin-bottom: 0;">
          <div class="block-card-header">
            <div class="block-card-title">
              <h3>COMPETENCY BREAKDOWN (17 BENCHMARKS)</h3>
            </div>
            <span class="badge-pixel text-forest">${comp.assessed_count} Assessed</span>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Competency</th>
                  <th>Domain</th>
                  <th>Baseline</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${compRowsHtml || '<tr><td colspan="6" class="text-muted text-center">No competency evaluation records found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    els.admOfficerModal.style.display = 'flex';
  }

  function closeOfficerModal() {
    if (els.admOfficerModal) {
      els.admOfficerModal.style.display = 'none';
    }
  }

  /**
   * 3. LOAD ADMIN LEARNING CONTENT
   */
  async function loadAdminContent() {
    try {
      const data = await API.admin.getContent();
      adminState.contentData = data;
      const s = data.summary;

      if (els.admCntStatCourses) els.admCntStatCourses.textContent = s.total_courses;
      if (els.admCntStatLessons) els.admCntStatLessons.textContent = s.total_lessons;
      if (els.admCntStatComps) els.admCntStatComps.textContent = s.total_competencies;
      if (els.admCntStatQuizzes) els.admCntStatQuizzes.textContent = s.total_quizzes;

      renderCoursesList(data.courses);

    } catch (err) {
      console.error('[Admin] Content load error:', err);
      window.showToast('Could not load course catalog: ' + err.message, 'error');
    }
  }

  /**
   * Render Courses Management List
   */
  function renderCoursesList(courses) {
    if (!els.admCoursesContainer) return;
    if (!courses || courses.length === 0) {
      els.admCoursesContainer.innerHTML = '<div class="text-muted">No courses found in catalog.</div>';
      return;
    }

    const filter = adminState.activeSourceFilter;
    const filtered = filter === 'ALL'
      ? courses
      : courses.filter(c => c.source_label === filter);

    if (filtered.length === 0) {
      els.admCoursesContainer.innerHTML = '<div class="text-muted" style="padding: var(--space-lg); text-align: center;">No courses match the selected source filter.</div>';
      return;
    }

    let html = '';
    filtered.forEach(c => {
      let sourceBadgeClass = 'badge-igot';
      let sourceIcon = '🏛️';
      if (c.source_label === 'sample_nssta_tpac') {
        sourceBadgeClass = 'badge-nssta';
        sourceIcon = '🎓';
      } else if (c.source_label === 'local_demo') {
        sourceBadgeClass = 'badge-local';
        sourceIcon = '🏢';
      }

      let compTagsHtml = '';
      if (c.mapped_competencies && c.mapped_competencies.length > 0) {
        c.mapped_competencies.forEach(comp => {
          compTagsHtml += `
            <span class="badge-pixel" style="margin-right: var(--space-2xs); margin-bottom: var(--space-2xs); font-size: 0.75rem;">
              ${comp.name} (+${comp.growth_impact_score} pts)
            </span>
          `;
        });
      } else {
        compTagsHtml = '<span class="text-muted" style="font-size: 0.8rem;">No competency mapping assigned.</span>';
      }

      let lessonsHtml = '';
      if (c.lessons && c.lessons.length > 0) {
        c.lessons.forEach(l => {
          lessonsHtml += `
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: var(--space-2xs) 0; border-bottom: 1px dashed var(--color-border);">
              <span>${l.sequence_order}. ${l.title}</span>
              <span class="text-muted">${l.duration_minutes} mins • ${l.materials_count} reference(s)</span>
            </div>
          `;
        });
      }

      html += `
        <div class="block-card" style="margin-bottom: var(--space-md); border-left: 4px solid var(--color-forest);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-xs);">
            <div>
              <div style="display: flex; gap: var(--space-xs); align-items: center; flex-wrap: wrap; margin-bottom: var(--space-2xs);">
                <span class="badge-pixel ${sourceBadgeClass}">${sourceIcon} ${c.source_display_name}</span>
                <span class="badge-pixel text-forest">${c.domain}</span>
                <span class="badge-pixel" style="font-size: 0.75rem;">${c.difficulty_level}</span>
              </div>
              <h3 style="margin-bottom: var(--space-2xs);">${c.title}</h3>
              <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--color-ink-muted); margin-bottom: var(--space-xs);">${c.code} • ${c.duration_hours} Hours</div>
            </div>
            <div style="text-align: right;">
              <span class="badge-pixel ${c.is_active ? 'text-forest' : 'text-muted'}">
                ${c.is_active ? '● ACTIVE CATALOG' : 'INACTIVE'}
              </span>
              <div style="font-size: 0.78rem; color: var(--color-ink-muted); margin-top: var(--space-2xs);">
                ${c.enrollment_stats.enrolled_count} Enrolled • ${c.enrollment_stats.completed_count} Completed
              </div>
            </div>
          </div>

          <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--space-sm);">
            ${c.description}
          </p>

          <div style="margin-bottom: var(--space-sm);">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-ink-muted); margin-bottom: var(--space-2xs);">MAPPED COMPETENCIES:</div>
            <div style="display: flex; flex-wrap: wrap;">${compTagsHtml}</div>
          </div>

          <div style="background-color: var(--color-paper-light); border: var(--border-subtle); padding: var(--space-sm); border-radius: var(--radius-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs);">
              <span style="font-weight: 700; font-size: 0.82rem;">CURRICULUM SYLLABUS (${c.lessons_count} Lessons)</span>
              ${c.quiz ? `<span class="badge-pixel text-ochre" style="font-size: 0.75rem;">📝 Quiz: ${c.quiz.title} (${c.quiz.question_count} Qs, Pass: ${c.quiz.pass_percentage}%)</span>` : '<span class="text-muted" style="font-size: 0.75rem;">No quiz attached</span>'}
            </div>
            ${lessonsHtml}
          </div>
        </div>
      `;
    });

    els.admCoursesContainer.innerHTML = html;
  }

  /**
   * 4. LOAD ADMIN INTEGRATIONS
   */
  async function loadAdminIntegrations() {
    try {
      const res = await API.integrations.getStatus();
      adminState.integrationsData = res;
      const adapters = res.adapters;

      renderIntegrationCards(adapters);
      renderIntegrationTable(adapters);

    } catch (err) {
      console.error('[Admin] Integrations load error:', err);
      window.showToast('Could not load integrations: ' + err.message, 'error');
    }
  }

  /**
   * Render Integration Status Cards
   */
  function renderIntegrationCards(adapters) {
    if (!els.admIntegrationsCardsContainer) return;
    if (!adapters) return;

    let html = '';
    const adapterKeys = Object.keys(adapters);

    adapterKeys.forEach(key => {
      const a = adapters[key];
      const isLive = Boolean(a.live_connected);
      const isSimulated = a.status === 'simulated';
      const isOperational = a.status === 'operational';

      let statusBadgeClass = 'text-forest';
      let statusText = 'OPERATIONAL';
      if (isSimulated) {
        statusBadgeClass = 'text-ochre';
        statusText = 'DEMO / SIMULATED';
      } else if (!isOperational) {
        statusBadgeClass = 'text-danger';
        statusText = 'DEGRADED';
      }

      html += `
        <div class="block-card" style="margin-bottom: 0; border-top: 4px solid ${isOperational ? 'var(--color-forest)' : (isSimulated ? 'var(--color-ochre)' : 'var(--color-danger)')};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-xs);">
            <div style="font-family: var(--font-brand); font-size: 0.95rem; font-weight: 700;">
              ${a.name}
            </div>
            <span class="badge-pixel ${statusBadgeClass}">${statusText}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--color-ink-muted); margin-bottom: var(--space-xs);">
            Mode: ${a.mode} • Provider: ${a.provider || 'NAVBODH Core'}
          </div>
          <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--space-sm);">
            ${a.description}
          </p>
          <div style="font-size: 0.78rem; padding: var(--space-xs); background-color: var(--color-paper-light); border: var(--border-subtle);">
            <strong>Architecture State:</strong> ${a.details || a.description}
          </div>
        </div>
      `;
    });

    els.admIntegrationsCardsContainer.innerHTML = html;
  }

  /**
   * Render Integration Specifications Table
   */
  function renderIntegrationTable(adapters) {
    if (!els.admTableAdaptersBody) return;
    if (!adapters) return;

    const endpointMap = {
      ai_assistant: 'POST /api/intelligence/study-assistant',
      igot_karmayogi: 'GET /api/courses (source_label=sample_igot)',
      nssta_tpac: 'GET /api/courses (source_label=sample_nssta_tpac)',
      sqlite_database: 'PRAGMA journal_mode=WAL',
      gamification_ledger: 'POST /api/lessons/:id/complete, POST /api/quizzes/:id/submit'
    };

    let html = '';
    Object.keys(adapters).forEach(key => {
      const a = adapters[key];
      html += `
        <tr>
          <td style="font-weight: 700;">${a.name}</td>
          <td><span class="badge-pixel" style="font-size: 0.75rem;">${a.type}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.82rem;">${a.mode}</td>
          <td>
            <span class="badge-pixel ${a.live_connected ? 'text-forest' : 'text-ochre'}">
              ${a.live_connected ? 'LIVE / EMBEDDED' : 'SIMULATED DEMO'}
            </span>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.78rem;">${endpointMap[key] || '/api/integrations/status'}</td>
          <td>
            <span class="badge-pixel ${a.status === 'operational' ? 'text-forest' : 'text-ochre'}">
              ${a.status.toUpperCase()}
            </span>
          </td>
        </tr>
      `;
    });

    els.admTableAdaptersBody.innerHTML = html;
  }

  /**
   * Attach Filter & Modal Event Listeners
   */
  function initAdminEventListeners() {
    // Search input for employees roster
    if (els.admEmpSearchInput) {
      let debounceTimer;
      els.admEmpSearchInput.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          adminState.searchKeyword = e.target.value.trim();
          loadAdminEmployees();
        }, 300);
      };
    }

    // Department filter for employees roster
    if (els.admEmpDeptFilter) {
      els.admEmpDeptFilter.onchange = (e) => {
        adminState.selectedDepartmentId = e.target.value;
        loadAdminEmployees();
      };
    }

    // Reset filters button
    if (els.admEmpBtnResetFilters) {
      els.admEmpBtnResetFilters.onclick = () => {
        if (els.admEmpSearchInput) els.admEmpSearchInput.value = '';
        if (els.admEmpDeptFilter) els.admEmpDeptFilter.value = '';
        adminState.searchKeyword = '';
        adminState.selectedDepartmentId = '';
        loadAdminEmployees();
      };
    }

    // Modal close button & backdrop click
    if (els.admModalBtnClose) {
      els.admModalBtnClose.onclick = closeOfficerModal;
    }
    if (els.admOfficerModal) {
      els.admOfficerModal.onclick = (e) => {
        if (e.target === els.admOfficerModal) closeOfficerModal();
      };
    }

    // Course source filter pills
    const pills = document.querySelectorAll('.filter-pill[data-source-filter]');
    pills.forEach(pill => {
      pill.onclick = () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        adminState.activeSourceFilter = pill.dataset.sourceFilter;
        if (adminState.contentData) {
          renderCoursesList(adminState.contentData.courses);
        }
      };
    });
  }

  // Initialize event listeners when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminEventListeners);
  } else {
    initAdminEventListeners();
  }

  // Export to window for global access
  window.AdminPortal = {
    loadAdminOverview,
    loadAdminEmployees,
    loadAdminContent,
    loadAdminIntegrations,
    openOfficerModal,
    closeOfficerModal
  };
})();
