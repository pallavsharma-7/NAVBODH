/**
 * NAVBODH - Admin Portal Logic & Overview Controller
 * 
 * Provides administrator dashboard metrics, recent assessment audit log,
 * and integration boundaries for Stage 5 (Palak).
 */

(function () {
  'use strict';

  // DOM Elements
  const els = {
    admStatUsers: document.getElementById('adm-stat-users'),
    admStatUserBreakdown: document.getElementById('adm-stat-user-breakdown'),
    admStatDepts: document.getElementById('adm-stat-depts'),
    admStatComps: document.getElementById('adm-stat-comps'),
    admStatAttempts: document.getElementById('adm-stat-attempts'),
    admStatCourses: document.getElementById('adm-stat-courses'),
    admTableRecentBody: document.getElementById('adm-table-recent-body')
  };

  /**
   * Load Admin Dashboard Overview Statistics
   */
  async function loadAdminOverview() {
    try {
      const data = await API.admin.getOverview();
      const s = data.summary;

      if (els.admStatUsers) els.admStatUsers.textContent = s.total_users;
      if (els.admStatUserBreakdown) {
        els.admStatUserBreakdown.textContent = `${s.total_employees} Employees • ${s.total_admins} Admin(s)`;
      }
      if (els.admStatDepts) els.admStatDepts.textContent = s.total_departments;
      if (els.admStatComps) els.admStatComps.textContent = s.total_competencies;
      if (els.admStatAttempts) els.admStatAttempts.textContent = s.total_assessment_attempts;
      if (els.admStatCourses) els.admStatCourses.textContent = s.total_sample_courses;

      // Render Recent Assessments Table
      renderRecentAssessmentsTable(data.recent_assessments);

    } catch (err) {
      console.error('Admin overview error:', err);
      if (err.status === 403) {
        window.showToast('Access denied: Administrator privileges required.', 'error');
      } else {
        window.showToast('Could not load admin metrics: ' + err.message, 'error');
      }
    }
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
          <td style="font-weight: 600;">${a.employee_name || 'Officer'}</td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-ink-muted);">${a.username}</td>
          <td>${a.department_name || 'MoSPI'}</td>
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
          <td style="font-size: 0.8rem; color: var(--color-ink-muted);">${dateStr}</td>
        </tr>
      `;
    });

    els.admTableRecentBody.innerHTML = html;
  }

  // Export to window
  window.AdminPortal = {
    loadAdminOverview
  };
})();
