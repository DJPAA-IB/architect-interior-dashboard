/**
 * Architect Interior Dashboard - State Store & Reactive Data Engine
 * Includes full persistence with LocalStorage & authentic architectural studio seed data.
 */

const STORAGE_KEY = 'architect_dashboard_v2';
const LAST_WORKER_KEY = 'architect_dashboard_last_worker_id';

// Initial admin password comes from the VITE_ADMIN_PASSWORD env variable (.env, never committed).
const DEFAULT_ADMIN_PASSWORD = (import.meta.env?.VITE_ADMIN_PASSWORD || '').trim();

const DEFAULT_EMPTY_STATE = {
  settings: {
    studioName: "Mon Studio - Architecture d'Intérieur",
    currency: "TND",
    architectLead: "Architecte Principal",
    address: "Adresse du studio",
    phone: "+216 00 000 000",
    email: "contact@example.com",
    theme: "light",
    adminPassword: DEFAULT_ADMIN_PASSWORD
  },
  activeRole: "worker",
  adminAuthenticated: false,
  currentUser: {
    id: "guest",
    name: "COLLABORATEUR ATELIER",
    role: "ARCHITECTE D'INTÉRIEUR",
    avatar: "👷",
    email: "collaborateur@example.com"
  },
  presence: {
    activePunchedIn: false,
    lastPunchTime: "--:--",
    currentLocation: "Studio",
    currentTask: ""
  },
  workers: [],
  projects: [],
  dailyReports: [],
  invoices: [],
  clients: []
};

class StudioStore {
  constructor() {
    this.data = this.loadFromStorage();
    this.listeners = new Set();
    this.initServerSync();
  }

