/**
 * Universal Multi-Criteria Global Search Modal Component
 * Filters instantaneously across Workers, Villas/Projects, Clients, Dates, Reports, and Invoices.
 */
import { store } from '../data/store.js';
import { formatCurrency, formatDateFR } from '../utils/formatters.js';
import { openReportDetailModal } from './OfficialReportSheet.js';

let activeCategory = 'all';

export function openSearchModal(initialQuery = '') {
  const modal = document.getElementById('global-search-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  renderSearchModalContent(initialQuery);

  const input = document.getElementById('global-search-input');
  if (input) {
    input.value = initialQuery;
    input.focus();
  }
}

export function closeSearchModal() {
  const modal = document.getElementById('global-search-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderSearchModalContent(query = '') {
  const modal = document.getElementById('global-search-modal');
  if (!modal) return;

  const results = store.searchAll(query);
  const totalResults = results.reports.length + results.projects.length + results.workers.length + results.clients.length + results.invoices.length;

  modal.innerHTML = `
    <div class="search-palette" id="search-palette-box">
      <div class="search-palette-input-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="global-search-input" 
          class="search-palette-input" 
          placeholder="Rechercher par collaborateur, villa, client, date (ex: 12/08/2026, Elloumi, Piscine)..." 
          value="${query}"
          autocomplete="off"
        />
        <button class="modal-close-btn" id="close-search-modal-btn" title="Fermer (Échap)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Quick Category Filter Chips -->
      <div style="display: flex; gap: 8px; padding: 10px 16px; background: var(--bg-hover); border-bottom: 1px solid var(--border-default); overflow-x: auto;">
        <button class="btn-secondary filter-chip ${activeCategory === 'all' ? 'active' : ''}" data-cat="all" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          Tous (${query ? totalResults : 'Tous'})
        </button>
        <button class="btn-secondary filter-chip ${activeCategory === 'reports' ? 'active' : ''}" data-cat="reports" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          📄 Rapports (${results.reports.length})
        </button>
        <button class="btn-secondary filter-chip ${activeCategory === 'projects' ? 'active' : ''}" data-cat="projects" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          🏛️ Villas (${results.projects.length})
        </button>
        <button class="btn-secondary filter-chip ${activeCategory === 'workers' ? 'active' : ''}" data-cat="workers" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          👷 Collaborateurs (${results.workers.length})
        </button>
        <button class="btn-secondary filter-chip ${activeCategory === 'clients' ? 'active' : ''}" data-cat="clients" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          💼 Clients (${results.clients.length})
        </button>
        <button class="btn-secondary filter-chip ${activeCategory === 'invoices' ? 'active' : ''}" data-cat="invoices" style="padding: 4px 10px; font-size: 12px; border-radius: var(--radius-full);">
          💰 Factures (${results.invoices.length})
        </button>
      </div>

      <div class="search-results-list" id="search-results-container">
        ${renderSearchResultsBody(query, results)}
      </div>

      <div style="padding: 10px 16px; background: var(--bg-hover); border-top: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted);">
        <span>Astuce : Tapez un nom de villa (ex: "Bechir"), d'architecte (ex: "Elloumi") ou une date (ex: "12/08/2026")</span>
        <span>Échap pour fermer</span>
      </div>
    </div>
  `;

  attachSearchEvents();
}

function renderSearchResultsBody(query, results) {
  if (!query) {
    return `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Recherche Globale Intelligente</div>
        <div style="font-size: 13px;">Recherchez par nom d'architecte, de villa, de client, date de rapport, ou mot-clé technique (ex: <em>piscine</em>, <em>faux plafond</em>, <em>marbre</em>).</div>
      </div>
    `;
  }

  const total = results.reports.length + results.projects.length + results.workers.length + results.clients.length + results.invoices.length;
  if (total === 0) {
    return `
      <div style="padding: 32px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 24px; margin-bottom: 8px;">📂</div>
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Aucun résultat pour "${query}"</div>
        <div style="font-size: 13px;">Essayez d'autres mots-clés ou vérifiez l'orthographe.</div>
      </div>
    `;
  }

  let html = '';

  // 1. Daily Reports
  if ((activeCategory === 'all' || activeCategory === 'reports') && results.reports.length > 0) {
    html += `
      <div class="search-result-group-title">Rapports Journaliers (${results.reports.length})</div>
      ${results.reports.map(r => `
        <div class="search-result-item" data-action="view-report" data-id="${r.id}">
          <div class="search-result-icon">📄</div>
          <div class="search-result-meta">
            <div class="search-result-title">
              <strong>${r.displayDate}</strong> — ${r.projectName} (${r.workerName})
              <span class="status-badge ${r.status === 'Validé' ? 'status-validated' : 'status-pending'}" style="font-size: 10px; padding: 1px 6px; margin-left: 6px;">${r.status}</span>
            </div>
            <div class="search-result-subtitle">
              ${r.activities.map(a => a.activity).join(' • ')} | Réalisations: ${(r.summary.achievements || '').slice(0, 70)}...
            </div>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: var(--primary-600);">${r.totalHours}h</div>
        </div>
      `).join('')}
    `;
  }

  // 2. Projects / Villas
  if ((activeCategory === 'all' || activeCategory === 'projects') && results.projects.length > 0) {
    html += `
      <div class="search-result-group-title">Villas & Chantiers (${results.projects.length})</div>
      ${results.projects.map(p => `
        <div class="search-result-item" data-action="view-project" data-id="${p.id}">
          <div class="search-result-icon" style="background: var(--accent-emerald-bg); color: var(--accent-emerald);">🏛️</div>
          <div class="search-result-meta">
            <div class="search-result-title">
              <strong>${p.name}</strong> • Client: ${p.client}
            </div>
            <div class="search-result-subtitle">
              ${p.location} • Phase: ${p.stage} • Avancement: ${p.progress}%
            </div>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: var(--text-primary);">${formatCurrency(p.budget)}</div>
        </div>
      `).join('')}
    `;
  }

  // 3. Workers / Architects
  if ((activeCategory === 'all' || activeCategory === 'workers') && results.workers.length > 0) {
    html += `
      <div class="search-result-group-title">Collaborateurs & Architectes (${results.workers.length})</div>
      ${results.workers.map(w => `
        <div class="search-result-item" data-action="view-worker" data-id="${w.id}">
          <div class="user-avatar" style="width: 32px; height: 32px; font-size: 11px;">${w.avatar}</div>
          <div class="search-result-meta">
            <div class="search-result-title">
              <strong>${w.name}</strong> — ${w.role}
            </div>
            <div class="search-result-subtitle">${w.email} • Statut: ${w.status === 'in_studio' ? 'En Studio' : 'Sur Chantier'}</div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${w.totalHoursMonth}h ce mois</div>
        </div>
      `).join('')}
    `;
  }

  // 4. Clients
  if ((activeCategory === 'all' || activeCategory === 'clients') && results.clients.length > 0) {
    html += `
      <div class="search-result-group-title">Clients (${results.clients.length})</div>
      ${results.clients.map(c => `
        <div class="search-result-item" data-action="view-client" data-id="${c.id}">
          <div class="search-result-icon" style="background: var(--accent-purple-bg); color: var(--accent-purple);">💼</div>
          <div class="search-result-meta">
            <div class="search-result-title">
              <strong>${c.name}</strong> (${c.company})
            </div>
            <div class="search-result-subtitle">${c.city} • Tél: ${c.phone} • Facturé: ${formatCurrency(c.totalBilled)}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  // 5. Invoices
  if ((activeCategory === 'all' || activeCategory === 'invoices') && results.invoices.length > 0) {
    html += `
      <div class="search-result-group-title">Factures & Honoraires (${results.invoices.length})</div>
      ${results.invoices.map(i => `
        <div class="search-result-item" data-action="view-invoice" data-id="${i.id}">
          <div class="search-result-icon" style="background: var(--accent-amber-bg); color: var(--accent-amber);">💰</div>
          <div class="search-result-meta">
            <div class="search-result-title">
              <strong>${i.number}</strong> — ${i.projectName} (${i.milestone})
            </div>
            <div class="search-result-subtitle">Émise le ${formatDateFR(i.issueDate)} • Statut: ${i.status}</div>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: ${i.status === 'Payée' ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
            ${formatCurrency(i.totalAmount)}
          </div>
        </div>
      `).join('')}
    `;
  }

  return html;
}

function attachSearchEvents() {
  const input = document.getElementById('global-search-input');
  const closeBtn = document.getElementById('close-search-modal-btn');
  const modal = document.getElementById('global-search-modal');
  const resultsContainer = document.getElementById('search-results-container');

  if (input) {
    input.addEventListener('input', (e) => {
      const q = e.target.value;
      const results = store.searchAll(q);
      if (resultsContainer) {
        resultsContainer.innerHTML = renderSearchResultsBody(q, results);
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSearchModal);
  }

  // Category filter chips
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeCategory = e.currentTarget.dataset.cat;
      renderSearchModalContent(input ? input.value : '');
    });
  });

  // Result items click delegate
  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;

      const action = item.dataset.action;
      const id = item.dataset.id;

      closeSearchModal();

      if (action === 'view-report') {
        openReportDetailModal(id);
      } else if (action === 'view-project') {
        window.location.hash = 'projects';
      } else if (action === 'view-worker') {
        window.location.hash = 'team';
      } else if (action === 'view-client') {
        window.location.hash = 'clients';
      } else if (action === 'view-invoice') {
        window.location.hash = 'revenue';
      }
    });
  }
}
