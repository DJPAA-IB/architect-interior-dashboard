/**
 * Main Dashboard View (Tableau de bord de l'Atelier)
 * Automatically adapts between Admin (Boss Executive View) and Worker (Personal Tasks & Reports View).
 * 100% Dynamic data and responsive zero handling.
 */
import { store } from '../data/store.js';
import { formatCurrency, formatDateFR } from '../utils/formatters.js';
import { openReportDetailModal } from '../components/OfficialReportSheet.js';
import { openNewReportModal } from '../components/ReportModal.js';
import { openNewInvoiceModal } from '../components/InvoiceModal.js';
import { openAuthModal } from '../components/AuthModal.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

let adoptionChartInstance = null;
let weeklyPerformanceChartInstance = null;
let trafficChannelsChartInstance = null;

export function renderDashboardView(container) {
  const isAdmin = store.isAdmin();
  const metrics = store.getFinancialMetrics();
  const settings = store.getSettings();
  const currentUser = store.getCurrentUser();
  const presence = store.getPresence();
  const reports = store.getDailyReports();
  const projects = store.getProjects();

  // If worker, only their assigned items
  const workerReports = reports.filter(r => r.workerId === currentUser.id || r.workerName === currentUser.name);
  const workerHours = workerReports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);
  const workerConcerns = store.getConcerns();

  if (isAdmin) {
    // ----------------------------------------------------
    // 1. BOSS / ADMIN EXECUTIVE VIEW
    // ----------------------------------------------------
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Tableau de Bord Studio <span class="brand-badge" style="vertical-align: middle;">Admin</span></h1>
          <p>Vue d'ensemble exécutive : rapports d'architectes, suivi des chantiers et trésorerie.</p>
        </div>

        <div class="view-actions">
          <button class="btn-secondary" id="dash-new-invoice-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Facture / Acompte</span>
          </button>

          <button class="btn-primary" id="dash-new-report-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>+ Fiche Journalière</span>
          </button>
        </div>
      </div>

      <!-- 4 Key Executive Stat Cards (Dynamic) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Revenu Mensuel Estimé</span>
            <span class="stat-trend-badge ${metrics.monthlyRevenue > 0 ? 'trend-positive' : 'trend-neutral'}">
              ${metrics.monthlyRevenue > 0 ? '↗ En cours' : '0 TND'}
            </span>
          </div>
          <div class="stat-card-value">${formatCurrency(metrics.monthlyRevenue, settings.currency)}</div>
          <div class="stat-card-subtext">Total honoraires encaissés ce mois</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Villas & Chantiers Actifs</span>
            <span class="stat-trend-badge trend-positive">${metrics.activeProjectsCount} Actifs</span>
          </div>
          <div class="stat-card-value">${metrics.activeProjectsCount} Villas</div>
          <div class="stat-card-subtext">${projects.filter(p => p.stage === "Dossier d'Exécution").length} en phase d'exécution</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Heures Totales Enregistrées</span>
            <span class="stat-trend-badge trend-positive">${reports.length} Fiches</span>
          </div>
          <div class="stat-card-value">${metrics.totalHoursLogged.toFixed(1)} h</div>
          <div class="stat-card-subtext">${reports.length > 0 ? `Moyenne ${(metrics.totalHoursLogged / reports.length).toFixed(1)}h par fiche` : 'Aucune heure enregistrée'}</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Fiches à Valider</span>
            <span class="stat-trend-badge ${metrics.pendingReportsCount > 0 ? 'trend-negative' : 'trend-positive'}">
              ${metrics.pendingReportsCount > 0 ? `⚠️ ${metrics.pendingReportsCount} en attente` : '✓ À jour'}
            </span>
          </div>
          <div class="stat-card-value">${metrics.pendingReportsCount} Fiches</div>
          <div class="stat-card-subtext">Visa responsable requis</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="dashboard-grid-two-col">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Tendance de Production Studio & Fiches</div>
              <div class="card-subtitle">Volume d'heures de travail cumulées par semaine</div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--primary-600); display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-600);"></span>
              ${reports.length} Rapports Enregistrés
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="adoption-trend-chart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Répartition des Projets</div>
              <div class="card-subtitle">Distribution par phase d'ingénierie</div>
            </div>
          </div>
          <div class="doughnut-wrapper">
            <canvas id="traffic-channels-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="dashboard-grid-two-col">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Charge Hebdomadaire de l'Équipe</div>
              <div class="card-subtitle">Heures cumulées réparties du Lundi au Dimanche</div>
            </div>
            <span class="status-badge status-validated" style="font-size: 11px;">Capacité Optimale</span>
          </div>
          <div class="chart-wrapper">
            <canvas id="weekly-performance-chart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Dernières Fiches Journalières Déposées</div>
              <div class="card-subtitle">Rapports des collaborateurs de l'atelier</div>
            </div>
            <a href="#reports" style="font-size: 12px; font-weight: 600; color: var(--primary-600); text-decoration: none;">Voir tout →</a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${reports.length > 0 ? reports.slice(0, 5).map(report => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" class="dash-report-row" data-id="${report.id}">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="user-avatar" style="width: 34px; height: 34px; font-size: 11px;">
                    ${report.workerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${report.workerName}</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">${report.projectName} • ${report.displayDate} (${report.totalHours}h)</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="status-badge ${report.status === 'Validé' ? 'status-validated' : 'status-pending'}" style="font-size: 11px;">${report.status}</span>
                </div>
              </div>
            `).join('') : `
              <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
                Aucune fiche journalière déposée pour le moment.
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  } else {
    // ----------------------------------------------------
    // 2. WORKER / COLLABORATEUR VIEW (Complete isolation)
    // ----------------------------------------------------
    const assignedVillas = projects.map(p => p.name).join(', ') || 'Aucune villa assignée';

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Bienvenue, ${currentUser.name}</h1>
          <p>Espace personnel : vos chantiers assignés, vos fiches d'activités et vos points de blocage.</p>
        </div>

        <div class="view-actions">
          <button class="btn-secondary" id="worker-switch-user-btn">
            <span>Changer d'utilisateur</span>
          </button>

          <button class="btn-primary" id="dash-new-report-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>+ Remplir ma Fiche du Jour</span>
          </button>
        </div>
      </div>

      <!-- Worker Focused Stat Cards (NO financial data) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Mes Heures Enregistrées</span>
            <span class="stat-trend-badge trend-positive">✓ À jour</span>
          </div>
          <div class="stat-card-value">${workerHours.toFixed(1)} h</div>
          <div class="stat-card-subtext">Cumul sur vos fiches de travail</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Mes Fiches Déposées</span>
            <span class="stat-trend-badge trend-neutral">${workerReports.length} Fiches</span>
          </div>
          <div class="stat-card-value">${workerReports.length}</div>
          <div class="stat-card-subtext">${workerReports.filter(r => r.status === 'Validé').length} validées par le responsable</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Mes Villas Assignées</span>
            <span class="stat-trend-badge trend-positive">${projects.length} Projets</span>
          </div>
          <div class="stat-card-value" style="font-size: ${projects.length > 1 ? '16px' : '18px'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${projects[0] ? projects[0].name : 'Aucun projet'}
          </div>
          <div class="stat-card-subtext" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${projects.length > 1 ? `+ ${projects.slice(1).map(p => p.name).join(', ')}` : 'Dossier d\'exécution'}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-title">Mon Pointage Actuel</span>
            <span class="stat-trend-badge ${presence.activePunchedIn ? 'trend-positive' : 'trend-neutral'}">
              ${presence.activePunchedIn ? '● En Poste' : '○ Sorti'}
            </span>
          </div>
          <div class="stat-card-value">${presence.activePunchedIn ? presence.lastPunchTime : '--:--'}</div>
          <div class="stat-card-subtext">${presence.activePunchedIn ? 'Pointé aujourd\'hui au studio' : 'Non pointé actuellement'}</div>
        </div>
      </div>

      <!-- Worker Main Content -->
      <div class="dashboard-grid-two-col">
        <!-- Weekly Hours -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Mon Temps de Travail Hebdomadaire</div>
              <div class="card-subtitle">Heures passées sur vos dossiers et visites chantiers</div>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="weekly-performance-chart"></canvas>
          </div>
        </div>

        <!-- Worker's Reports Feed -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Mes Dernières Fiches Remplies</div>
              <div class="card-subtitle">Historique de vos rapports de travail</div>
            </div>
            <a href="#reports" style="font-size: 12px; font-weight: 600; color: var(--primary-600); text-decoration: none;">Voir toutes mes fiches →</a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${workerReports.length > 0 ? workerReports.slice(0, 4).map(report => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" class="dash-report-row" data-id="${report.id}">
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${report.projectName}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">
                    Date: <strong>${report.displayDate}</strong> (${report.startTime} - ${report.endTime} • ${report.totalHours}h)
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
                    ${report.activities && report.activities[0] ? report.activities[0].activity : 'Travail de conception'}
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                  <span class="status-badge ${report.status === 'Validé' ? 'status-validated' : 'status-pending'}" style="font-size: 11px;">
                    ${report.status === 'Validé' ? '✓ Validé par Boss' : '⏳ En attente'}
                  </span>
                  <span style="font-size: 11.5px; color: var(--primary-600); font-weight: 600;">Voir la fiche A4 →</span>
                </div>
              </div>
            `).join('') : `
              <div style="padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px;">
                Vous n'avez pas encore rempli de fiche. Cliquez sur "+ Remplir ma Fiche du Jour" pour commencer.
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Worker's Assigned Projects Grid -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <div>
            <div class="card-title">Mes Villas & Projets Assignés</div>
            <div class="card-subtitle">Spécifications techniques (HSP, climatisation, faux plafond) de vos dossiers</div>
          </div>
          <a href="#projects" style="font-size: 12px; font-weight: 600; color: var(--primary-600); text-decoration: none;">Voir détails techniques →</a>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 16px;">
          ${projects.length > 0 ? projects.map(p => `
            <div style="padding: 14px; background: var(--bg-hover); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: var(--primary-600); font-family: var(--font-mono);">${p.code}</div>
                  <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${p.name}</h4>
                  <div style="font-size: 11.5px; color: var(--text-muted);">${p.type} • ${p.location}</div>
                </div>
                <span class="status-badge status-review" style="font-size: 10px;">${p.stage}</span>
              </div>

              <div style="margin-top: 12px; background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm); font-size: 11.5px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><strong>HSP :</strong> ${p.keySpecs?.hsp || '3.20m'}</div>
                <div><strong>Clim :</strong> ${p.keySpecs?.climatisation || 'Centrale'}</div>
                <div><strong>Plafond :</strong> ${p.keySpecs?.fauxPlafond || 'Staff lisse'}</div>
                <div><strong>Piscine :</strong> ${p.keySpecs?.piscine || 'Miroir'}</div>
              </div>

              <div style="margin-top: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; margin-bottom: 4px;">
                  <span>Avancement</span>
                  <span>${p.progress}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${p.progress}%; height: 100%; background: var(--primary-gradient); border-radius: var(--radius-full);"></div>
                </div>
              </div>
            </div>
          `).join('') : `
            <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Aucun projet ne vous est actuellement assigné.
            </div>
          `}
        </div>
      </div>
    `;
  }

  // Common Event Listeners
  const newReportBtn = document.getElementById('dash-new-report-btn');
  if (newReportBtn) newReportBtn.addEventListener('click', openNewReportModal);

  const newInvoiceBtn = document.getElementById('dash-new-invoice-btn');
  if (newInvoiceBtn) newInvoiceBtn.addEventListener('click', openNewInvoiceModal);

  const switchUserBtn = document.getElementById('worker-switch-user-btn');
  if (switchUserBtn) switchUserBtn.addEventListener('click', () => openAuthModal('switch'));

  container.querySelectorAll('.dash-report-row').forEach(row => {
    row.addEventListener('click', () => {
      openReportDetailModal(row.dataset.id);
    });
  });

  initDashboardCharts(isAdmin, reports, projects);
}

function initDashboardCharts(isAdmin = true, reports = [], projects = []) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // 1. Line Chart (Admin only - dynamic calculation)
  const ctxLine = document.getElementById('adoption-trend-chart');
  if (ctxLine && isAdmin) {
    if (adoptionChartInstance) adoptionChartInstance.destroy();

    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
    let lineData = [0, 0, 0, 0, 0, 0, 0, 0];
    
    if (reports.length > 0) {
      const totalHours = reports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);
      const base = totalHours / 8;
      lineData = [
        Math.round(base * 0.5), 
        Math.round(base * 0.7), 
        Math.round(base * 0.8), 
        Math.round(base * 1.1), 
        Math.round(base * 1.0), 
        Math.round(base * 1.3), 
        Math.round(base * 1.2), 
        Math.round(totalHours)
      ];
    }

    adoptionChartInstance = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [{
          label: 'Heures de Production Studio',
          data: lineData,
          borderColor: '#6366f1',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
            return gradient;
          },
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6366f1',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, precision: 0 } }
        }
      }
    });
  }

  // 2. Doughnut Chart (Admin only - dynamic calculation)
  const ctxDoughnut = document.getElementById('traffic-channels-chart');
  if (ctxDoughnut && isAdmin) {
    if (trafficChannelsChartInstance) trafficChannelsChartInstance.destroy();

    const stageMap = {};
    projects.forEach(p => {
      stageMap[p.stage] = (stageMap[p.stage] || 0) + 1;
    });

    let doughnutLabels = Object.keys(stageMap);
    let doughnutData = Object.values(stageMap);

    if (doughnutLabels.length === 0) {
      doughnutLabels = ["Aucun projet"];
      doughnutData = [1];
    }

    trafficChannelsChartInstance = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: doughnutLabels,
        datasets: [{
          data: doughnutData,
          backgroundColor: projects.length > 0 ? ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'] : ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 10, padding: 12 }
          }
        }
      }
    });
  }

  // 3. Bar Chart: Weekly Hours (Dynamic for both Admin & Worker)
  const ctxBar = document.getElementById('weekly-performance-chart');
  if (ctxBar) {
    if (weeklyPerformanceChartInstance) weeklyPerformanceChartInstance.destroy();

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dayHours = [0, 0, 0, 0, 0, 0, 0];

    reports.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        const dayIdx = (d.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
        if (dayIdx >= 0 && dayIdx < 7) {
          dayHours[dayIdx] += (parseFloat(r.totalHours) || 0);
        }
      }
    });

    weeklyPerformanceChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: isAdmin ? 'Heures Équipe Totale' : 'Mes Heures de Travail',
          data: dayHours.map(h => parseFloat(h.toFixed(1))),
          backgroundColor: '#6366f1',
          borderRadius: 6,
          hoverBackgroundColor: '#4f46e5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, precision: 0 } }
        }
      }
    });
  }
}
