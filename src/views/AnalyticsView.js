/**
 * Studio Analytics & Bottlenecks View (Analyses & Délais)
 * 100% Dynamic data calculation - correctly displays zeros when data is empty or reset.
 */
import { store } from '../data/store.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

let taskDistChartInstance = null;

export function renderAnalyticsView(container) {
  const isAdmin = store.isAdmin();
  const currentUser = store.getCurrentUser();
  const reports = store.getDailyReports();
  const projects = store.getProjects();

  // 1. Dynamic Calculations
  const totalReportsCount = reports.length;
  const totalHours = reports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);
  
  // Average hours per report
  const avgHours = totalReportsCount > 0 ? (totalHours / totalReportsCount).toFixed(1) : "0.0";

  // Validation rate
  const validatedCount = reports.filter(r => r.status === 'Validé').length;
  const validationRate = totalReportsCount > 0 ? Math.round((validatedCount / totalReportsCount) * 100) : 0;

  // Aggregate hours by activity category
  const activityHoursMap = {};
  reports.forEach(r => {
    if (Array.isArray(r.activities) && r.activities.length > 0) {
      const hoursPerAct = (parseFloat(r.totalHours) || 0) / r.activities.length;
      r.activities.forEach(a => {
        const cat = normalizeActivityCategory(a.activity);
        activityHoursMap[cat] = (activityHoursMap[cat] || 0) + hoursPerAct;
      });
    } else {
      activityHoursMap["Dossier d'Exécution"] = (activityHoursMap["Dossier d'Exécution"] || 0) + (parseFloat(r.totalHours) || 0);
    }
  });

  // Determine top demanding phase
  let topPhase = "Aucune";
  let topPhaseHours = 0;
  let topPhasePct = 0;

  Object.entries(activityHoursMap).forEach(([phase, hours]) => {
    if (hours > topPhaseHours) {
      topPhaseHours = hours;
      topPhase = phase;
    }
  });

  if (totalHours > 0 && topPhaseHours > 0) {
    topPhasePct = Math.round((topPhaseHours / totalHours) * 100);
  }

  // Extract dynamic difficulties and points of attention
  const extractedConcerns = [];
  reports.forEach(r => {
    if (r.summary && r.summary.difficulties && r.summary.difficulties.trim() && r.summary.difficulties !== 'Aucune') {
      extractedConcerns.push({
        id: r.id,
        project: r.projectName,
        worker: r.workerName,
        date: r.displayDate || r.date,
        text: r.summary.difficulties,
        tomorrow: r.summary.tomorrowActions
      });
    }
  });

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${isAdmin ? 'Analyses Studio & Temps de Conception' : `Mes Analyses de Travail (${currentUser.name})`}</h1>
        <p>${isAdmin ? 'Statistiques globales sur la répartition du temps, détection des points de blocage et charge des projets.' : 'Suivi de vos heures par phase architecturale et registre de vos difficultés techniques signalées.'}</p>
      </div>
    </div>

    <!-- Analytics Top Cards (100% Dynamic) -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-title">Temps Moyen par Fiche</div>
        <div class="stat-card-value" style="margin-top: 8px;">${avgHours} h</div>
        <div class="stat-card-subtext">${totalReportsCount} fiche(s) enregistrée(s) au total</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-title">Taux de Validation Fiches</div>
        <div class="stat-card-value" style="margin-top: 8px; color: ${validationRate > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)'};">${validationRate}%</div>
        <div class="stat-card-subtext">${validatedCount} fiche(s) validée(s) par le responsable</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-title">Phase la Plus Gourmande</div>
        <div class="stat-card-value" style="margin-top: 8px; color: var(--primary-600); font-size: ${topPhase.length > 18 ? '18px' : '22px'};">
          ${topPhase}
        </div>
        <div class="stat-card-subtext">${topPhasePct > 0 ? `${topPhasePct}% du temps total passé (${topPhaseHours.toFixed(1)}h)` : 'Aucune heure enregistrée'}</div>
      </div>
    </div>

    <div class="dashboard-grid-two-col">
      <!-- Task Distribution Chart -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Répartition du Temps par Type de Tâche</div>
            <div class="card-subtitle">Heures cumulées par catégorie architecturale</div>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas id="task-distribution-chart"></canvas>
        </div>
      </div>

      <!-- Recurring Technical Challenges (Extracted 100% dynamically from real reports) -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Points d'Attention Techniques & Difficultés</div>
            <div class="card-subtitle">${extractedConcerns.length > 0 ? `${extractedConcerns.length} point(s) d'attention relevé(s)` : 'Historique des alertes'}</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          ${extractedConcerns.length > 0 ? extractedConcerns.slice(0, 4).map((c, idx) => {
            const styles = [
              { bg: 'var(--accent-amber-bg)', border: 'var(--accent-amber-border)', color: 'var(--accent-amber)', icon: '⚠️' },
              { bg: 'var(--accent-purple-bg)', border: 'var(--accent-purple-border)', color: 'var(--accent-purple)', icon: '❄️' },
              { bg: 'var(--accent-blue-bg)', border: 'var(--accent-blue-border)', color: 'var(--accent-blue)', icon: '🏊' },
              { bg: 'var(--primary-50)', border: 'var(--primary-200)', color: 'var(--primary-700)', icon: '📐' }
            ];
            const style = styles[idx % styles.length];

            return `
              <div style="padding: 12px 14px; background: ${style.bg}; border: 1px solid ${style.border}; border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <div style="font-weight: 700; color: ${style.color}; font-size: 13px;">
                    ${style.icon} ${c.project}
                  </div>
                  <span style="font-size: 11px; color: var(--text-muted);">${c.date} • ${c.worker}</span>
                </div>
                <div style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.4;">
                  ${c.text}
                </div>
                ${c.tomorrow ? `
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px; border-top: 1px dashed rgba(0,0,0,0.08); padding-top: 4px;">
                    <strong>Action prévue :</strong> ${c.tomorrow}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : `
            <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); background: var(--bg-hover); border-radius: var(--radius-md); border: 1px dashed var(--border-default);">
              <div style="font-size: 26px; margin-bottom: 8px;">✨</div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 13.5px;">Aucun point de blocage signalé</div>
              <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted);">
                Toutes les fiches enregistrées sont conformes ou aucune difficulté n'a été signalée pour le moment.
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  initAnalyticsChart(activityHoursMap, totalHours);
}

function normalizeActivityCategory(actText = "") {
  const text = (actText || "").toUpperCase();
  if (text.includes("PISCINE")) return "Détails Piscine";
  if (text.includes("3D") || text.includes("RENDU") || text.includes("MOBILIER")) return "Rendus 3D & Décoration";
  if (text.includes("PLAFOND") || text.includes("CLIM") || text.includes("COORDINATION") || text.includes("TECHNIQUE")) return "Coordination Technique & Plafond";
  if (text.includes("COUPE") || text.includes("FACADE") || text.includes("ELEVATION")) return "Plans Coupes & Façades";
  if (text.includes("CHANTIER") || text.includes("VISITE") || text.includes("REUNION")) return "Visites Chantier & Suivi";
  if (text.includes("EXECUTION") || text.includes("DCE")) return "Dossier d'Exécution";
  return "Études & Conception";
}

function initAnalyticsChart(activityHoursMap, totalHours) {
  const ctx = document.getElementById('task-distribution-chart');
  if (!ctx) return;

  if (taskDistChartInstance) taskDistChartInstance.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  const defaultCategories = [
    "Dossier d'Exécution", 
    "Plans Coupes & Façades", 
    "Coordination Technique & Plafond", 
    "Rendus 3D & Décoration", 
    "Visites Chantier & Suivi", 
    "Détails Piscine"
  ];

  let labels = [];
  let data = [];

  if (totalHours > 0 && Object.keys(activityHoursMap).length > 0) {
    labels = Object.keys(activityHoursMap);
    data = labels.map(l => parseFloat((activityHoursMap[l] || 0).toFixed(1)));
  } else {
    labels = defaultCategories;
    data = [0, 0, 0, 0, 0, 0];
  }

  taskDistChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Heures Cumulées',
        data,
        backgroundColor: '#6366f1',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, precision: 0 }
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });
}
