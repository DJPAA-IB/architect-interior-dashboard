/**
 * Daily Reports Management View (Fiches de Rapports Journaliers)
 * Provides comprehensive multi-criteria filtering.
 * Strictly scoped for workers: only their own reports and assigned projects.
 */
import { store } from '../data/store.js';
import { formatDateFR, formatHours } from '../utils/formatters.js';
import { openReportDetailModal } from '../components/OfficialReportSheet.js';
import { openNewReportModal } from '../components/ReportModal.js';
import { exportReportsToCSV } from '../utils/exportHelpers.js';
import { showToast } from '../components/Toast.js';

let filterQuery = '';
let filterWorker = 'all';
let filterProject = 'all';
let filterStatus = 'all';
let filterDate = '';

export function renderReportsView(container) {
  const isAdmin = store.isAdmin();
  const currentUser = store.getCurrentUser();
  const workers = store.getWorkers();
  const projects = store.getProjects();
  const allReports = store.getDailyReports();

  // Apply filters
  const filteredReports = allReports.filter(r => {
    const matchesQuery = !filterQuery || (
      r.workerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.projectName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.clientName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (r.displayDate && r.displayDate.includes(filterQuery)) ||
      (r.summary?.achievements && r.summary.achievements.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (r.summary?.difficulties && r.summary.difficulties.toLowerCase().includes(filterQuery.toLowerCase()))
    );

    const matchesWorker = !isAdmin || filterWorker === 'all' || r.workerId === filterWorker || r.workerName.toLowerCase().includes(filterWorker.toLowerCase());
    const matchesProject = filterProject === 'all' || r.projectId === filterProject || r.projectName.toLowerCase().includes(filterProject.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesDate = !filterDate || r.date === filterDate || r.displayDate === filterDate || formatDateFR(r.date) === filterDate;

    return matchesQuery && matchesWorker && matchesProject && matchesStatus && matchesDate;
  });

  const totalFilteredHours = filteredReports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${isAdmin ? 'Fiches de Rapports Journaliers' : `Mes Fiches Journalières (${currentUser.name})`}</h1>
        <p>${isAdmin ? "Archive numérique et registre des fiches journalières de l'ensemble des collaborateurs." : "Consultez, modifiez et téléchargez vos fiches journalières de travail enregistrées."}</p>
      </div>

      <div class="view-actions">
        <button class="btn-secondary" id="export-reports-csv-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Exporter CSV</span>
        </button>

        <button class="btn-primary" id="open-new-report-view-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>+ Nouvelle Fiche Journalière</span>
        </button>
      </div>
    </div>

    <!-- Multi-Criteria Filter Bar -->
    <div class="filter-bar">
      <!-- Keyword search -->
      <div class="filter-input-wrap">
        <svg class="filter-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="reports-search-input" 
          class="filter-input" 
          placeholder="Filtrer par mot-clé (ex: piscine, coupes, allèges)..." 
          value="${filterQuery}"
        />
      </div>

      <!-- Worker filter (Admin only) -->
      ${isAdmin ? `
        <select id="reports-filter-worker" class="filter-select">
          <option value="all">Tous les collaborateurs (${workers.length})</option>
          ${workers.map(w => `
            <option value="${w.id}" ${filterWorker === w.id ? 'selected' : ''}>${w.name}</option>
          `).join('')}
        </select>
      ` : ''}

      <!-- Project filter -->
      <select id="reports-filter-project" class="filter-select">
        <option value="all">Toutes les villas / projets (${projects.length})</option>
        ${projects.map(p => `
          <option value="${p.id}" ${filterProject === p.id ? 'selected' : ''}>${p.name}</option>
        `).join('')}
      </select>

      <!-- Status filter -->
      <select id="reports-filter-status" class="filter-select">
        <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Tous statuts</option>
        <option value="Validé" ${filterStatus === 'Validé' ? 'selected' : ''}>✓ Validé</option>
        <option value="En attente" ${filterStatus === 'En attente' ? 'selected' : ''}>⏳ En attente</option>
      </select>

      <!-- Date picker -->
      <input 
        type="date" 
        id="reports-filter-date" 
        class="filter-select" 
        value="${filterDate}"
        title="Filtrer par date précise"
      />

      ${(filterQuery || (isAdmin && filterWorker !== 'all') || filterProject !== 'all' || filterStatus !== 'all' || filterDate) ? `
        <button class="btn-secondary" id="reports-reset-filters-btn" style="padding: 8px 12px; font-size: 12px; color: var(--accent-rose);">
          ✕ Réinitialiser
        </button>
      ` : ''}
    </div>

    <!-- Active Summary Metrics Pill -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; font-size: 13px; color: var(--text-secondary);">
      <div>
        Affichage de <strong>${filteredReports.length}</strong> fiche(s) journalière(s) sur ${allReports.length}
      </div>
      <div style="display: flex; gap: 16px;">
        <span>Total heures filtrées : <strong style="color: var(--primary-600);">${totalFilteredHours.toFixed(1)}h</strong></span>
      </div>
    </div>

    <!-- Reports Data Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Réf</th>
              <th>Collaborateur</th>
              <th>Villa / Projet</th>
              <th>Horaires</th>
              <th>Activités & Bilan</th>
              <th>Statut</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 48px; color: var(--text-muted);">
                  <div style="font-size: 28px; margin-bottom: 8px;">📑</div>
                  <div style="font-weight: 700; color: var(--text-primary);">Aucune fiche journalière trouvée</div>
                  <div style="font-size: 13px; margin-top: 4px;">Cliquez sur "+ Nouvelle Fiche Journalière" pour enregistrer votre journée.</div>
                </td>
              </tr>
            ` : filteredReports.map(report => `
              <tr class="report-table-row" data-id="${report.id}">
                <td>
                  <div style="font-weight: 700; color: var(--text-primary);">${report.displayDate || formatDateFR(report.date)}</div>
                  <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${report.id}</div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar" style="width: 32px; height: 32px; font-size: 11px;">
                      ${report.workerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary);">${report.workerName}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${report.workerRole}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="villa-tag">${report.projectName}</div>
                  ${report.clientName ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Client: ${report.clientName}</div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 600;">${report.startTime} - ${report.endTime}</div>
                  <div style="font-size: 11px; color: var(--primary-600); font-weight: 700;">${report.totalHours}h travaillées</div>
                </td>
                <td style="max-width: 320px;">
                  <div style="font-size: 12.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${Array.isArray(report.activities) ? report.activities.map(a => a.activity).join(' • ') : 'Activité studio'}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                    ${report.summary?.achievements || 'Dossier en cours'}
                  </div>
                </td>
                <td>
                  <span class="status-badge ${report.status === 'Validé' ? 'status-validated' : 'status-pending'}">
                    ${report.status === 'Validé' ? '✓ Validé' : '⏳ En attente'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; align-items: center; gap: 6px;">
                    <button class="btn-secondary view-report-btn" data-id="${report.id}" style="padding: 6px 12px; font-size: 12px;" title="Consulter la fiche officielle A4">
                      <span>Consulter</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  attachReportsEvents(container);
}

function attachReportsEvents(container) {
  const searchInput = document.getElementById('reports-search-input');
  const workerSelect = document.getElementById('reports-filter-worker');
  const projectSelect = document.getElementById('reports-filter-project');
  const statusSelect = document.getElementById('reports-filter-status');
  const dateInput = document.getElementById('reports-filter-date');
  const resetBtn = document.getElementById('reports-reset-filters-btn');
  const newReportBtn = document.getElementById('open-new-report-view-btn');
  const exportCsvBtn = document.getElementById('export-reports-csv-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterQuery = e.target.value;
      renderReportsView(container);
    });
  }

  if (workerSelect) {
    workerSelect.addEventListener('change', (e) => {
      filterWorker = e.target.value;
      renderReportsView(container);
    });
  }

  if (projectSelect) {
    projectSelect.addEventListener('change', (e) => {
      filterProject = e.target.value;
      renderReportsView(container);
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderReportsView(container);
    });
  }

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      filterDate = e.target.value;
      renderReportsView(container);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      filterQuery = '';
      filterWorker = 'all';
      filterProject = 'all';
      filterStatus = 'all';
      filterDate = '';
      renderReportsView(container);
    });
  }

  if (newReportBtn) {
    newReportBtn.addEventListener('click', openNewReportModal);
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const reports = store.getDailyReports();
      exportReportsToCSV(reports);
      showToast("Export CSV généré avec succès !", "success");
    });
  }

  container.querySelectorAll('.view-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      openReportDetailModal(id);
    });
  });

  container.querySelectorAll('.report-table-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      openReportDetailModal(id);
    });
  });
}
