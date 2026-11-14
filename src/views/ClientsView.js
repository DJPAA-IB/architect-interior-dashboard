/**
 * Clients Directory & CRM View (Répertoire des Clients & Maîtres d'Ouvrage)
 */
import { store } from '../data/store.js';
import { formatCurrency } from '../utils/formatters.js';
import { showToast } from '../components/Toast.js';

export function renderClientsView(container) {
  const clients = store.getClients();
  const settings = store.getSettings();
  const projects = store.getProjects();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Répertoire des Clients &amp; Maîtres d'Ouvrage</h1>
        <p>Gestion des relations clients, coordonnées des propriétaires de villas et historique de facturation.</p>
      </div>

      <div class="view-actions">
        <button class="btn-primary" id="open-add-client-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Nouveau Client</span>
        </button>
      </div>
    </div>

    <!-- Clients Table / Cards Grid -->
    ${clients.length === 0 ? `
      <div style="padding: 64px 24px; text-align: center; background: var(--bg-surface); border: 2px dashed var(--border-default); border-radius: var(--radius-lg);">
        <div style="font-size: 48px; margin-bottom: 16px;">🤝</div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Aucun client enregistré</h3>
        <p style="font-size: 14px; color: var(--text-muted); max-width: 380px; margin: 0 auto 24px;">
          Ajoutez vos premiers clients maîtres d'ouvrage pour commencer à gérer vos projets et factures.
        </p>
        <button class="btn-primary" id="open-add-client-btn-empty">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Ajouter le premier client</span>
        </button>
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 18px;">
        ${clients.map(c => {
          const clientProjects = projects.filter(p => p.client === c.name || p.clientId === c.id);
          return `
            <div class="card">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px;">
                <div>
                  <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${c.name}</h3>
                  <div style="font-size: 12px; color: var(--text-muted);">${c.company || '—'}${c.city ? ' • ' + c.city : ''}</div>
                </div>
                <span class="status-badge status-review" style="font-size: 11px;">${c.status || 'Actif'}</span>
              </div>

              <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); font-size: 12.5px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
                <div><strong>📞 Tél :</strong> ${c.phone || '—'}</div>
                <div><strong>✉️ Email :</strong> ${c.email || '—'}</div>
                <div><strong>🏛️ Villas :</strong> ${clientProjects.length > 0 ? clientProjects.map(p => p.name).join(', ') : '—'}</div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                <div>
                  <span style="color: var(--text-muted);">Total Honoraires :</span>
                  <span style="font-weight: 800; color: var(--primary-700); font-size: 14px; margin-left: 6px;">${formatCurrency(c.totalBilled || 0, settings.currency)}</span>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn-secondary edit-client-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 11px;">✏️ Modifier</button>
                  <button class="btn-secondary delete-client-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 11px; color: var(--accent-red, #ef4444);">🗑️</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <!-- Client Form Modal -->
    <div id="client-modal" class="modal hidden">
      <div class="modal-content" style="max-width: 580px;">
        <div class="modal-header">
          <div class="modal-title" id="client-modal-title">Nouveau Client</div>
          <button class="modal-close-btn" id="close-client-modal-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="client-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" id="client-edit-id" value="">

          <div class="form-group">
            <label class="form-label" for="client-name">Nom complet du client *</label>
            <input type="text" id="client-name" class="form-control" placeholder="ex: BECHIR WALI" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="client-company">Société / Entreprise</label>
              <input type="text" id="client-company" class="form-control" placeholder="ex: Wali Invest Group" />
            </div>
            <div class="form-group">
              <label class="form-label" for="client-city">Ville / Région</label>
              <input type="text" id="client-city" class="form-control" placeholder="ex: Gammarth, Tunis" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="client-phone">Numéro de téléphone *</label>
              <input type="tel" id="client-phone" class="form-control" placeholder="ex: +216 98 777 000" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="client-email">Adresse email</label>
              <input type="email" id="client-email" class="form-control" placeholder="ex: client@mail.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="client-status">Statut du client</label>
            <select id="client-status" class="form-control">
              <option value="Nouveau">Nouveau</option>
              <option value="Actif">Actif</option>
              <option value="VIP / Actif">VIP / Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>

          <div class="modal-footer" style="padding: 0; margin-top: 8px; border-top: none;">
            <button type="button" class="btn-secondary" id="cancel-client-btn">Annuler</button>
            <button type="submit" class="btn-primary">
              <span id="client-submit-label">Ajouter le Client</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const openClientModal = (clientId = null) => {
    const modal = document.getElementById('client-modal');
    const title = document.getElementById('client-modal-title');
    const submitLabel = document.getElementById('client-submit-label');
    const editIdInput = document.getElementById('client-edit-id');

    // Reset
    document.getElementById('client-name').value = '';
    document.getElementById('client-company').value = '';
    document.getElementById('client-city').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-email').value = '';
    document.getElementById('client-status').value = 'Nouveau';
    editIdInput.value = '';

    if (clientId) {
      const c = store.getClients().find(x => x.id === clientId);
      if (c) {
        title.textContent = 'Modifier le Client';
        submitLabel.textContent = 'Enregistrer les Modifications';
        editIdInput.value = c.id;
        document.getElementById('client-name').value = c.name;
        document.getElementById('client-company').value = c.company || '';
        document.getElementById('client-city').value = c.city || '';
        document.getElementById('client-phone').value = c.phone || '';
        document.getElementById('client-email').value = c.email || '';
        document.getElementById('client-status').value = c.status || 'Actif';
      }
    } else {
      title.textContent = 'Nouveau Client';
      submitLabel.textContent = 'Ajouter le Client';
    }

    modal.classList.remove('hidden');
  };

  const closeClientModal = () => document.getElementById('client-modal')?.classList.add('hidden');

  document.getElementById('open-add-client-btn')?.addEventListener('click', () => openClientModal());
  document.getElementById('open-add-client-btn-empty')?.addEventListener('click', () => openClientModal());
  document.getElementById('close-client-modal-btn')?.addEventListener('click', closeClientModal);
  document.getElementById('cancel-client-btn')?.addEventListener('click', closeClientModal);

  container.querySelectorAll('.edit-client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openClientModal(e.currentTarget.dataset.id));
  });

  container.querySelectorAll('.delete-client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cId = e.currentTarget.dataset.id;
      const c = store.getClients().find(x => x.id === cId);
      if (c && confirm(`Supprimer ${c.name} ? Cette action est irréversible.`)) {
        store.deleteClient(cId);
        showToast(`${c.name} supprimé du répertoire.`, 'success');
        renderClientsView(container);
      }
    });
  });

  const clientForm = document.getElementById('client-form');
  if (clientForm) {
    clientForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('client-edit-id').value;
      const name = document.getElementById('client-name').value.trim();
      const company = document.getElementById('client-company').value.trim();
      const city = document.getElementById('client-city').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const email = document.getElementById('client-email').value.trim();
      const status = document.getElementById('client-status').value;

      if (!name || !phone) {
        showToast('Le nom et le téléphone sont obligatoires.', 'error');
        return;
      }

      if (editId) {
        store.updateClient(editId, { name, company, city, phone, email, status });
        showToast(`Client ${name} mis à jour !`, 'success');
      } else {
        store.addClient({ name, company, city, phone, email, status });
        showToast(`Client ${name} ajouté !`, 'success');
      }

      closeClientModal();
      renderClientsView(container);
    });
  }
}
