/**
 * Villas & Projects Management View (Gestion des Villas & Chantiers)
 * Scoped by role: Workers only see their assigned projects and technical specs.
 */
import { store } from '../data/store.js';
import { formatCurrency } from '../utils/formatters.js';
import { showToast } from '../components/Toast.js';

export function renderProjectsView(container) {
  const isAdmin = store.isAdmin();
  const currentUser = store.getCurrentUser();
  const projects = store.getProjects();
  const settings = store.getSettings();
  const workers = store.getWorkers();
  const reports = store.getDailyReports();
  const clients = store.getClients();

  const stageOptions = [
    "Étude Préliminaire",
    "Esquisse & APS",
    "Conception & 3D",
    "APD & Permis de Construire",
    "Dossier d'Exécution",
    "Chantier & Finitions",
    "Réception & Livraison",
    "Terminé"
  ];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>${isAdmin ? "Villas & Projets d'Architecture" : `Mes Villas & Chantiers Assignés (${currentUser.name})`}</h1>
        <p>${isAdmin ? "Suivi de l'avancement des dossiers d'exécution, spécifications techniques et budget." : "Consultation des spécifications techniques des projets sous votre responsabilité."}</p>
      </div>

      <div class="view-actions">
        ${isAdmin ? `
          <button class="btn-primary" id="open-add-project-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Nouvelle Villa / Projet</span>
          </button>
        ` : `
          <div style="font-size: 12.5px; color: var(--text-muted); padding: 6px 12px; background: var(--bg-hover); border-radius: var(--radius-md);">
            🔒 <strong>${projects.length}</strong> projet(s) sous votre charge
          </div>
        `}
      </div>
    </div>

    <!-- Projects Grid -->
    ${projects.length === 0 ? `
      <div style="padding: 64px 24px; text-align: center; background: var(--bg-surface); border: 2px dashed var(--border-default); border-radius: var(--radius-lg);">
        <div style="font-size: 48px; margin-bottom: 16px;">🏛️</div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Aucun projet à afficher</h3>
        <p style="font-size: 14px; color: var(--text-muted); max-width: 400px; margin: 0 auto 24px;">
          ${isAdmin ? "Commencez par créer votre première villa ou projet architectural dans le studio." : "Aucun projet ne vous est actuellement assigné."}
        </p>
        ${isAdmin ? `<button class="btn-primary" id="open-add-project-btn-empty">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Créer le premier projet</span>
        </button>` : ''}
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 20px;">
        ${projects.map(proj => {
          const leadWorker = workers.find(w => w.id === proj.leadArchitectId);
          const projReports = reports.filter(r => r.projectId === proj.id);
          const totalHoursOnProj = projReports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);

          return `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
                  <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--primary-600); font-family: var(--font-mono);">${proj.code}</div>
                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${proj.name}</h3>
                    <div style="font-size: 12.5px; color: var(--text-muted);">${proj.type}${proj.location ? ' • ' + proj.location : ''}</div>
                  </div>
                  <span class="status-badge status-review" style="font-size: 11px;">${proj.stage}</span>
                </div>

                ${proj.description ? `
                  <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
                    ${proj.description}
                  </div>
                ` : ''}

                <!-- Technical Specs -->
                ${proj.keySpecs && (proj.keySpecs.hsp || proj.keySpecs.climatisation || proj.keySpecs.fauxPlafond || proj.keySpecs.piscine) ? `
                  <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    ${proj.keySpecs.hsp ? `<div><strong>HSP :</strong> ${proj.keySpecs.hsp}</div>` : ''}
                    ${proj.keySpecs.climatisation ? `<div><strong>Clim :</strong> ${proj.keySpecs.climatisation}</div>` : ''}
                    ${proj.keySpecs.fauxPlafond ? `<div><strong>Plafond :</strong> ${proj.keySpecs.fauxPlafond}</div>` : ''}
                    ${proj.keySpecs.piscine ? `<div><strong>Piscine :</strong> ${proj.keySpecs.piscine}</div>` : ''}
                  </div>
                ` : ''}

                <!-- Progress Bar -->
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; margin-bottom: 6px;">
                    <span>Avancement Global</span>
                    <span style="color: var(--primary-600); font-weight: 700;">${proj.progress || 0}%</span>
                  </div>
                  <div style="width: 100%; height: 8px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden;">
                    <div style="width: ${proj.progress || 0}%; height: 100%; background: var(--primary-gradient); border-radius: var(--radius-full);"></div>
                  </div>
                </div>
              </div>

              <!-- Card Bottom Meta & Actions -->
              <div style="border-top: 1px solid var(--border-default); padding-top: 14px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${leadWorker ? `
                    <div class="user-avatar" style="width: 28px; height: 28px; font-size: 10px;" title="Architecte Référent: ${leadWorker.name}">
                      ${leadWorker.avatar}
                    </div>
                  ` : ''}
                  <div style="font-size: 12px; color: var(--text-muted);">
                    <strong>${projReports.length}</strong> fiche(s) (${totalHoursOnProj.toFixed(1)}h)
                  </div>
                </div>

                ${isAdmin ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
                      ${formatCurrency(proj.budget || 0, settings.currency)}
                    </div>
                    <button class="btn-secondary edit-project-btn" data-id="${proj.id}" style="padding: 4px 10px; font-size: 11px;">✏️</button>
                    <button class="btn-secondary delete-project-btn" data-id="${proj.id}" style="padding: 4px 10px; font-size: 11px; color: var(--accent-red, #ef4444);">🗑️</button>
                  </div>
                ` : `
                  <div style="font-size: 12px; font-weight: 600; color: var(--primary-600);">
                    Client : ${proj.client}
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <!-- Project Form Modal -->
    <div id="project-modal" class="modal hidden">
      <div class="modal-content" style="max-width: 680px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <div class="modal-title" id="project-modal-title">Nouvelle Villa / Projet</div>
          <button class="modal-close-btn" id="close-project-modal-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="project-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" id="project-edit-id" value="">

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="proj-name">Nom de la Villa / Projet *</label>
              <input type="text" id="proj-name" class="form-control" placeholder="ex: VILLA SOUSSE CORNICHE" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-type">Type de Projet</label>
              <input type="text" id="proj-type" class="form-control" placeholder="ex: Villa Contemporaine 600m²" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="proj-client">Nom du Client *</label>
              <input type="text" id="proj-client" class="form-control" placeholder="ex: Mohamed Trabelsi" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-location">Lieu / Adresse</label>
              <input type="text" id="proj-location" class="form-control" placeholder="ex: Sousse, Corniche" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="proj-stage">Phase du Projet</label>
              <select id="proj-stage" class="form-control">
                ${stageOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-progress">Avancement (%) *</label>
              <input type="number" id="proj-progress" class="form-control" placeholder="ex: 15" min="0" max="100" value="0" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="proj-budget">Budget / Honoraires (${settings.currency})</label>
              <input type="number" id="proj-budget" class="form-control" placeholder="ex: 180000" min="0" step="1000" value="" />
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-lead">Architecte Référent</label>
              <select id="proj-lead" class="form-control">
                <option value="">— Sélectionner —</option>
                ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="proj-description">Description du Projet</label>
            <textarea id="proj-description" class="form-control" rows="2" placeholder="Brève description du projet architectural..."></textarea>
          </div>

          <div style="border-top: 1px solid var(--border-default); padding-top: 14px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">🔧 Spécifications Techniques</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="proj-hsp">HSP (Hauteur sous plafond)</label>
                <input type="text" id="proj-hsp" class="form-control" placeholder="ex: 3.20 m" />
              </div>
              <div class="form-group">
                <label class="form-label" for="proj-clim">Climatisation</label>
                <input type="text" id="proj-clim" class="form-control" placeholder="ex: Centrale gainable" />
              </div>
              <div class="form-group">
                <label class="form-label" for="proj-plafond">Faux Plafond</label>
                <input type="text" id="proj-plafond" class="form-control" placeholder="ex: Staff lisse avec gorges LED" />
              </div>
              <div class="form-group">
                <label class="form-label" for="proj-piscine">Piscine / Extérieur</label>
                <input type="text" id="proj-piscine" class="form-control" placeholder="ex: Piscine miroir 12x5m" />
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 0; margin-top: 8px; border-top: none;">
            <button type="button" class="btn-secondary" id="cancel-project-btn">Annuler</button>
            <button type="submit" class="btn-primary">
              <span id="project-submit-label">Créer le Projet</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const openProjectModal = (projectId = null) => {
    const modal = document.getElementById('project-modal');
    const title = document.getElementById('project-modal-title');
    const submitLabel = document.getElementById('project-submit-label');
    const editIdInput = document.getElementById('project-edit-id');

    // Reset form
    ['proj-name','proj-type','proj-client','proj-location','proj-description','proj-hsp','proj-clim','proj-plafond','proj-piscine'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('proj-stage').value = stageOptions[0];
    document.getElementById('proj-progress').value = '0';
    document.getElementById('proj-budget').value = '';
    document.getElementById('proj-lead').value = '';
    editIdInput.value = '';

    if (projectId) {
      const p = store.getProjects(true).find(x => x.id === projectId);
      if (p) {
        title.textContent = 'Modifier le Projet';
        submitLabel.textContent = 'Enregistrer les Modifications';
        editIdInput.value = p.id;
        document.getElementById('proj-name').value = p.name;
        document.getElementById('proj-type').value = p.type || '';
        document.getElementById('proj-client').value = p.client || '';
        document.getElementById('proj-location').value = p.location || '';
        document.getElementById('proj-stage').value = p.stage || stageOptions[0];
        document.getElementById('proj-progress').value = p.progress || 0;
        document.getElementById('proj-budget').value = p.budget || '';
        document.getElementById('proj-lead').value = p.leadArchitectId || '';
        document.getElementById('proj-description').value = p.description || '';
        document.getElementById('proj-hsp').value = p.keySpecs?.hsp || '';
        document.getElementById('proj-clim').value = p.keySpecs?.climatisation || '';
        document.getElementById('proj-plafond').value = p.keySpecs?.fauxPlafond || '';
        document.getElementById('proj-piscine').value = p.keySpecs?.piscine || '';
      }
    } else {
      title.textContent = 'Nouvelle Villa / Projet';
      submitLabel.textContent = 'Créer le Projet';
    }

    modal.classList.remove('hidden');
  };

  const closeProjectModal = () => document.getElementById('project-modal')?.classList.add('hidden');

  document.getElementById('open-add-project-btn')?.addEventListener('click', () => openProjectModal());
  document.getElementById('open-add-project-btn-empty')?.addEventListener('click', () => openProjectModal());
  document.getElementById('close-project-modal-btn')?.addEventListener('click', closeProjectModal);
  document.getElementById('cancel-project-btn')?.addEventListener('click', closeProjectModal);

  container.querySelectorAll('.edit-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openProjectModal(e.currentTarget.dataset.id));
  });

  container.querySelectorAll('.delete-project-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pId = e.currentTarget.dataset.id;
      const p = store.getProjects(true).find(x => x.id === pId);
      if (p && confirm(`Supprimer le projet "${p.name}" ? Cette action est irréversible.`)) {
        store.deleteProject(pId);
        showToast(`Projet ${p.name} supprimé.`, 'success');
        renderProjectsView(container);
      }
    });
  });

  const projectForm = document.getElementById('project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('project-edit-id').value;

      const data = {
        name: document.getElementById('proj-name').value.trim(),
        type: document.getElementById('proj-type').value.trim(),
        client: document.getElementById('proj-client').value.trim(),
        location: document.getElementById('proj-location').value.trim(),
        stage: document.getElementById('proj-stage').value,
        progress: document.getElementById('proj-progress').value,
        budget: document.getElementById('proj-budget').value,
        leadArchitectId: document.getElementById('proj-lead').value,
        description: document.getElementById('proj-description').value.trim(),
        hsp: document.getElementById('proj-hsp').value.trim(),
        climatisation: document.getElementById('proj-clim').value.trim(),
        fauxPlafond: document.getElementById('proj-plafond').value.trim(),
        piscine: document.getElementById('proj-piscine').value.trim(),
      };

      if (!data.name || !data.client) {
        showToast('Le nom du projet et le client sont obligatoires.', 'error');
        return;
      }

      if (editId) {
        store.updateProject(editId, data);
        showToast(`Projet ${data.name} mis à jour !`, 'success');
      } else {
        store.addProject(data);
        showToast(`Projet ${data.name} créé avec succès !`, 'success');
      }

      closeProjectModal();
      renderProjectsView(container);
    });
  }
}
