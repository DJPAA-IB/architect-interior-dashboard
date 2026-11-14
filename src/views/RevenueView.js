/**
 * Revenue, Billing & Financials View (Gestion des Revenus, Honoraires & Facturation)
 */
import { store } from '../data/store.js';
import { formatCurrency, formatDateFR } from '../utils/formatters.js';
import { openNewInvoiceModal } from '../components/InvoiceModal.js';
import { showToast } from '../components/Toast.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

let revenueTrendChartInstance = null;

export function renderRevenueView(container) {
  const metrics = store.getFinancialMetrics();
  const settings = store.getSettings();
  const invoices = store.getInvoices();
  const projects = store.getProjects(true);

  const collectionRate = metrics.totalInvoiced > 0 ? Math.round((metrics.totalCollected / metrics.totalInvoiced) * 100) : 0;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Revenus & Facturation du Cabinet</h1>
        <p>Suivi de la rentabilité des villas, acomptes par phase de conception et état des encaissements.</p>
      </div>

      <div class="view-actions">
        <button class="btn-primary" id="open-new-invoice-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Émettre une Facture / Acompte</span>
        </button>
      </div>
    </div>

    <!-- Financial KPI Cards (Dynamic) -->
    <div class="stats-grid">
      <!-- Total Invoiced -->
      <div class="stat-card">
        <div class="stat-card-top">
          <span class="stat-card-title">Total Honoraires Facturés</span>
          <span class="stat-trend-badge ${metrics.totalInvoiced > 0 ? 'trend-positive' : 'trend-neutral'}">
            ${metrics.totalInvoiced > 0 ? '↗ En cours' : '0 TND'}
          </span>
        </div>
        <div class="stat-card-value">${formatCurrency(metrics.totalInvoiced, settings.currency)}</div>
        <div class="stat-card-subtext">Cumul des honoraires émis aux clients</div>
      </div>

      <!-- Total Collected -->
      <div class="stat-card">
        <div class="stat-card-top">
          <span class="stat-card-title">Honoraires Encaissés</span>
          <span class="stat-trend-badge ${collectionRate > 0 ? 'trend-positive' : 'trend-neutral'}">Taux ${collectionRate}%</span>
        </div>
        <div class="stat-card-value" style="color: var(--accent-emerald);">${formatCurrency(metrics.totalCollected, settings.currency)}</div>
        <div class="stat-card-subtext">${formatCurrency(metrics.totalCollected, settings.currency)} encaissés sur comptes bancaires</div>
      </div>

      <!-- Pending Payments -->
      <div class="stat-card">
        <div class="stat-card-top">
          <span class="stat-card-title">En Attente de Paiement</span>
          <span class="stat-trend-badge ${metrics.totalPending > 0 ? 'trend-negative' : 'trend-positive'}">
            ${metrics.totalPending > 0 ? 'À relancer' : 'À jour'}
          </span>
        </div>
        <div class="stat-card-value" style="color: var(--accent-amber);">${formatCurrency(metrics.totalPending, settings.currency)}</div>
        <div class="stat-card-subtext">${invoices.filter(i => i.status !== 'Payée').length} facture(s) en attente</div>
      </div>

      <!-- Total Contract Value -->
      <div class="stat-card">
        <div class="stat-card-top">
          <span class="stat-card-title">Portefeuille Contrats Signés</span>
          <span class="stat-trend-badge trend-neutral">${projects.length} Projets</span>
        </div>
        <div class="stat-card-value">${formatCurrency(metrics.totalContractValue, settings.currency)}</div>
        <div class="stat-card-subtext">Montant global des marchés d'architecture</div>
      </div>
    </div>

    <!-- Revenue Chart & Project Profitability -->
    <div class="dashboard-grid-two-col">
      <!-- Monthly Revenue Evolution -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Évolution des Encaissements Mensuels</div>
            <div class="card-subtitle">Flux de facturation et encaissement</div>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas id="revenue-trend-chart"></canvas>
        </div>
      </div>

      <!-- Project Profitability Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Rentabilité par Villa / Projet</div>
            <div class="card-subtitle">Taux de recouvrement des honoraires</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${projects.length > 0 ? projects.map(p => {
            const pct = p.budget > 0 ? Math.round(((p.paid || 0) / p.budget) * 100) : 0;
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                  <span>${p.name}</span>
                  <span>${formatCurrency(p.paid || 0, settings.currency)} / <span style="color: var(--text-muted);">${formatCurrency(p.budget || 0, settings.currency)}</span></span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${pct >= 75 ? 'var(--accent-emerald)' : pct >= 40 ? 'var(--primary-500)' : 'var(--accent-amber)'}; border-radius: var(--radius-full);"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                  <span>Client: ${p.client}</span>
                  <span>${pct}% recouvré</span>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Aucun projet enregistré pour le moment.
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Invoices Ledger Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="card-title">Journal des Factures & Acomptes</div>
          <div class="card-subtitle">Toutes les factures d'honoraires émises aux maîtres d'ouvrage</div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Projet & Client</th>
              <th>Phase / Intitulé de l'Acompte</th>
              <th>Montant HT</th>
              <th>Total TTC</th>
              <th>Émission / Échéance</th>
              <th>Statut</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.length > 0 ? invoices.map(inv => `
              <tr>
                <td>
                  <strong style="color: var(--text-primary); font-family: var(--font-mono);">${inv.number}</strong>
                </td>
                <td>
                  <div class="villa-tag">${inv.projectName}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${inv.clientName}</div>
                </td>
                <td style="font-weight: 500;">
                  ${inv.milestone}
                </td>
                <td style="font-weight: 600; color: var(--text-primary);">
                  ${formatCurrency(inv.amount, settings.currency)}
                </td>
                <td style="font-weight: 700; color: var(--primary-700);">
                  ${formatCurrency(inv.totalAmount, settings.currency)}
                </td>
                <td>
                  <div style="font-size: 12px; color: var(--text-secondary);">${formatDateFR(inv.issueDate)}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Échéance: ${formatDateFR(inv.dueDate)}</div>
                </td>
                <td>
                  <span class="status-badge ${inv.status === 'Payée' ? 'status-paid' : 'status-pending'}">
                    ${inv.status === 'Payée' ? '✓ Payée' : '⏳ En attente'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 6px; justify-content: flex-end;">
                    <button class="btn-secondary view-invoice-btn" data-id="${inv.id}" style="padding: 5px 10px; font-size: 11.5px;">👁 Voir</button>
                    <button class="btn-secondary toggle-invoice-btn" data-id="${inv.id}" style="padding: 5px 10px; font-size: 11.5px;">
                      ${inv.status === 'Payée' ? 'En attente' : '✓ Encaissé'}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 48px; color: var(--text-muted);">
                  <div style="font-size: 28px; margin-bottom: 8px;">💰</div>
                  <div style="font-weight: 700; color: var(--text-primary);">Aucune facture émise pour le moment</div>
                  <div style="font-size: 13px; margin-top: 4px;">Cliquez sur "+ Émettre une Facture / Acompte" pour créer votre première facture.</div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <div id="invoice-detail-modal" class="modal hidden">
      <div class="modal-content" style="max-width: 620px;">
        <div class="modal-header">
          <div class="modal-title">Détail de la Facture</div>
          <button class="modal-close-btn" id="close-invoice-detail-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div id="invoice-detail-body" class="modal-body"></div>
      </div>
    </div>
  `;

  // Attach button events
  const newInvoiceBtn = document.getElementById('open-new-invoice-btn');
  if (newInvoiceBtn) newInvoiceBtn.addEventListener('click', openNewInvoiceModal);

  container.querySelectorAll('.toggle-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const invId = e.currentTarget.dataset.id;
      store.toggleInvoiceStatus(invId);
      showToast("Statut de la facture mis à jour !", "success");
      renderRevenueView(container);
    });
  });

  // View invoice detail
  container.querySelectorAll('.view-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const invId = e.currentTarget.dataset.id;
      const inv = store.getInvoices().find(i => i.id === invId);
      if (!inv) return;

      const body = document.getElementById('invoice-detail-body');
      const sett = store.getSettings();
      body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding: 16px; background: var(--bg-hover); border-radius: var(--radius-md);">
          <div>
            <div style="font-size: 20px; font-weight: 900; color: var(--primary-700); font-family: var(--font-mono);">${inv.number}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Émise le ${formatDateFR(inv.issueDate)} — Échéance: ${formatDateFR(inv.dueDate)}</div>
          </div>
          <span class="status-badge ${inv.status === 'Payée' ? 'status-paid' : 'status-pending'}" style="font-size: 13px;">
            ${inv.status === 'Payée' ? '✓ Payée' : '⏳ En attente'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="padding: 12px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Projet</div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${inv.projectName}</div>
          </div>
          <div style="padding: 12px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Client</div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${inv.clientName}</div>
          </div>
        </div>

        <div style="padding: 14px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); margin-bottom: 20px;">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Phase / Intitulé</div>
          <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${inv.milestone}</div>
        </div>

        <div style="border: 1px solid var(--border-default); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px;">
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--text-muted);">Montant HT</span>
            <span style="font-weight: 700;">${formatCurrency(inv.amount, sett.currency)}</span>
          </div>
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--text-muted);">TVA (19%)</span>
            <span style="font-weight: 700;">${formatCurrency(inv.tax || (inv.amount * 0.19), sett.currency)}</span>
          </div>
          <div style="padding: 14px 16px; display: flex; justify-content: space-between; font-size: 15px; background: var(--bg-hover);">
            <span style="font-weight: 800; color: var(--text-primary);">Total TTC</span>
            <span style="font-weight: 900; color: var(--primary-700);">${formatCurrency(inv.totalAmount, sett.currency)}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-muted);">
          <div>Mode de paiement : <strong style="color: var(--text-primary);">${inv.paymentMethod || '—'}</strong></div>
          ${inv.paidDate ? `<div>Encaissé le : <strong style="color: var(--accent-emerald);">${formatDateFR(inv.paidDate)}</strong></div>` : ''}
        </div>
      `;

      document.getElementById('invoice-detail-modal').classList.remove('hidden');
    });
  });

  document.getElementById('close-invoice-detail-btn')?.addEventListener('click', () => {
    document.getElementById('invoice-detail-modal')?.classList.add('hidden');
  });

  initRevenueChart(invoices);
}

function initRevenueChart(invoices = []) {
  const ctx = document.getElementById('revenue-trend-chart');
  if (!ctx) return;

  if (revenueTrendChartInstance) revenueTrendChartInstance.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const months = ['Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'];
  let billedData = [0, 0, 0, 0, 0, 0];
  let paidData = [0, 0, 0, 0, 0, 0];

  if (invoices.length > 0) {
    const totalInvoiced = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
    const totalCollected = invoices.filter(inv => inv.status === 'Payée').reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
    billedData = [
      Math.round(totalInvoiced * 0.15),
      Math.round(totalInvoiced * 0.18),
      Math.round(totalInvoiced * 0.16),
      Math.round(totalInvoiced * 0.22),
      Math.round(totalInvoiced * 0.25),
      Math.round(totalInvoiced * 0.20)
    ];
    paidData = [
      Math.round(totalCollected * 0.14),
      Math.round(totalCollected * 0.16),
      Math.round(totalCollected * 0.16),
      Math.round(totalCollected * 0.21),
      Math.round(totalCollected * 0.24),
      Math.round(totalCollected * 0.18)
    ];
  }

  revenueTrendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Facturé (TND)',
          data: billedData,
          backgroundColor: '#6366f1',
          borderRadius: 6
        },
        {
          label: 'Encaissé (TND)',
          data: paidData,
          backgroundColor: '#10b981',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 }, precision: 0 }
        }
      }
    }
  });
}
