/**
 * Top Header Navigation Component with Role Badge, User Switcher, Universal Search trigger, and Punch clock
 */
import { store } from '../data/store.js';
import { openAuthModal } from './AuthModal.js';

export function renderHeader() {
  const container = document.getElementById('header-container');
  if (!container) return;

  const presence = store.getPresence();
  const currentUser = store.getCurrentUser();
  const isAdmin = store.isAdmin();

  container.innerHTML = `
    <div class="header-left">
      <button class="mobile-menu-btn" id="mobile-menu-toggle" aria-label="Ouvrir le menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <!-- Global Search Trigger -->
      <button class="global-search-trigger" id="open-global-search-btn" title="Recherche universelle (Ctrl+K ou ⌘K)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="search-label-text">${isAdmin ? 'Rechercher collaborateur, villa, client, date...' : 'Rechercher mes villas, mes dates, tâches...'}</span>
        <span class="search-shortcut-badge">⌘K</span>
      </button>
    </div>

    <div class="header-right">
      <!-- Role & User Switcher Selector Pill -->
      <div class="role-selector-pill" id="header-user-switcher" title="Changer de collaborateur ou déverrouiller l'accès Boss">
        <span style="font-size: 13px;">${isAdmin ? '👑' : '👷'}</span>
        <span class="role-pill-text">${isAdmin ? 'Mode Boss (Admin)' : currentUser.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <!-- Presence Punch Clock Pill -->
      <div class="presence-punch-badge" id="header-presence-toggle" title="Cliquer pour pointer Entrée / Sortie">
        <span class="presence-dot"></span>
        <span class="presence-text">${presence.activePunchedIn ? `Pointé (${presence.lastPunchTime})` : 'Pointé Sortie'}</span>
      </div>

      <!-- Quick Action: New Daily Report -->
      <button class="btn-primary" id="header-new-report-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="btn-text-full">+ Fiche Journalière</span>
      </button>

      <!-- Theme Switcher -->
      <button class="action-icon-btn" id="theme-toggle-btn" title="Basculer Mode Clair / Sombre">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
    </div>
  `;

  // Attach User Switcher modal trigger
  const userSwitcher = document.getElementById('header-user-switcher');
  if (userSwitcher) {
    userSwitcher.addEventListener('click', () => {
      openAuthModal('switch');
    });
  }
}
