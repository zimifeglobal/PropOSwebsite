# PropOS Enterprise — static frontend (served by Express)

This folder is the **production copy** of the UI that ships with the API. Express serves it from `Backend/public/` when you deploy (for example on Render).

## Keeping frontend and backend in sync

1. **Source of truth for edits:** develop in `Frontend/PropOS-Entreprise-main/` (login, dashboard, CSS, `js/config.js`, etc.).
2. **Before deploy or commit:** copy the same files into `Backend/public/` so the hosted app and API stay aligned:
   - `index.html`, `dashboard.html`
   - `css/style.css`
   - `js/*.js` (including `config.js`, `auth.js`, `dashboard.js`, `locations-data.js`)

The API base URL is resolved in `js/config.js` (localhost for dev, `/api` on same host as the backend, or the Render API URL for static hosts).

## Build output

Server-side TypeScript compiles to `Backend/dist/` via `npm run build`. That folder is **not** committed to git; your host should run `npm install && npm run build` on each deploy.
