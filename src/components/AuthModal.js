/**
 * Authentication, User Switcher & Admin Passcode Modal
 * Protects Admin access with a password and allows workers to switch easily.
 */
import { store } from '../data/store.js';
import { showToast } from './Toast.js';

let activeCallback = null;
let currentMode = 'switch'; // 'switch' or 'admin-prompt'

export function openAuthModal(mode = 'switch', callback = null) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  currentMode = mode;
  activeCallback = callback;
  modal.classList.remove('hidden');
  renderAuthModal();
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  activeCallback = null;
}

export function requireAdminAuth(callback) {
  if (store.isAdmin()) {
    if (typeof callback === 'function') callback();
    return true;
  }
  openAuthModal('admin-prompt', callback);
  return false;
}

function renderAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  const workers = store.getWorkers();
  const currentUser = store.getCurrentUser();
  const isAdmin = store.isAdmin();

  if (currentMode === 'admin-prompt') {
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px; padding: 28px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 54px; height: 54px; background: var(--primary-50); border: 2px solid var(--primary-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; font-size: 24px;">
            🔒
          </div>
          <h2 style="font-size: 19px; font-weight: 800; color: var(--text-primary);">Accès Administrateur / Boss</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Cette section est réservée à l'architecte principal. Veuillez saisir le mot de passe d'administration.
          </p>
        </div>

        <form id="admin-passcode-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="admin-pass-input">Mot de passe Studio</label>
            <input 
              type="password" 
              id="admin-pass-input" 
              class="form-control" 
              placeholder="••••••••" 
              required 
              autofocus 
            />
          </div>

          <div id="admin-auth-error" style="display: none; font-size: 12.5px; color: var(--accent-rose); background: var(--accent-rose-bg); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--accent-rose-border);">
            Mot de passe incorrect. Veuillez réessayer.
          </div>

          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button type="button" class="btn-secondary" id="cancel-auth-modal-btn" style="flex: 1; justify-content: center;">
              Annuler
            </button>
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">
              <span>Déverrouiller</span>
            </button>
          </div>
        </form>
      </div>
    `;
  } else {
    // Switch User Mode
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px; padding: 26px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">Changer de Collaborateur / Rôle</h2>
            <p style="font-size: 12.5px; color: var(--text-muted);">Chaque collaborateur accède uniquement à ses projets et fiches.</p>
          </div>
          <button class="modal-close-btn" id="cancel-auth-modal-btn" title="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
          <!-- 1. Admin (Boss) Option -->
          <div class="user-select-row ${isAdmin ? 'active-user' : ''}" id="select-admin-user" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-hover); border: 1px solid ${isAdmin ? 'var(--primary-500)' : 'var(--border-default)'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="user-avatar" style="width: 38px; height: 38px; font-size: 18px; background: var(--primary-100); color: var(--primary-700);">
                👑
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">ARCHITECTE EN CHEF (BOSS)</div>
                <div style="font-size: 11.5px; color: var(--text-muted);">Administration Globale, Trésorerie & Validation (Protégé 🔒)</div>
              </div>
            </div>
            <div>
              ${isAdmin ? '<span class="status-badge status-validated" style="font-size: 11px;">Connecté</span>' : '<span style="font-size: 11.5px; color: var(--primary-600); font-weight: 600;">Code requis →</span>'}
            </div>
          </div>

          <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 6px 0 2px 2px;">
            Collaborateurs de l'Atelier
          </div>

          <!-- 2. Workers List -->
          ${workers.map(w => {
            const isCurrent = !isAdmin && currentUser.id === w.id;
            return `
              <div class="user-select-row ${isCurrent ? 'active-user' : ''} worker-select-btn" data-id="${w.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-hover); border: 1px solid ${isCurrent ? 'var(--primary-500)' : 'var(--border-default)'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 13px;">
                    ${w.avatar}
                  </div>
                  <div>
                    <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${w.name}</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">${w.role} • ${w.activeProjectsCount || 2} projets assignés</div>
                  </div>
                </div>
                <div>
                  ${isCurrent ? '<span class="status-badge status-validated" style="font-size: 11px;">Actif</span>' : '<span style="font-size: 11.5px; color: var(--text-secondary); font-weight: 600;">Sélectionner →</span>'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  attachAuthEvents();
}

function attachAuthEvents() {
  // Cancel button
  const cancelBtn = document.getElementById('cancel-auth-modal-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAuthModal);
  }

  // Admin passcode form submission
  const adminForm = document.getElementById('admin-passcode-form');
  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('admin-pass-input');
      const errBox = document.getElementById('admin-auth-error');
      const pass = input ? input.value : '';

      const res = store.loginAsAdmin(pass);
      if (res.success) {
        showToast("Session Administrateur déverrouillée !", "success");
        closeAuthModal();
        if (typeof activeCallback === 'function') {
          activeCallback();
        }
      } else {
        if (errBox) {
          errBox.style.display = 'block';
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    });
  }

  // Switch mode: Select Admin
  const selectAdmin = document.getElementById('select-admin-user');
  if (selectAdmin) {
    selectAdmin.addEventListener('click', () => {
      currentMode = 'admin-prompt';
      renderAuthModal();
    });
  }

  // Switch mode: Select Worker
  document.querySelectorAll('.worker-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const workerId = e.currentTarget.dataset.id;
      const res = store.loginAsWorker(workerId);
      if (res.success) {
        showToast(`Connecté en tant que ${res.worker.name} !`, "info");
        closeAuthModal();
        window.location.hash = 'dashboard';
      }
    });
  });
}
