/**
 * Official Fiche de Rapport Journalier View, Approval & Print Modal
 * Matches 100% the authentic physical sheet provided in Image 1.
 */
import { store } from '../data/store.js';
import { formatDateFR, formatHours } from '../utils/formatters.js';
import { printOfficialSheet } from '../utils/exportHelpers.js';
import { showToast } from './Toast.js';

export function openReportDetailModal(reportId) {
  const modal = document.getElementById('report-detail-modal');
  if (!modal) return;

  const report = store.getDailyReports().find(r => r.id === reportId);
  if (!report) {
    showToast("Rapport introuvable", "error");
    return;
  }

  modal.classList.remove('hidden');
  renderOfficialReportModalContent(report);
}

export function closeReportDetailModal() {
  const modal = document.getElementById('report-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderOfficialReportModalContent(report) {
  const modal = document.getElementById('report-detail-modal');
  if (!modal) return;

  const isAdmin = store.isAdmin();
  const isPending = report.status !== 'Validé';
  const canValidate = isPending && isAdmin;

  // Fill up to 6 rows minimum for paper sheet authenticity
  const filledActivities = [...report.activities];
  while (filledActivities.length < 5) {
    filledActivities.push({
      time: '',
      project: '',
      activity: '',
      result: '',
      nextAction: '',
      status: ''
    });
  }

  modal.innerHTML = `
    <div class="modal-content modal-xl" style="max-height: 94vh;">
      <div class="modal-header print-action-bar" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div class="modal-title" style="display: flex; align-items: center; gap: 8px;">
            <span>Fiche Journalière</span>
            <span class="status-badge ${report.status === 'Validé' ? 'status-validated' : 'status-pending'}">
              ${report.status === 'Validé' ? '✓ Validé' : '⏳ En attente'}
            </span>
          </div>
          <span style="font-size: 12.5px; color: var(--text-muted);">Ref: ${report.id}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button class="btn-secondary" id="print-sheet-action-btn" title="Imprimer ou enregistrer au format PDF" style="padding: 8px 12px; font-size: 13px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Imprimer / PDF</span>
          </button>

          ${canValidate ? `
            <button class="btn-primary" id="validate-sheet-action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald); padding: 8px 14px; font-size: 13px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Valider & Signer</span>
            </button>
          ` : isPending ? `
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--accent-amber-bg); color: var(--accent-amber); border: 1px solid var(--accent-amber-border); border-radius: var(--radius-sm); font-size: 11.5px; font-weight: 600;">
              <span>⏳ En attente de visa Admin</span>
            </div>
          ` : ''}

          <button class="modal-close-btn" id="close-report-modal-btn" aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="modal-body" style="background: #e2e8f0; padding: 20px 14px; overflow-x: auto;">
        
        <!-- Authentic Paper Layout (A4 Style) -->
        <div class="official-fiche-container">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 20px; font-weight: 800; background: #85368a; color: #fff; padding: 0 6px; border-radius: 4px; line-height: 1.1;">A</span>
                <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em;">architect studio</span>
              </div>
              <div style="font-size: 10px; font-weight: 600; color: #6b7280; letter-spacing: 1px; text-transform: lowercase; margin-top: 1px;">architecture d'intérieur</div>
            </div>
            <div style="text-align: right;">
              <div class="fiche-header-title" style="margin-bottom: 0; padding-bottom: 0; border-bottom: none; font-size: 16px;">FICHE DE RAPPORT JOURNALIER</div>
              <div style="font-size: 11px; color: #6b7280; font-family: monospace;">Réf: ${report.id}</div>
            </div>
          </div>

          <!-- Meta Table -->
          <table class="fiche-meta-table">
            <tbody>
              <tr>
                <td class="fiche-meta-label">Date :</td>
                <td class="fiche-meta-value">${report.displayDate || formatDateFR(report.date)}</td>
                <td class="fiche-meta-label">Nom :</td>
                <td class="fiche-meta-value">${report.workerName}</td>
              </tr>
              <tr>
                <td class="fiche-meta-label">Fonction :</td>
                <td class="fiche-meta-value">${report.workerRole}</td>
                <td class="fiche-meta-label">Début :</td>
                <td class="fiche-meta-value">${report.startTime}</td>
              </tr>
              <tr>
                <td class="fiche-meta-label">Projet / Secteur :</td>
                <td class="fiche-meta-value">${report.projectName}</td>
                <td class="fiche-meta-label">Fin :</td>
                <td class="fiche-meta-value">${report.endTime} (${report.totalHours}h)</td>
              </tr>
            </tbody>
          </table>

          <!-- Activities Table -->
          <table class="fiche-activities-table">
            <thead>
              <tr>
                <th style="width: 12%;">Heure</th>
                <th style="width: 18%;">Client / Projet</th>
                <th style="width: 24%;">Activité réalisée</th>
                <th style="width: 24%;">Résultat</th>
                <th style="width: 22%;">Action à suivre</th>
              </tr>
            </thead>
            <tbody>
              ${filledActivities.map(act => `
                <tr class="${!act.activity ? 'empty-row' : ''}">
                  <td style="text-align: center; font-weight: 500;">${act.time || ''}</td>
                  <td style="font-weight: 600;">${act.project || (act.activity ? report.projectName : '')}</td>
                  <td>${act.activity || ''}</td>
                  <td>${act.result || ''}</td>
                  <td>${act.nextAction || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Bilan de la journée Table -->
          <table class="fiche-summary-table">
            <thead>
              <tr>
                <th colspan="2">BILAN DE LA JOURNÉE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fiche-summary-title-col">Réalisations principales</td>
                <td>${report.summary.achievements || '—'}</td>
              </tr>
              <tr>
                <td class="fiche-summary-title-col">Difficultés rencontrées</td>
                <td>${report.summary.difficulties || '—'}</td>
              </tr>
              <tr>
                <td class="fiche-summary-title-col">Décisions / Actions pour demain</td>
                <td>${report.summary.tomorrowActions || '—'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Signatures Table -->
          <table class="fiche-signatures-table">
            <tbody>
              <tr>
                <td>
                  <strong>Signature de l'employé</strong>
                  <div class="signature-stamp">
                    <span class="signature-badge">✓ Signature Certifiée</span>
                    <span>${report.workerSignature || report.workerName}</span>
                  </div>
                </td>
                <td>
                  <strong>Signature du responsable</strong>
                  ${report.supervisorSignature ? `
                    <div class="signature-stamp" style="color: #059669;">
                      <span class="signature-badge" style="background:#dcfce7; color:#15803d; border-color:#86efac;">✓ Validé le ${report.validationDate || '12/08/2026'}</span>
                      <span>${report.supervisorSignature}</span>
                    </div>
                    ${report.supervisorNotes ? `<div style="font-size: 11px; margin-top: 6px; color: #4b5563;"><em>Note: ${report.supervisorNotes}</em></div>` : ''}
                  ` : `
                    <div style="margin-top: 14px; font-size: 12px; color: #9ca3af; font-style: italic;">
                      En attente de visa du responsable de projet
                    </div>
                  `}
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  `;

  // Attach modal events
  const closeBtn = document.getElementById('close-report-modal-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeReportDetailModal);

  const printBtn = document.getElementById('print-sheet-action-btn');
  if (printBtn) printBtn.addEventListener('click', () => printOfficialSheet());

  const validateBtn = document.getElementById('validate-sheet-action-btn');
  if (validateBtn) {
    validateBtn.addEventListener('click', () => {
      // Hard guard: double-check admin status at click time, not just at render time
      if (!store.isAdmin()) {
        showToast("Action refusée — seul l'Administrateur peut valider une fiche.", "error");
        return;
      }
      const notes = prompt("Ajouter une note ou remarque de validation (optionnel) :", "Rapport vérifié et validé conforme.");
      if (notes !== null) {
        const ok = store.validateReport(report.id, notes);
        if (ok) {
          showToast("Rapport journalier validé et signé avec succès !", "success");
          renderOfficialReportModalContent(store.getDailyReports().find(r => r.id === report.id));
        } else {
          showToast("Validation refusée — accès Administrateur requis.", "error");
        }
      }
    });
  }
}
