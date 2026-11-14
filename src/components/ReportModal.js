/**
 * Interactive New Daily Report Builder Modal (Fiche de Rapport Journalier)
 * Pre-fills logged-in worker and scopes project selection to assigned projects.
 */
import { store } from '../data/store.js';
import { calculateDuration } from '../utils/formatters.js';
import { showToast } from './Toast.js';
import { openReportDetailModal } from './OfficialReportSheet.js';

let activityRowCount = 1;

export function openNewReportModal() {
  const modal = document.getElementById('new-report-modal');
  if (!modal) return;

  activityRowCount = 1;
  modal.classList.remove('hidden');
  renderNewReportForm();
}

export function closeNewReportModal() {
  const modal = document.getElementById('new-report-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderNewReportForm() {
  const modal = document.getElementById('new-report-modal');
  if (!modal) return;

  const isAdmin = store.isAdmin();
  const currentUser = store.getCurrentUser();
  const workers = store.getWorkers();
  const projects = store.getProjects();
  const todayISO = new Date().toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="modal-content modal-xl">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="modal-title">Remplir une Fiche de Rapport Journalier</div>
          <span class="status-badge status-review">Formulaire Numérique</span>
        </div>
        <button class="modal-close-btn" id="close-new-report-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form id="new-report-form" class="modal-body" style="display: flex; flex-direction: column; gap: 20px;">
        <!-- Header Metadata -->
        <div style="background: var(--bg-hover); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">
            1. Informations Générales & Horaires
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="report-date">Date du rapport *</label>
              <input type="date" id="report-date" class="form-control" value="${todayISO}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="report-worker">Collaborateur déclarant *</label>
              ${isAdmin ? `
                <select id="report-worker" class="form-control" required>
                  ${workers.map(w => `
                    <option value="${w.id}">${w.name} (${w.role})</option>
                  `).join('')}
                </select>
              ` : `
                <div style="padding: 10px 14px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-sm); font-weight: 700; color: var(--text-primary); font-size: 13.5px;">
                  👷 ${currentUser.name} (${currentUser.role})
                </div>
                <input type="hidden" id="report-worker" value="${currentUser.id}" />
              `}
            </div>

            <div class="form-group">
              <label class="form-label" for="report-project">Projet / Villa / Secteur *</label>
              ${projects.length > 0 ? `
                <select id="report-project" class="form-control" required>
                  ${projects.map(p => `
                    <option value="${p.id}">${p.name} — Client: ${p.client}</option>
                  `).join('')}
                </select>
              ` : `
                <input type="text" id="report-custom-project" class="form-control" placeholder="Nom de la villa ou tâche studio..." value="Villa en Conception" required />
              `}
            </div>
          </div>

          <div class="form-grid-3" style="margin-bottom: 0;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="report-start-time">Heure de Début *</label>
              <input type="time" id="report-start-time" class="form-control" value="09:00" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="report-end-time">Heure de Fin *</label>
              <input type="time" id="report-end-time" class="form-control" value="15:30" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Total Heures Calculé</label>
              <div id="report-hours-badge" style="padding: 10px 14px; background: var(--primary-50); color: var(--primary-700); font-weight: 700; border-radius: var(--radius-sm); border: 1px solid var(--primary-100); font-size: 14px;">
                6.50 heures (6h30)
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Activities Table -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
              2. Détail des Activités Journalières
            </div>
            <button type="button" class="btn-secondary" id="add-activity-row-btn" style="padding: 6px 12px; font-size: 12px;">
              + Ajouter une tâche / créneau
            </button>
          </div>

          <div id="activities-rows-container">
            <div class="report-row-card" data-row-idx="0">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Créneau Horaire (ex: 09:00 - 12:30)</label>
                  <input type="text" class="form-control act-time" placeholder="09:00 - 12:30" value="09:00 - 12:30" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Activité réalisée *</label>
                  <input type="text" class="form-control act-title" placeholder="ex: DOSSIER D'EXECUTION / COUPES / 3D..." value="DOSSIER D'EXECUTION" required />
                </div>
              </div>

              <div class="form-grid-2" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Résultat obtenu *</label>
                  <textarea class="form-control act-result" placeholder="ex: PLAN D'EXECUTION AVEC COUPES, FACADES ET COUPES FACADE..." required>Plan d'exécution avec coupes, façades et calepinage.</textarea>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Action à suivre</label>
                  <textarea class="form-control act-next" placeholder="ex: Détail piscine et confirmation HSP avec bureau d'études...">Détails techniques et confirmation avec le chef de projet.</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bilan de la journée (Summary) -->
        <div style="background: var(--bg-surface); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-default);">
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">
            3. Bilan de la Journée
          </div>

          <div class="form-group">
            <label class="form-label" for="report-achievements">Réalisations principales *</label>
            <input type="text" id="report-achievements" class="form-control" placeholder="ex: Finalisation des coupes façades et plans d'exécution" value="Avancement conforme sur le dossier technique" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="report-difficulties">Difficultés rencontrées / Points de blocage</label>
            <textarea id="report-difficulties" class="form-control" placeholder="ex: Ajustement allèges fenêtres ou conflit gaine climatisation..."></textarea>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="report-tomorrow">Actions prévues pour demain</label>
            <textarea id="report-tomorrow" class="form-control" placeholder="ex: Finaliser détails piscine et calepinage faux plafond..."></textarea>
          </div>
        </div>

        <div class="modal-footer" style="padding: 0; margin-top: 10px; display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn-secondary" id="cancel-new-report-btn">
            Annuler
          </button>
          <button type="submit" class="btn-primary" style="background: var(--primary-600);">
            <span>${isAdmin ? 'Enregistrer & Générer la Fiche A4' : 'Soumettre & Livrer la Fiche Journalière 🚀'}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  attachNewReportEvents();
}

function attachNewReportEvents() {
  const modal = document.getElementById('new-report-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('close-new-report-btn');
  const cancelBtn = document.getElementById('cancel-new-report-btn');
  const addRowBtn = document.getElementById('add-activity-row-btn');
  const rowsContainer = document.getElementById('activities-rows-container');
  const form = document.getElementById('new-report-form');

  const startTimeInput = document.getElementById('report-start-time');
  const endTimeInput = document.getElementById('report-end-time');
  const hoursBadge = document.getElementById('report-hours-badge');

  if (closeBtn) closeBtn.addEventListener('click', closeNewReportModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeNewReportModal);

  function updateHours() {
    if (startTimeInput && endTimeInput && hoursBadge) {
      const dur = calculateDuration(startTimeInput.value, endTimeInput.value);
      const h = Math.floor(dur);
      const m = Math.round((dur - h) * 60);
      hoursBadge.innerText = `${dur.toFixed(2)} heures (${h}h${m > 0 ? m.toString().padStart(2, '0') : ''})`;
    }
  }

  if (startTimeInput) startTimeInput.addEventListener('change', updateHours);
  if (endTimeInput) endTimeInput.addEventListener('change', updateHours);

  // Dynamic add activity row
  if (addRowBtn && rowsContainer) {
    addRowBtn.addEventListener('click', () => {
      activityRowCount++;
      const row = document.createElement('div');
      row.className = 'report-row-card';
      row.dataset.rowIdx = activityRowCount;
      row.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button type="button" class="btn-secondary remove-row-btn" style="padding: 2px 8px; font-size: 11px; color: var(--accent-rose);">
            ✕ Supprimer créneau
          </button>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Créneau Horaire</label>
            <input type="text" class="form-control act-time" placeholder="13:30 - 15:30" value="13:30 - 15:30" required />
          </div>
          <div class="form-group">
            <label class="form-label">Activité réalisée *</label>
            <input type="text" class="form-control act-title" placeholder="ex: Calepinage faux plafond & gaines clim" required />
          </div>
        </div>
        <div class="form-grid-2" style="margin-bottom: 0;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Résultat obtenu *</label>
            <textarea class="form-control act-result" placeholder="Détails du travail effectué..." required></textarea>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Action à suivre</label>
            <textarea class="form-control act-next" placeholder="Prochaine étape..."></textarea>
          </div>
        </div>
      `;
      rowsContainer.appendChild(row);

      row.querySelector('.remove-row-btn').addEventListener('click', () => {
        row.remove();
      });
    });
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const workerIdElem = document.getElementById('report-worker');
      const workerId = workerIdElem ? workerIdElem.value : store.getCurrentUser().id;
      const worker = store.getWorkers().find(w => w.id === workerId) || store.getCurrentUser();
      
      const projectSelect = document.getElementById('report-project');
      const customProjectInput = document.getElementById('report-custom-project');
      let project = null;
      let projectName = "PROJET STUDIO";
      let clientName = "CLIENT";
      let projectId = "p-custom";

      if (projectSelect) {
        project = store.getAllProjects().find(p => p.id === projectSelect.value);
        if (project) {
          projectId = project.id;
          projectName = project.name;
          clientName = project.client;
        }
      } else if (customProjectInput && customProjectInput.value) {
        projectName = customProjectInput.value.toUpperCase();
      }

      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;
      const totalHours = calculateDuration(startTime, endTime);
      const date = document.getElementById('report-date').value;

      // Extract activities
      const activityCards = rowsContainer.querySelectorAll('.report-row-card');
      const activities = [];
      activityCards.forEach(card => {
        const time = card.querySelector('.act-time').value;
        const activity = card.querySelector('.act-title').value;
        const result = card.querySelector('.act-result').value;
        const nextAction = card.querySelector('.act-next').value;
        if (activity) {
          activities.push({
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            time,
            project: projectName,
            activity,
            result,
            nextAction,
            status: "Terminé"
          });
        }
      });

      const achievements = document.getElementById('report-achievements').value;
      const difficulties = document.getElementById('report-difficulties').value;
      const tomorrowActions = document.getElementById('report-tomorrow').value;

      const newReport = store.addDailyReport({
        date,
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        startTime,
        endTime,
        totalHours,
        projectId,
        projectName,
        clientName,
        activities,
        summary: {
          achievements,
          difficulties,
          tomorrowActions
        }
      });

      closeNewReportModal();
      if (store.isAdmin()) {
        showToast("Fiche de rapport journalier enregistrée avec succès !", "success");
        // Admin can preview immediately
        openReportDetailModal(newReport.id);
      } else {
        // Worker: just confirm submission — do NOT open the official sheet
        // (which could show the validate button due to timing with server sync)
        showToast("Fiche journalière soumise & livrée avec succès ! En attente de visa Admin. 🚀", "success");
      }
    });
  }
}
