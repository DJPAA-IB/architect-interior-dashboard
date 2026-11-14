/**
 * Main Application Orchestrator & Router (Architect Interior Dashboard)
 */
import { store } from './data/store.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { openSearchModal, closeSearchModal } from './components/SearchModal.js';
import { openNewReportModal, closeNewReportModal } from './components/ReportModal.js';
import { closeReportDetailModal } from './components/OfficialReportSheet.js';
import { closeNewInvoiceModal } from './components/InvoiceModal.js';
import { openAuthModal, closeAuthModal, requireAdminAuth } from './components/AuthModal.js';
import { showToast } from './components/Toast.js';

// Views
import { renderDashboardView } from './views/DashboardView.js';
import { renderReportsView } from './views/ReportsView.js';
import { renderProjectsView } from './views/ProjectsView.js';
import { renderRevenueView } from './views/RevenueView.js';
import { renderTeamView } from './views/TeamView.js';
import { renderClientsView } from './views/ClientsView.js';
import { renderAnalyticsView } from './views/AnalyticsView.js';
import { renderSettingsView } from './views/SettingsView.js';

// Lucide icon helper
import { createIcons, icons } from 'lucide';

function hydrateIcons() {
  createIcons({ icons });
}

let currentRoute = 'dashboard';

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  const validRoutes = ['dashboard', 'reports', 'projects', 'revenue', 'team', 'clients', 'analytics', 'settings'];
  return validRoutes.includes(hash) ? hash : 'dashboard';
}

function navigateTo(route) {
  const adminOnlyRoutes = ['revenue', 'clients', 'settings'];
  if (adminOnlyRoutes.includes(route) && !store.isAdmin()) {
    requireAdminAuth(() => {
      currentRoute = route;
      window.location.hash = route;
      renderApp();
    });
    return;
  }

  currentRoute = route;
  window.location.hash = route;
  renderApp();
}

function renderApp() {
  const requestedRoute = getRouteFromHash();
  const adminOnlyRoutes = ['revenue', 'clients', 'settings'];

  // Route Guard: if worker visits admin route directly via URL
  if (adminOnlyRoutes.includes(requestedRoute) && !store.isAdmin()) {
    currentRoute = 'dashboard';
    window.location.hash = 'dashboard';
    renderApp();
    requireAdminAuth(() => {
      currentRoute = requestedRoute;
      window.location.hash = requestedRoute;
      renderApp();
    });
    return;
  }

  currentRoute = requestedRoute;

  // Render Shell
  renderSidebar(currentRoute);
  renderHeader();

  // Render Active View
  const viewContainer = document.getElementById('view-container');
  if (viewContainer) {
    switch (currentRoute) {
      case 'dashboard':
        renderDashboardView(viewContainer);
        break;
      case 'reports':
        renderReportsView(viewContainer);
        break;
      case 'projects':
        renderProjectsView(viewContainer);
        break;
      case 'revenue':
        renderRevenueView(viewContainer);
        break;
      case 'team':
        renderTeamView(viewContainer);
        break;
      case 'clients':
        renderClientsView(viewContainer);
        break;
      case 'analytics':
        renderAnalyticsView(viewContainer);
        break;
      case 'settings':
        renderSettingsView(viewContainer);
        break;
      default:
        renderDashboardView(viewContainer);
    }
  }

  // Hydrate Lucide Icons
  hydrateIcons();
  attachGlobalEvents();
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar-container');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('active');
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar-container');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (backdrop) backdrop.classList.add('active');
}

function attachGlobalEvents() {
  // Navigation links
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileSidebar();
      const route = e.currentTarget.dataset.route;
      if (route) {
        navigateTo(route);
      }
    });
  });

  // Global search trigger button in header
  const searchBtn = document.getElementById('open-global-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => openSearchModal(''));
  }

  // Header quick new report button
  const headerReportBtn = document.getElementById('header-new-report-btn');
  if (headerReportBtn) {
    headerReportBtn.addEventListener('click', openNewReportModal);
  }

  // Header punch clock toggle
  const headerPunchBadge = document.getElementById('header-presence-toggle');
  if (headerPunchBadge) {
    headerPunchBadge.addEventListener('click', () => {
      const presence = store.togglePresence();
      showToast(presence.activePunchedIn ? "Pointage Entrée confirmé !" : "Pointage Sortie enregistré !", "success");
      renderApp();
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      showToast(`Mode ${newTheme === 'dark' ? 'Sombre' : 'Clair'} activé`, 'info');
      renderApp();
    });
  }

  // Mobile menu toggle button
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar-container');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  // Mobile backdrop click to close
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }
}

// Global Keyboard Shortcuts (Cmd+K / Ctrl+K, Escape)
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openSearchModal('');
  }

  if (e.key === 'Escape') {
    closeMobileSidebar();
    closeSearchModal();
    closeReportDetailModal();
    closeNewReportModal();
    closeNewInvoiceModal();
    closeAuthModal();
  }
});

// Auto-close mobile drawer on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeMobileSidebar();
  }
});

// Window Hash change listener
window.addEventListener('hashchange', () => {
  renderApp();
});

// React to Store Updates
store.subscribe(() => {
  renderApp();
});

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