  initServerSync() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    this.fetchServerData();
    // Background polling every 3 seconds for instant live updates between phone & PC
    setInterval(() => this.fetchServerData(), 3000);
  }

  async fetchServerData() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const serverData = await res.json();
        // If server has stored data, sync it down
        if (serverData && serverData.projects !== undefined && serverData.dailyReports !== undefined) {
          const hasChanged = JSON.stringify(this.data.projects) !== JSON.stringify(serverData.projects) ||
                             JSON.stringify(this.data.dailyReports) !== JSON.stringify(serverData.dailyReports) ||
                             JSON.stringify(this.data.invoices) !== JSON.stringify(serverData.invoices) ||
                             JSON.stringify(this.data.workers) !== JSON.stringify(serverData.workers) ||
                             JSON.stringify(this.data.clients) !== JSON.stringify(serverData.clients);

          this.data.workers        = serverData.workers        ?? this.data.workers;
          this.data.projects       = serverData.projects       ?? this.data.projects;
          this.data.dailyReports   = serverData.dailyReports   ?? this.data.dailyReports;
          this.data.invoices        = serverData.invoices        ?? this.data.invoices;
          this.data.clients        = serverData.clients        ?? this.data.clients;
          if (serverData.settings) {
            this.data.settings = { ...this.data.settings, ...serverData.settings };
          }

          // If not in active authenticated admin mode, reconnect to device's last worker
          if (!this.isAdmin() && this.data.workers && this.data.workers.length > 0) {
            const lastWorkerId = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_WORKER_KEY) : null;
            let currentWorker = null;
            if (lastWorkerId) {
              currentWorker = this.data.workers.find(w => w.id === lastWorkerId);
            }
            if (!currentWorker && this.data.currentUser?.id && this.data.currentUser.id !== 'guest' && this.data.currentUser.id !== 'admin') {
              currentWorker = this.data.workers.find(w => w.id === this.data.currentUser.id);
            }
            if (!currentWorker && this.data.workers.length > 0) {
              currentWorker = this.data.workers[0];
            }

            if (currentWorker) {
              this.data.currentUser = {
                id: currentWorker.id,
                name: currentWorker.name,
                role: currentWorker.role,
                avatar: currentWorker.avatar,
                email: currentWorker.email,
                phone: currentWorker.phone
              };
            }
          }

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch {}
          if (hasChanged) {
            this.notify();
          }
        } else if (serverData && serverData.status === 'no_server_data') {
          // If server is empty but client has local data, immediately upload to server!
          this.pushToServer();
        }
      }
    } catch {
      // Offline / standalone client mode - smooth fallback
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const lastWorkerId = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_WORKER_KEY) : null;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.settings) parsed.settings = {};
        if (!parsed.settings.adminPassword) {
          parsed.settings.adminPassword = DEFAULT_ADMIN_PASSWORD;
        }

        // SECURITY GUARANTEE: Never auto-login to Boss/Admin on page load or new device.
        // Always starts in worker mode; Boss mode strictly requires password entry.
        parsed.activeRole = 'worker';
        parsed.adminAuthenticated = false;

        const workers = Array.isArray(parsed.workers) ? parsed.workers : [];
        let matchedWorker = null;

        if (lastWorkerId) {
          matchedWorker = workers.find(w => w.id === lastWorkerId);
        }
        if (!matchedWorker && parsed.currentUser && parsed.currentUser.id !== 'admin' && parsed.currentUser.id !== 'guest') {
          matchedWorker = workers.find(w => w.id === parsed.currentUser.id);
        }
        if (!matchedWorker && workers.length > 0) {
          matchedWorker = workers[0];
        }

        if (matchedWorker) {
          parsed.currentUser = {
            id: matchedWorker.id,
            name: matchedWorker.name,
            role: matchedWorker.role,
            avatar: matchedWorker.avatar,
            email: matchedWorker.email,
            phone: matchedWorker.phone
          };
        } else {
          parsed.currentUser = {
            id: "guest",
            name: "COLLABORATEUR ATELIER",
            role: "ARCHITECTE D'INTÉRIEUR",
            avatar: "👷",
            email: "collaborateur@example.com"
          };
        }

        return parsed;
      }
    } catch (e) {
      console.warn("Error reading localStorage, using clean state.", e);
    }
    // Default for any new device / phone: clean worker state (DEFAULT_EMPTY_STATE)
    return JSON.parse(JSON.stringify(DEFAULT_EMPTY_STATE));
  }

  pushToServer() {
    if (typeof fetch === 'undefined') return;
    const payload = {
      workers:      this.data.workers || [],
      projects:     this.data.projects || [],
      dailyReports: this.data.dailyReports || [],
      invoices:      this.data.invoices || [],
      clients:      this.data.clients || [],
      settings:     this.data.settings || {}
    };
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Error saving state to localStorage", e);
    }
    this.notify();
    this.pushToServer();
  }

  importBackup(parsedData) {
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error("Format de données invalide");
    }
    const currentPass = this.data.settings?.adminPassword || DEFAULT_ADMIN_PASSWORD;
    this.data.workers = Array.isArray(parsedData.workers) ? parsedData.workers : [];
    this.data.projects = Array.isArray(parsedData.projects) ? parsedData.projects : [];
    this.data.dailyReports = Array.isArray(parsedData.dailyReports) ? parsedData.dailyReports : [];
    this.data.invoices = Array.isArray(parsedData.invoices) ? parsedData.invoices : [];
    this.data.clients = Array.isArray(parsedData.clients) ? parsedData.clients : [];
    if (parsedData.settings) {
      this.data.settings = { ...this.data.settings, ...parsedData.settings };
      if (!this.data.settings.adminPassword) {
        this.data.settings.adminPassword = currentPass;
      }
    }
    this.save();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.data);
      } catch (err) {
        console.error("Error in store listener", err);
      }
    }
  }

  // --- Role & Permissions Authentication Methods ---
  getActiveRole() { 
    if (this.data?.currentUser?.id && this.data.currentUser.id !== 'admin') {
      return 'worker';
    }
    return this.data?.activeRole || 'admin'; 
  }
  
  isAdmin() {
    // Triple-check: currentUser must be admin, activeRole must be admin, and adminAuthenticated must be explicitly true
    if (!this.data?.currentUser) return false;
    if (this.data.currentUser.id !== 'admin') return false;
    if (this.data.activeRole !== 'admin') return false;
    if (this.data.adminAuthenticated !== true) return false;
    return true;
  }

  verifyAdminPassword(password) {
    const configured = (this.data.settings && this.data.settings.adminPassword) || DEFAULT_ADMIN_PASSWORD;
    if (!configured || !configured.trim()) {
      console.warn("No admin password configured. Set VITE_ADMIN_PASSWORD in .env");
      return false;
    }
    return Boolean(password) && password.trim() === configured.trim();
  }

  setAdminPassword(newPassword) {
    if (!newPassword || !newPassword.trim()) return false;
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.adminPassword = newPassword.trim();
    this.save();
    return true;
  }

  loginAsAdmin(password) {
    if (this.verifyAdminPassword(password)) {
      this.data.activeRole = 'admin';
      this.data.adminAuthenticated = true;
      this.data.currentUser = {
        id: "admin",
        name: "ARCHITECTE EN CHEF (BOSS)",
        role: "ADMINISTRATEUR / BOSS",
        avatar: "👑",
        email: "direction@example.com"
      };
      this.save();
      return { success: true };
    }
    return { success: false, message: "Mot de passe administrateur incorrect." };
  }

  loginAsWorker(workerId) {
    const worker = (this.data.workers || []).find(w => w.id === workerId) || (this.data.workers || [])[0];
    if (worker) {
      try {
        localStorage.setItem(LAST_WORKER_KEY, worker.id);
      } catch {}
      this.data.activeRole = 'worker';
      this.data.adminAuthenticated = false;
      this.data.currentUser = {
        id: worker.id,
        name: worker.name,
        role: worker.role,
        avatar: worker.avatar,
        email: worker.email,
        phone: worker.phone
      };
      this.save();
      return { success: true, worker };
    }
    return { success: false, message: "Collaborateur introuvable." };
  }

  logout() {
    this.data.adminAuthenticated = false;
    this.data.activeRole = 'worker';
    const lastWorkerId = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_WORKER_KEY) : null;
    const worker = (this.data.workers || []).find(w => w.id === lastWorkerId) || (this.data.workers || [])[0];
    if (worker) {
      this.loginAsWorker(worker.id);
    } else {
      this.data.currentUser = {
        id: "guest",
        name: "COLLABORATEUR ATELIER",
        role: "ARCHITECTE D'INTÉRIEUR",
        avatar: "👷",
        email: "collaborateur@example.com"
      };
      this.save();
    }
  }

  setRole(role, workerId = 'w1') {
    if (role === 'admin') {
      // If setting admin, ensure authentication flag is checked
      if (this.isAdmin()) {
        this.data.activeRole = 'admin';
        this.data.adminAuthenticated = true;
      } else {
        this.logout();
      }
    } else {
      this.loginAsWorker(workerId);
    }
    this.save();
  }

  // --- Getter Methods with Strict Worker Isolation ---
  getSettings() { return this.data.settings; }
  getCurrentUser() { return this.data.currentUser; }
  getPresence() { return this.data.presence; }
  getWorkers() { return this.data.workers || []; }

  /**
   * Returns projects.
   * If Admin: returns all projects in the studio.
   * If Worker: returns ONLY the projects assigned to the current worker.
   */
  getProjects(forceAll = false) { 
    const all = this.data.projects || [];
    if (this.isAdmin() || forceAll) {
      return all;
    }
    const currentWorkerId = this.data.currentUser?.id;
    return all.filter(p => {
      if (p.leadArchitectId === currentWorkerId) return true;
      if (p.projectManagerId === currentWorkerId) return true;
      if (Array.isArray(p.assignedWorkerIds) && p.assignedWorkerIds.includes(currentWorkerId)) return true;
      return false;
    });
  }

  getAllProjects() {
    return this.data.projects || [];
  }

  /**
   * Returns daily reports.
   * If Admin: returns all daily reports from all architects.
   * If Worker: returns ONLY the daily reports written by this worker.
   */
  getDailyReports(forceAll = false) { 
    const all = this.data.dailyReports || [];
    if (this.isAdmin() || forceAll) {
      return all;
    }
    const currentWorkerId = this.data.currentUser?.id;
    const currentWorkerName = this.data.currentUser?.name;
    return all.filter(r => r.workerId === currentWorkerId || r.workerName === currentWorkerName);
  }

  /**
   * Invoices are strictly confidential financial records (Admin only).
   */
  getInvoices() { 
    if (!this.isAdmin()) return [];
    return this.data.invoices || []; 
  }

  /**
   * Clients directory with billing totals (Admin only).
   */
  getClients() { 
    if (!this.isAdmin()) return [];
    return this.data.clients || []; 
  }

  /**
   * Returns concerns, technical bottlenecks & tomorrow actions for the current user (or studio wide for admin).
   */
  getConcerns() {
    const reports = this.getDailyReports();
    const concerns = [];
    for (const r of reports) {
      if (r.summary && r.summary.difficulties && r.summary.difficulties.trim()) {
        concerns.push({
          reportId: r.id,
          date: r.displayDate || r.date,
          projectName: r.projectName,
          workerName: r.workerName,
          text: r.summary.difficulties,
          type: "difficulties"
        });
      }
      if (r.summary && r.summary.tomorrowActions && r.summary.tomorrowActions.trim()) {
        concerns.push({
          reportId: r.id,
          date: r.displayDate || r.date,
          projectName: r.projectName,
          workerName: r.workerName,
          text: r.summary.tomorrowActions,
          type: "actions"
        });
      }
    }
    return concerns;
  }

  // --- Financial & Metrics Computations (100% Dynamic from real data, zero safe) ---
  getFinancialMetrics() {
    const invoices = this.data.invoices || [];
    const projects = this.data.projects || [];
    const reports = this.data.dailyReports || [];

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
    const totalCollected = invoices.filter(inv => inv.status === 'Payée').reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
    const totalPending = invoices.filter(inv => inv.status !== 'Payée').reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
    const totalContractValue = projects.reduce((acc, p) => acc + (parseFloat(p.budget) || 0), 0);
    const totalHoursLogged = reports.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0);

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = invoices
      .filter(inv => (inv.issueDate && inv.issueDate.startsWith(currentMonthPrefix)) || inv.status === 'Payée')
      .reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);

    return {
      monthlyRevenue,
      totalInvoiced,
      totalCollected,
      totalPending,
      totalContractValue,
      totalHoursLogged,
      activeProjectsCount: projects.filter(p => (p.progress || 0) < 100).length,
      activeWorkersCount: (this.data.workers || []).length,
      pendingReportsCount: reports.filter(r => r.status === 'En attente').length
    };
  }

  // --- Reset to Clean Fresh Zeros State ---
  resetToZeros() {
    const adminPassword = this.data.settings?.adminPassword || DEFAULT_ADMIN_PASSWORD;
    const studioName = this.data.settings?.studioName || "Mon Studio - Architecture d'Intérieur";
    const currency = this.data.settings?.currency || "TND";
    const architectLead = this.data.settings?.architectLead || "Architecte Principal";
    const address = this.data.settings?.address || "Adresse du studio";
    const phone = this.data.settings?.phone || "+216 00 000 000";
    const email = this.data.settings?.email || "contact@example.com";

    this.data = {
      settings: {
        studioName,
        currency,
        architectLead,
        address,
        phone,
        email,
        theme: "light",
        adminPassword
      },
      activeRole: "admin",
      adminAuthenticated: true,
      currentUser: {
        id: "admin",
        name: "ARCHITECTE EN CHEF (BOSS)",
        role: "ADMINISTRATEUR / BOSS",
        avatar: "👑",
        email: "direction@example.com"
      },
      presence: {
        activePunchedIn: false,
        lastPunchTime: "--:--",
        currentLocation: "Studio",
        currentTask: ""
      },
      workers: [],
      projects: [],
      dailyReports: [],
      invoices: [],
      clients: []
    };
    this.save();
  }

  // --- Daily Report Mutations ---
  addDailyReport(reportData) {
    const id = `rep-${Date.now().toString().slice(-4)}`;
    const currentWorker = this.data.currentUser?.id !== 'admin' 
      ? this.data.currentUser 
      : (this.data.workers.find(w => w.id === reportData.workerId) || this.data.workers[0]);

    const workerId = currentWorker.id;
    const workerName = currentWorker.name;
    const workerRole = currentWorker.role || "ARCHITECTE";

    const newReport = {
      id,
      date: reportData.date || new Date().toISOString().split('T')[0],
      displayDate: reportData.displayDate || this.formatDateFR(reportData.date),
      workerId,
      workerName,
      workerRole,
      startTime: reportData.startTime || "09:00",
      endTime: reportData.endTime || "15:30",
      totalHours: parseFloat(reportData.totalHours) || 6.5,
      projectId: reportData.projectId,
      projectName: reportData.projectName,
      clientName: reportData.clientName || "",
      status: "En attente",
      activities: reportData.activities || [],
      summary: reportData.summary || {
        achievements: "",
        difficulties: "",
        tomorrowActions: ""
      },
      workerSignature: `${workerName} (Signé numériquement)`,
      supervisorSignature: null,
      validationDate: null,
      supervisorNotes: ""
    };

    if (!this.data.dailyReports) this.data.dailyReports = [];
    this.data.dailyReports.unshift(newReport);
    
    // Update worker's total hours logged
    const workerInStore = (this.data.workers || []).find(w => w.id === workerId);
    if (workerInStore) {
      workerInStore.totalHoursMonth = (workerInStore.totalHoursMonth || 0) + newReport.totalHours;
    }

    this.save();
    return newReport;
  }

  validateReport(reportId, supervisorNotes = "") {
    if (!this.isAdmin()) {
      console.warn("Permission refusée: Seul l'administrateur peut valider une fiche journalière.");
      return false;
    }
    const report = (this.data.dailyReports || []).find(r => r.id === reportId);
    if (report) {
      report.status = "Validé";
      report.supervisorSignature = `${this.data.settings?.architectLead || "Chef de Projet"} (Validé & Signé)`;
      report.validationDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
      report.supervisorNotes = supervisorNotes || "Rapport vérifié et validé conforme aux exigences du projet.";
      this.save();
      return true;
    }
    return false;
  }

  deleteReport(reportId) {
    this.data.dailyReports = (this.data.dailyReports || []).filter(r => r.id !== reportId);
    this.save();
  }

  // --- Project Mutations ---
  addProject(projectData) {
    const id = `p-${Date.now().toString().slice(-6)}`;
    const workers = this.data.workers || [];
    const currentWorkerId = this.data.currentUser?.id !== 'admin' ? this.data.currentUser.id : (projectData.leadArchitectId || (workers[0]?.id || 'admin'));

    const newProject = {
      id,
      code: projectData.code || `VIL-${Math.floor(100 + Math.random() * 900)}`,
      name: (projectData.name || "NOUVEAU PROJET").toUpperCase(),
      client: (projectData.client || "CLIENT PARTICULIER").toUpperCase(),
      clientId: projectData.clientId || "",
      location: projectData.location || "",
      type: projectData.type || "Villa Contemporaine",
      stage: projectData.stage || "Étude Préliminaire",
      progress: parseInt(projectData.progress, 10) || 0,
      budget: parseFloat(projectData.budget) || 0,
      invoiced: 0,
      paid: 0,
      hourlyRate: parseFloat(projectData.hourlyRate) || 85,
      leadArchitectId: projectData.leadArchitectId || currentWorkerId,
      projectManagerId: projectData.projectManagerId || "",
      assignedWorkerIds: projectData.assignedWorkerIds || [],
      description: projectData.description || "",
      keySpecs: {
        hsp: projectData.hsp || "",
        climatisation: projectData.climatisation || "",
        fauxPlafond: projectData.fauxPlafond || "",
        piscine: projectData.piscine || ""
      },
      updatedAt: new Date().toISOString().split('T')[0]
    };
    if (!this.data.projects) this.data.projects = [];
    this.data.projects.unshift(newProject);
    this.save();
    return newProject;
  }

  updateProject(projectId, updates) {
    const project = (this.data.projects || []).find(p => p.id === projectId);
    if (project) {
      if (updates.name) project.name = updates.name.toUpperCase();
      if (updates.client) project.client = updates.client.toUpperCase();
      if (updates.clientId !== undefined) project.clientId = updates.clientId;
      if (updates.location !== undefined) project.location = updates.location;
      if (updates.type !== undefined) project.type = updates.type;
      if (updates.stage !== undefined) project.stage = updates.stage;
      if (updates.progress !== undefined) project.progress = parseInt(updates.progress, 10);
      if (updates.budget !== undefined) project.budget = parseFloat(updates.budget);
      if (updates.description !== undefined) project.description = updates.description;
      if (updates.leadArchitectId !== undefined) project.leadArchitectId = updates.leadArchitectId;
      if (!project.keySpecs) project.keySpecs = {};
      if (updates.hsp !== undefined) project.keySpecs.hsp = updates.hsp;
      if (updates.climatisation !== undefined) project.keySpecs.climatisation = updates.climatisation;
      if (updates.fauxPlafond !== undefined) project.keySpecs.fauxPlafond = updates.fauxPlafond;
      if (updates.piscine !== undefined) project.keySpecs.piscine = updates.piscine;
      project.updatedAt = new Date().toISOString().split('T')[0];
      this.save();
    }
  }

  deleteProject(projectId) {
    this.data.projects = (this.data.projects || []).filter(p => p.id !== projectId);
    this.save();
  }

  // --- Worker Mutations ---
  addWorker(workerData) {
    const id = `w-${Date.now().toString().slice(-6)}`;
    const initials = (workerData.name || 'XX').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newWorker = {
      id,
      name: (workerData.name || '').toUpperCase(),
      role: workerData.role || 'ARCHITECTE',
      avatar: initials,
      email: workerData.email || '',
      phone: workerData.phone || '',
      status: 'checked_out',
      checkIn: '--:--',
      totalHoursMonth: 0,
      activeProjectsCount: 0,
      pin: workerData.pin || '0000'
    };
    if (!this.data.workers) this.data.workers = [];
    this.data.workers.push(newWorker);
    this.save();
    return newWorker;
  }

  updateWorker(workerId, updates) {
    const worker = (this.data.workers || []).find(w => w.id === workerId);
    if (worker) {
      if (updates.name) { worker.name = updates.name.toUpperCase(); worker.avatar = updates.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2); }
      if (updates.role !== undefined) worker.role = updates.role;
      if (updates.email !== undefined) worker.email = updates.email;
      if (updates.phone !== undefined) worker.phone = updates.phone;
      if (updates.pin !== undefined) worker.pin = updates.pin;
      this.save();
    }
  }

  deleteWorker(workerId) {
    this.data.workers = (this.data.workers || []).filter(w => w.id !== workerId);
    this.save();
  }

  // --- Client Mutations ---
  addClient(clientData) {
    const id = `c-${Date.now().toString().slice(-6)}`;
    const newClient = {
      id,
      name: (clientData.name || '').toUpperCase(),
      company: clientData.company || '',
      phone: clientData.phone || '',
      email: clientData.email || '',
      city: clientData.city || '',
      villasCount: 0,
      totalBilled: 0,
      status: clientData.status || 'Nouveau'
    };
    if (!this.data.clients) this.data.clients = [];
    this.data.clients.unshift(newClient);
    this.save();
    return newClient;
  }

  updateClient(clientId, updates) {
    const client = (this.data.clients || []).find(c => c.id === clientId);
    if (client) {
      if (updates.name) client.name = updates.name.toUpperCase();
      if (updates.company !== undefined) client.company = updates.company;
      if (updates.phone !== undefined) client.phone = updates.phone;
      if (updates.email !== undefined) client.email = updates.email;
      if (updates.city !== undefined) client.city = updates.city;
      if (updates.status !== undefined) client.status = updates.status;
      this.save();
    }
  }

  deleteClient(clientId) {
    this.data.clients = (this.data.clients || []).filter(c => c.id !== clientId);
    this.save();
  }

  // --- Invoice Mutations ---
  addInvoice(invoiceData) {
    const id = `inv-${Date.now().toString().slice(-4)}`;
    const count = (this.data.invoices || []).length + 80;
    const newInvoice = {
      id,
      number: `FACT-2026-${count.toString().padStart(3, '0')}`,
      projectId: invoiceData.projectId,
      projectName: invoiceData.projectName,
      clientName: invoiceData.clientName,
      milestone: invoiceData.milestone,
      amount: parseFloat(invoiceData.amount),
      tax: parseFloat(invoiceData.amount) * 0.19,
      totalAmount: parseFloat(invoiceData.amount) * 1.19,
      issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      status: invoiceData.status || "En attente",
      paidDate: invoiceData.status === "Payée" ? new Date().toISOString().split('T')[0] : null,
      paymentMethod: invoiceData.paymentMethod || "Virement Bancaire"
    };

    const project = (this.data.projects || []).find(p => p.id === invoiceData.projectId);
    if (project) {
      project.invoiced = (project.invoiced || 0) + newInvoice.amount;
      if (newInvoice.status === "Payée") {
        project.paid = (project.paid || 0) + newInvoice.amount;
      }
    }

    if (!this.data.invoices) this.data.invoices = [];
    this.data.invoices.unshift(newInvoice);
    this.save();
    return newInvoice;
  }

  toggleInvoiceStatus(invoiceId) {
    const inv = (this.data.invoices || []).find(i => i.id === invoiceId);
    if (inv) {
      const project = (this.data.projects || []).find(p => p.id === inv.projectId);
      if (inv.status === "Payée") {
        inv.status = "En attente";
        inv.paidDate = null;
        if (project) project.paid = Math.max(0, (project.paid || 0) - inv.amount);
      } else {
        inv.status = "Payée";
        inv.paidDate = new Date().toISOString().split('T')[0];
        if (project) project.paid = (project.paid || 0) + inv.amount;
      }
      this.save();
    }
  }

  // --- Punch Clock Mutation ---
  togglePresence() {
    if (!this.data.presence) {
      this.data.presence = { activePunchedIn: false, lastPunchTime: "--:--", currentLocation: "Studio", currentTask: "" };
    }
    this.data.presence.activePunchedIn = !this.data.presence.activePunchedIn;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.data.presence.lastPunchTime = timeStr;
    
    const userWorker = (this.data.workers || []).find(w => w.id === this.data.currentUser?.id);
    if (userWorker) {
      userWorker.status = this.data.presence.activePunchedIn ? "in_studio" : "checked_out";
      userWorker.checkIn = timeStr;
    }
    this.save();
    return this.data.presence;
  }

  // --- Multi-Criteria Universal Search Engine (Scoped by Role) ---
  searchAll(query) {
    if (!query || !query.trim()) {
      return { reports: [], projects: [], workers: [], clients: [], invoices: [] };
    }

    const q = query.toLowerCase().trim();
    const visibleReports = this.getDailyReports();
    const visibleProjects = this.getProjects();

    const matchedReports = visibleReports.filter(r => {
      return (
        r.workerName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        (r.displayDate && r.displayDate.toLowerCase().includes(q)) ||
        r.status.toLowerCase().includes(q) ||
        (r.summary?.achievements && r.summary.achievements.toLowerCase().includes(q)) ||
        (r.summary?.difficulties && r.summary.difficulties.toLowerCase().includes(q)) ||
        (r.summary?.tomorrowActions && r.summary.tomorrowActions.toLowerCase().includes(q)) ||
        (r.activities && r.activities.some(a => 
          a.activity.toLowerCase().includes(q) || 
          a.result.toLowerCase().includes(q) || 
          a.nextAction.toLowerCase().includes(q)
        ))
      );
    });

    const matchedProjects = visibleProjects.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.stage.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.keySpecs && (
          p.keySpecs.hsp.toLowerCase().includes(q) ||
          p.keySpecs.climatisation.toLowerCase().includes(q) ||
          p.keySpecs.piscine.toLowerCase().includes(q)
        ))
      );
    });

    const matchedWorkers = this.isAdmin() 
      ? (this.data.workers || []).filter(w => 
          w.name.toLowerCase().includes(q) || 
          w.role.toLowerCase().includes(q) || 
          w.email.toLowerCase().includes(q)
        )
      : (this.data.workers || []).filter(w => w.id === this.data.currentUser?.id && (w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q)));

    const matchedClients = this.isAdmin() ? (this.data.clients || []).filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }) : [];

    const matchedInvoices = this.isAdmin() ? (this.data.invoices || []).filter(i => {
      return (
        i.number.toLowerCase().includes(q) ||
        i.projectName.toLowerCase().includes(q) ||
        i.clientName.toLowerCase().includes(q) ||
        i.milestone.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q)
      );
    }) : [];

    return {
      reports: matchedReports,
      projects: matchedProjects,
      workers: matchedWorkers,
      clients: matchedClients,
      invoices: matchedInvoices
    };
  }

  formatDateFR(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}

export const store = new StudioStore();
