/**
 * Export helpers: Print Fiche, CSV generator, JSON backup download.
 */

export function printOfficialSheet() {
  window.print();
}

export function exportReportsToCSV(reports) {
  if (!reports || reports.length === 0) return;

  const headers = [
    "ID Rapport",
    "Date",
    "Collaborateur",
    "Fonction",
    "Heure Début",
    "Heure Fin",
    "Total Heures",
    "Projet / Villa",
    "Client",
    "Statut",
    "Activités Réalisées",
    "Réalisations Principales",
    "Difficultés Rencontrées",
    "Actions pour Demain"
  ];

  const rows = reports.map(r => {
    const actText = r.activities.map(a => `[${a.time}] ${a.activity} -> ${a.result}`).join(' | ');
    return [
      r.id,
      r.displayDate || r.date,
      `"${r.workerName.replace(/"/g, '""')}"`,
      `"${r.workerRole.replace(/"/g, '""')}"`,
      r.startTime,
      r.endTime,
      r.totalHours,
      `"${r.projectName.replace(/"/g, '""')}"`,
      `"${(r.clientName || '').replace(/"/g, '""')}"`,
      r.status,
      `"${actText.replace(/"/g, '""')}"`,
      `"${(r.summary.achievements || '').replace(/"/g, '""')}"`,
      `"${(r.summary.difficulties || '').replace(/"/g, '""')}"`,
      `"${(r.summary.tomorrowActions || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rapports_Journaliers_Atelier_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
