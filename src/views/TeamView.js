/**
 * Team & Attendance / Pointage View (Gestion des Collaborateurs & Pointage)
 */
import { store } from '../data/store.js';
import { showToast } from '../components/Toast.js';

export function renderTeamView(container) {
  const isAdmin = store.isAdmin();
  const workers = store.getWorkers();
  const presence = store.getPresence();
  const currentUser = store.getCurrentUser();
  const allReports = store.getDailyReports(true);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${isAdmin ? "Équipe & Pointage Journalier" : `Mon Pointage & Présence Studio (${currentUser.name})`}</h1>
        <p>${isAdmin ? "Présence en temps réel au studio ou sur les chantiers, pointage des heures et registre des architectes." : "Enregistrez votre pointage d'arrivée et de départ au studio ou sur chantier."}</p>
      </div>

      <div class="view-actions">
        ${isAdmin ? `
          <button class="btn-secondary" id="team-punch-btn">
            <span class="presence-dot" style="background: currentColor; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
            <span>${presence.activePunchedIn ? 'Pointer ma Sortie' : 'Pointer mon Entrée'}</span>
          </button>
          <button class="btn-primary" id="open-add-worker-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Ajouter un Collaborateur</span>
          </button>
        ` : `
          <button class="btn-primary" id="team-punch-btn">
            <span></span>
            <span>${presence.activePunchedIn ? 'Pointer ma Sortie' : 'Pointer mon Entrée'}</span>
          </button>
        `}
      </div>
    </div>

    <!-- Live Studio Presence Board Banner -->
    <div class="card" style="margin-bottom: 28px; background: var(--primary-gradient); color: #ffffff; border: none;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">
            Tableau de Pointage en Direct
          </div>
          <h2 style="font-size: 22px; font-weight: 800; margin-top: 4px;">
            ${workers.filter(w => w.status !== 'checked_out').length} Collaborateurs Actifs
          </h2>
          <div style="font-size: 13.5px; opacity: 0.85; margin-top: 4px;">
            ${workers.filter(w => w.status === 'in_studio').length} en Studio • ${workers.filter(w => w.status === 'on_site').length} en Visite de Chantier
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 14px 20px; border-radius: var(--radius-lg); border: 1px solid rgba(255, 255, 255, 0.2);">
          <div style="font-size: 11.5px; opacity: 0.9;">Votre statut (${currentUser.name}) :</div>
          <div style="font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; margin-top: 2px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${presence.activePunchedIn ? '#4ade80' : '#f87171'};"></span>
            ${presence.activePunchedIn ? `Pointé Entrée à ${presence.lastPunchTime}` : 'Pointé Sortie'}
          </div>
        </div>
      </div>
    </div>

    <!-- Workers Roster Grid -->
    ${workers.length === 0 ? `
      <div style="padding: 64px 24px; text-align: center; background: var(--bg-surface); border: 2px dashed var(--border-default); border-radius: var(--radius-lg);">
        <div style="font-size: 48px; margin-bottom: 16px;">👷</div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Aucun collaborateur enregistré</h3>
        <p style="font-size: 14px; color: var(--text-muted); max-width: 380px; margin: 0 auto 24px;">
          ${isAdmin ? 'Commencez par ajouter vos architectes et collaborateurs du studio.' : 'Aucun membre de l\'équipe n\'est encore enregistré dans le système.'}
        </p>
        ${isAdmin ? `<button class="btn-primary" id="open-add-worker-btn-empty">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Ajouter le premier collaborateur</span>
        </button>` : ''}
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 18px;">
        ${workers.map(w => {
          const workerReports = allReports.filter(r => r.workerId === w.id || r.workerName === w.name);
          const totalLoggedHours = workerReports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);
          const isCurrent = currentUser.id === w.id;

          return `
            <div class="card" style="${isCurrent ? 'border-color: var(--primary-500); box-shadow: 0 0 0 1px var(--primary-500);' : ''}">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                <div class="user-avatar" style="width: 46px; height: 46px; font-size: 16px;">
                  ${w.avatar}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary);">${w.name}</h3>
                    ${isCurrent ? '<span class="status-badge status-validated" style="font-size: 10px;">Vous</span>' : ''}
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted);">${w.role}</div>
                </div>
                <span class="status-badge ${w.status === 'in_studio' ? 'status-validated' : w.status === 'on_site' ? 'status-review' : 'status-blocked'}" style="font-size: 11px;">
                  ${w.status === 'in_studio' ? 'En Studio' : w.status === 'on_site' ? 'Sur Chantier' : 'Sorti'}
                </span>
              </div>

              <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); font-size: 12px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Email :</span>
                  <span style="font-weight: 600;">${w.email || '—'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Téléphone :</span>
                  <span style="font-weight: 600;">${w.phone || '—'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Dernier pointage :</span>
                  <span style="font-weight: 700; color: var(--accent-emerald);">${w.checkIn || '--:--'}</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                <div>
                  <strong>${workerReports.length}</strong> fiche(s) — <strong>${(w.totalHoursMonth || 0).toFixed(1)}</strong> h ce mois
                </div>
                ${isAdmin ? `
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-secondary edit-worker-btn" data-id="${w.id}" style="padding: 4px 10px; font-size: 11px;">✏️ Modifier</button>
                    <button class="btn-secondary delete-worker-btn" data-id="${w.id}" style="padding: 4px 10px; font-size: 11px; color: var(--accent-red, #ef4444);">🗑️</button>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <!-- Worker Form Modal (hidden) -->
    <div id="worker-modal" class="modal hidden">
      <div class="modal-content" style="max-width: 560px;">
        <div class="modal-header">
          <div class="modal-title" id="worker-modal-title">Ajouter un Collaborateur</div>
          <button class="modal-close-btn" id="close-worker-modal-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="worker-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" id="worker-edit-id" value="">

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="worker-name">Nom complet *</label>
              <input type="text" id="worker-name" class="form-control" placeholder="ex: ELLOUMI M'HAMED" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="worker-role">Poste / Rôle *</label>
              <input type="text" id="worker-role" class="form-control" placeholder="ex: ARCHITECTE" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="worker-phone">Numéro de téléphone</label>
              <input type="tel" id="worker-phone" class="form-control" placeholder="ex: +216 98 000 000" />
            </div>
            <div class="form-group">
              <label class="form-label" for="worker-email">Adresse email</label>
              <input type="email" id="worker-email" class="form-control" placeholder="ex: nom@example.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="worker-pin">Code PIN (pour connexion) *</label>
            <input type="text" id="worker-pin" class="form-control" placeholder="ex: 1234" maxlength="8" required />
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Ce code permet au collaborateur de se connecter à son espace.</div>
          </div>

          <div class="modal-footer" style="padding: 0; margin-top: 8px; border-top: none;">
            <button type="button" class="btn-secondary" id="cancel-worker-btn">Annuler</button>
            <button type="submit" class="btn-primary" id="worker-submit-btn">
              <span id="worker-submit-label">Ajouter le Collaborateur</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Punch button
  const punchBtn = document.getElementById('team-punch-btn');
  if (punchBtn) {
    punchBtn.addEventListener('click', () => {
      const p = store.togglePresence();
      showToast(p.activePunchedIn ? "Pointage Entrée enregistré !" : "Pointage Sortie enregistré !", "success");
      renderTeamView(container);
    });
  }

  // Open add worker modal
  const openWorkerModal = (workerId = null) => {
    const modal = document.getElementById('worker-modal');
    const title = document.getElementById('worker-modal-title');
    const submitLabel = document.getElementById('worker-submit-label');
    const editIdInput = document.getElementById('worker-edit-id');

    document.getElementById('worker-name').value = '';
    document.getElementById('worker-role').value = '';
    document.getElementById('worker-phone').value = '';
    document.getElementById('worker-email').value = '';
    document.getElementById('worker-pin').value = '';
    editIdInput.value = '';

    if (workerId) {
      const w = store.getWorkers().find(x => x.id === workerId);
      if (w) {
        title.textContent = 'Modifier le Collaborateur';
        submitLabel.textContent = 'Enregistrer les Modifications';
        editIdInput.value = w.id;
        document.getElementById('worker-name').value = w.name;
        document.getElementById('worker-role').value = w.role;
        document.getElementById('worker-phone').value = w.phone || '';
        document.getElementById('worker-email').value = w.email || '';
        document.getElementById('worker-pin').value = w.pin || '';
      }
    } else {
      title.textContent = 'Ajouter un Collaborateur';
      submitLabel.textContent = 'Ajouter le Collaborateur';
    }

    modal.classList.remove('hidden');
  };

  const closeWorkerModal = () => {
    document.getElementById('worker-modal')?.classList.add('hidden');
  };

  document.getElementById('open-add-worker-btn')?.addEventListener('click', () => openWorkerModal());
  document.getElementById('open-add-worker-btn-empty')?.addEventListener('click', () => openWorkerModal());
  document.getElementById('close-worker-modal-btn')?.addEventListener('click', closeWorkerModal);
  document.getElementById('cancel-worker-btn')?.addEventListener('click', closeWorkerModal);

  // Edit buttons
  container.querySelectorAll('.edit-worker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openWorkerModal(e.currentTarget.dataset.id));
  });

  // Delete buttons
  container.querySelectorAll('.delete-worker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wId = e.currentTarget.dataset.id;
      const w = store.getWorkers().find(x => x.id === wId);
      if (w && confirm(`Supprimer ${w.name} ? Cette action est irréversible.`)) {
        store.deleteWorker(wId);
        showToast(`${w.name} supprimé de l'équipe.`, 'success');
        renderTeamView(container);
      }
    });
  });

  // Form submit
  const workerForm = document.getElementById('worker-form');
  if (workerForm) {
    workerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('worker-edit-id').value;
      const name = document.getElementById('worker-name').value.trim();
      const role = document.getElementById('worker-role').value.trim();
      const phone = document.getElementById('worker-phone').value.trim();
      const email = document.getElementById('worker-email').value.trim();
      const pin = document.getElementById('worker-pin').value.trim();

      if (!name || !role || !pin) {
        showToast('Veuillez remplir tous les champs obligatoires (*).', 'error');
        return;
      }

      if (editId) {
        store.updateWorker(editId, { name, role, phone, email, pin });
        showToast(`${name} mis à jour avec succès !`, 'success');
      } else {
        store.addWorker({ name, role, phone, email, pin });
        showToast(`${name} ajouté à l'équipe !`, 'success');
      }

      closeWorkerModal();
      renderTeamView(container);
    });
  }
}
