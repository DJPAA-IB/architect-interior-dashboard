# Architect Interior Dashboard

A studio management dashboard for an interior architecture firm. Built with vanilla JavaScript, Vite and Chart.js. It tracks daily work reports, projects, clients, team members, invoices and revenue in one place.

<!-- Add a screenshot: save it as docs/screenshot.png and uncomment the line below -->
<!-- ![Dashboard screenshot](docs/screenshot.png) -->

## Features

- **Dashboard**: overview of activity, hours worked and project status
- **Daily reports**: workers log their activities and hours. Reports can be validated and printed as official report sheets
- **Projects and clients**: track every project and the client it belongs to
- **Team**: manage workers and their roles
- **Revenue and invoices**: create invoices and follow revenue over time (admin only)
- **Analytics**: interactive charts powered by Chart.js
- **Global search**: find reports, projects and clients quickly
- **Admin-protected routes**: revenue, clients and settings are behind an admin login (initial password set via `VITE_ADMIN_PASSWORD` in `.env`)
- **Export helpers**: export and print data

## Tech Stack

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | Vanilla JavaScript (ES modules), CSS   |
| Build    | Vite 6                                 |
| Charts   | Chart.js 4                             |
| Icons    | Lucide                                 |
| Server   | Node.js (`server.js`) with a JSON file store |

## Project Structure

```
src/
├── components/   # Header, Sidebar, modals, toasts
├── views/        # Dashboard, Reports, Projects, Revenue, Team, Clients, Analytics, Settings
├── data/         # Client-side store
├── utils/        # Formatters and export helpers
└── styles/       # Design tokens, main and print styles
server.js         # Production server + /api/data endpoint
```

## Getting Started

**Requirements:** Node.js 18 or newer.

```bash
git clone https://github.com/DJPAA-IB/architect-interior-dashboard.git
cd architect-interior-dashboard
npm install
cp .env.example .env   # then set VITE_ADMIN_PASSWORD

# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

The development server runs at `http://localhost:5173`.

## Deployment

See [DEPLOYMENT_WALKTHROUGH.md](DEPLOYMENT_WALKTHROUGH.md) for a full guide (in French): local network deployment with PM2, and public deployment with HTTPS and a domain name.

## Author

**Ibrahim**: [@DJPAA-IB](https://github.com/DJPAA-IB)
