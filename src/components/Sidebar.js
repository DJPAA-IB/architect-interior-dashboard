/**
 * Sidebar Navigation Component with Role-Based Access Control (Admin Boss vs Worker)
 */
import { store } from '../data/store.js';
import { openAuthModal } from './AuthModal.js';

export function renderSidebar(activeRoute = 'dashboard') {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const currentUser = store.getCurrentUser();
  const isAdmin = store.isAdmin();
  const metrics = store.getFinancialMetrics();

  // Navigation Items defined according to user role
  const navItems = isAdmin ? [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'layout-dashboard' },
    { id: 'reports', label: 'Rapports Journaliers', icon: 'file-text', badge: metrics.pendingReportsCount > 0 ? metrics.pendingReportsCount : null },
    { id: 'projects', label: 'Villas & Projets', icon: 'home' },
    { id: 'revenue', label: 'Revenus & Factures', icon: 'dollar-sign' },
    { id: 'team', label: 'Équipe & Pointage', icon: 'users' },
    { id: 'clients', label: 'Répertoire Clients', icon: 'user-check' },
    { id: 'analytics', label: 'Analyses & Délais', icon: 'bar-chart-3' },
    { id: 'settings', label: 'Paramètres Studio', icon: 'settings' }
  ] : [
    { id: 'dashboard', label: 'Mon Espace Travail', icon: 'layout-dashboard' },
    { id: 'reports', label: 'Mes Fiches Journalières', icon: 'file-text' },
    { id: 'projects', label: 'Mes Villas Assignées', icon: 'home' },
    { id: 'team', label: 'Mon Pointage & Présence', icon: 'clock' },
    { id: 'analytics', label: 'Mes Analyses & Temps', icon: 'bar-chart-3' }
  ];

  container.innerHTML = `
    <div class="sidebar-header">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 100" fill="none" style="height: 42px; width: auto; max-width: 200px; color: var(--text-primary);" aria-label="Architect Interior Dashboard">
          <!-- Generic house / interior icon -->
          <rect x="16" y="22" width="56" height="56" rx="12" fill="#85368a" />
          <path d="M30 52 L44 39 L58 52 M34 48 L34 64 L54 64 L54 48" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Wordmark -->
          <text x="88" y="56" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-size="26" font-weight="700" fill="currentColor" letter-spacing="1.5">architect studio</text>
          <!-- Subtitle -->
          <text x="89" y="78" font-family="'Plus Jakarta Sans', 'Inter', sans-serif" font-size="10.5" font-weight="600" fill="currentColor" letter-spacing="1.2" opacity="0.75">architecture d'int\u00e9rieur</text>
        </svg>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Fermer le menu" title="Fermer le menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="sidebar-nav">
      <div class="nav-section-title">${isAdmin ? 'Administration Globale' : 'Espace Collaborateur'}</div>
      ${navItems.map(item => `
        <a href="#${item.id}" class="nav-item ${activeRoute === item.id ? 'active' : ''}" data-route="${item.id}">
          <span class="nav-item-icon" data-lucide="${item.icon}"></span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-item-badge">${item.badge}</span>` : ''}
        </a>
      `).join('')}
    </div>

    <div class="sidebar-footer">
      <!-- Quick User / Role Switch Button -->
      <div style="margin-bottom: 8px;">
        <button id="sidebar-auth-switch-btn" class="btn-secondary" style="width: 100%; font-size: 11.5px; padding: 7px 8px; justify-content: center; border-style: dashed; background: var(--bg-hover);">
          <span>${isAdmin ? '🔒 Verrouiller / Changer de profil' : '👑 Déverrouiller Mode Boss'}</span>
        </button>
      </div>

      <div class="user-quick-profile" id="sidebar-user-card" style="cursor: pointer;" title="Cliquer pour changer de profil">
        <div class="user-avatar">${currentUser.avatar}</div>
        <div class="user-meta" style="overflow: hidden;">
          <div class="user-meta-name" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${currentUser.name}</div>
          <div class="user-meta-role">${currentUser.role}</div>
        </div>
      </div>
    </div>
  `;

  // Attach mobile close button event
  const closeBtn = document.getElementById('sidebar-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const sb = document.getElementById('sidebar-container');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sb) sb.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
    });
  }

  // Attach auth switcher events
  const switchBtn = document.getElementById('sidebar-auth-switch-btn');
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      openAuthModal(isAdmin ? 'switch' : 'admin-prompt');
    });
  }

  const userCard = document.getElementById('sidebar-user-card');
  if (userCard) {
    userCard.addEventListener('click', () => {
      openAuthModal('switch');
    });
  }
}
