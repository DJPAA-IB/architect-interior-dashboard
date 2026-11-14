/**
 * New Invoice / Milestone Creation Modal
 */
import { store } from '../data/store.js';
import { formatCurrency } from '../utils/formatters.js';
import { showToast } from './Toast.js';

export function openNewInvoiceModal() {
  const modal = document.getElementById('new-invoice-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  renderNewInvoiceForm();
}

export function closeNewInvoiceModal() {
  const modal = document.getElementById('new-invoice-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderNewInvoiceForm() {
  const modal = document.getElementById('new-invoice-modal');
  if (!modal) return;

  const projects = store.getProjects();
  const settings = store.getSettings();
  const todayISO = new Date().toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 620px;">
      <div class="modal-header">
        <div class="modal-title">Créer une Facture d'Honoraires / Acompte</div>
        <button class="modal-close-btn" id="close-invoice-modal-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form id="new-invoice-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label" for="inv-project">Projet / Villa *</label>
          <select id="inv-project" class="form-control" required>
            ${projects.map(p => `
              <option value="${p.id}" data-client="${p.client}">${p.name} (Client: ${p.client})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="inv-milestone">Intitulé de la Phase / Acompte *</label>
          <input type="text" id="inv-milestone" class="form-control" placeholder="ex: Phase 3 - Dossier d'Exécution & Plans Techniques" value="Phase 3 - Dossier d'Exécution & Plans Techniques" required />
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="inv-amount">Montant HT (${settings.currency}) *</label>
            <input type="number" id="inv-amount" class="form-control" placeholder="70000" value="70000" min="0" step="500" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="inv-status">Statut de la Facture *</label>
            <select id="inv-status" class="form-control" required>
              <option value="En attente">En attente de paiement</option>
              <option value="Payée">Payée / Encaissée</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="inv-issue-date">Date d'émission *</label>
            <input type="date" id="inv-issue-date" class="form-control" value="${todayISO}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="inv-payment-method">Mode de Paiement</label>
            <select id="inv-payment-method" class="form-control">
              <option value="Virement Bancaire">Virement Bancaire</option>
              <option value="Chèque">Chèque Certifié</option>
              <option value="Espèces">Espèces / Acompte</option>
            </select>
          </div>
        </div>

        <div class="modal-footer" style="padding: 0; margin-top: 10px; border-top: none;">
          <button type="button" class="btn-secondary" id="cancel-invoice-btn">Annuler</button>
          <button type="submit" class="btn-primary">
            <span>Émettre la Facture</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </form>
    </div>
  `;

  const closeBtn = document.getElementById('close-invoice-modal-btn');
  const cancelBtn = document.getElementById('cancel-invoice-btn');
  const form = document.getElementById('new-invoice-form');

  if (closeBtn) closeBtn.addEventListener('click', closeNewInvoiceModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeNewInvoiceModal);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const projSelect = document.getElementById('inv-project');
      const projectId = projSelect.value;
      const selectedOption = projSelect.options[projSelect.selectedIndex];
      const clientName = selectedOption.dataset.client;
      const project = store.getProjects().find(p => p.id === projectId);

      const milestone = document.getElementById('inv-milestone').value;
      const amount = document.getElementById('inv-amount').value;
      const status = document.getElementById('inv-status').value;
      const issueDate = document.getElementById('inv-issue-date').value;
      const paymentMethod = document.getElementById('inv-payment-method').value;

      store.addInvoice({
        projectId,
        projectName: project ? project.name : '',
        clientName,
        milestone,
        amount,
        status,
        issueDate,
        paymentMethod
      });

      closeNewInvoiceModal();
      showToast("Facture créée et enregistrée avec succès !", "success");
    });
  }
}
