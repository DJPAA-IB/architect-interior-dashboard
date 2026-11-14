/**
 * Settings & Customization View (Paramètres du Studio & Sécurité)
 */
import { store } from '../data/store.js';
import { showToast } from '../components/Toast.js';

export function renderSettingsView(container) {
  const settings = store.getSettings();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Paramètres du Studio & Sécurité</h1>
        <p>Configuration de l'agence d'architecture, mot de passe administrateur, devise et gestion des sauvegardes.</p>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 780px;">
      <!-- Studio Identity Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Identité du Cabinet d'Architecture</div>
            <div class="card-subtitle">Informations figurant sur les fiches de rapport et factures</div>
          </div>
        </div>

        <form id="settings-studio-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="setting-studio-name">Nom de l'Agence / Atelier</label>
              <input type="text" id="setting-studio-name" class="form-control" value="${settings.studioName}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="setting-lead-arch">Architecte Responsable (Visa Fiches)</label>
              <input type="text" id="setting-lead-arch" class="form-control" value="${settings.architectLead}" required />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="setting-currency">Devise Principale</label>
              <select id="setting-currency" class="form-control">
                <option value="TND" ${settings.currency === 'TND' ? 'selected' : ''}>TND (Dinar Tunisien)</option>
                <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€ Euro)</option>
                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($ Dollar)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="setting-phone">Téléphone / Contact</label>
              <input type="text" id="setting-phone" class="form-control" value="${settings.phone || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="setting-address">Adresse du Studio</label>
            <input type="text" id="setting-address" class="form-control" value="${settings.address || ''}" />
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn-primary">
              <span>Enregistrer l'Identité</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Admin Password & Security Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Sécurité & Mot de Passe Administrateur (Boss)</div>
            <div class="card-subtitle">Protège l'accès aux revenus, aux factures, aux clients et aux paramètres</div>
          </div>
        </div>

        <form id="settings-security-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="setting-admin-pass">Nouveau mot de passe Admin</label>
              <input 
                type="password" 
                id="setting-admin-pass" 
                class="form-control" 
                placeholder="Nouveau mot de passe..." 
                value="" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="setting-admin-pass-confirm">Confirmer le mot de passe</label>
              <input 
                type="password" 
                id="setting-admin-pass-confirm" 
                class="form-control" 
                placeholder="Répétez le mot de passe..." 
                value="" 
                required 
              />
            </div>
          </div>

          <div style="font-size: 12px; color: var(--text-muted); background: var(--bg-hover); padding: 10px 14px; border-radius: var(--radius-sm);">
            💡 <em>Saisissez un nouveau mot de passe pour le modifier.</em> Les collaborateurs ne peuvent pas accéder aux sections administratives sans ce code.
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn-primary">
              <span>Mettre à jour le Mot de Passe</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Backup & Data Export Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Sauvegarde & Restauration des Données</div>
            <div class="card-subtitle">Exportez vos données de studio pour archivage ou transférez-les sur un autre serveur</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- JSON Export & Import -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border-default); flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-weight: 700; font-size: 13.5px; color: var(--text-primary);">💾 Sauvegarde & Restauration (JSON)</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Exportez vos données ou restaurez un fichier de sauvegarde précédemment enregistré.</div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input type="file" id="import-json-input" accept=".json" style="display: none;" />
              <button class="btn-secondary" id="import-json-backup-btn">
                <span>📥 Importer JSON</span>
              </button>
              <button class="btn-primary" id="export-json-backup-btn">
                <span>💾 Exporter JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach events
  const identityForm = document.getElementById('settings-studio-form');
  if (identityForm) {
    identityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.studioName = document.getElementById('setting-studio-name').value;
      settings.architectLead = document.getElementById('setting-lead-arch').value;
      settings.currency = document.getElementById('setting-currency').value;
      settings.phone = document.getElementById('setting-phone').value;
      settings.address = document.getElementById('setting-address').value;
      store.save();
      showToast("Paramètres du studio enregistrés avec succès !", "success");
    });
  }

  const securityForm = document.getElementById('settings-security-form');
  if (securityForm) {
    securityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = document.getElementById('setting-admin-pass').value;
      const p2 = document.getElementById('setting-admin-pass-confirm').value;
      if (p1 !== p2) {
        showToast("Les deux mots de passe ne correspondent pas.", "error");
        return;
      }
      store.setAdminPassword(p1);
      showToast("Mot de passe Administrateur mis à jour avec succès !", "success");
    });
  }

  const exportBtn = document.getElementById('export-json-backup-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `studio_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Sauvegarde JSON téléchargée avec succès !", "success");
    });
  }

  const importBtn = document.getElementById('import-json-backup-btn');
  const importInput = document.getElementById('import-json-input');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          store.importBackup(parsed);
          showToast("Sauvegarde JSON importée avec succès !", "success");
          renderSettingsView(container);
        } catch (err) {
          showToast("Erreur lors de la lecture du fichier JSON.", "error");
        }
      };
      reader.readAsText(file);
    });
  }
}
