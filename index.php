<!DOCTYPE html>
<html lang="fr" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Architect Interior Dashboard | Gestion de Studio</title>
  <meta name="description" content="Plateforme de gestion de studio d'architecture d'intérieur : fiches journalières, suivi des chantiers et facturation." />
  
  <!-- Google Fonts: Plus Jakarta Sans & Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="/src/styles/tokens.css" />
  <link rel="stylesheet" href="/src/styles/main.css" />
  <link rel="stylesheet" href="/src/styles/print-sheet.css" />
</head>
<body>
  <!-- Mobile Sidebar Backdrop -->
  <div id="sidebar-backdrop" class="sidebar-backdrop"></div>

  <div id="app" class="app-layout">
    <!-- Sidebar -->
    <aside id="sidebar-container" class="sidebar"></aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Top Header / Search Navigation -->
      <header id="header-container" class="top-header"></header>

      <!-- Dynamic View Container -->
      <main id="view-container" class="content-view" tabindex="-1"></main>
    </div>
  </div>

  <!-- Global Search Overlay / Command Palette -->
  <div id="global-search-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="search-modal-title"></div>

  <!-- Detailed Daily Report / Print Sheet Modal -->
  <div id="report-detail-modal" class="modal-overlay hidden" role="dialog" aria-modal="true"></div>

  <!-- New Daily Report Builder Modal -->
  <div id="new-report-modal" class="modal-overlay hidden" role="dialog" aria-modal="true"></div>

  <!-- New Invoice / Milestone Modal -->
  <div id="new-invoice-modal" class="modal-overlay hidden" role="dialog" aria-modal="true"></div>

  <!-- Authentication & User Switcher Modal -->
  <div id="auth-modal" class="modal-overlay hidden" role="dialog" aria-modal="true"></div>

  <!-- Toast Container -->
  <div id="toast-container" class="toast-container" aria-live="polite"></div>

  <!-- Application Main Script -->
  <script type="module" src="/src/main.js"></script>
</body>
</html>
