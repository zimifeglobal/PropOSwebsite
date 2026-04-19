# PropOS Enterprise — frontend (static SPA)

Vanilla HTML/CSS/JS login and dashboard. The **API base URL** is chosen in `js/config.js`:

- **Local:** `file://` or `localhost` → `http://localhost:5000/api` (run the backend from `Backend/`).
- **Same host as API** (e.g. Render web service) → `/api`.
- **Static host only** (e.g. some Vercel setups) → falls back to the configured Render API URL in `config.js`.

## Deploy workflow

1. Edit files here (`index.html`, `dashboard.html`, `css/`, `js/`).
2. From `Backend/`, run **`npm run sync:public`** to mirror this folder into `Backend/public/` (see repo `scripts/sync-frontend-to-public.js`).
3. Push to `main`; your host should run `npm install && npm run build` in `Backend/` and start with `npm start`.

In-app help: use **About & services** and **Getting started** on the dashboard (they describe Portfolios, Assets, Directory, Dispatcher, Finance, Compliance, Insurance, and Support).
