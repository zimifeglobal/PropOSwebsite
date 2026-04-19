# PropOS Enterprise Backend + Frontend

Institutional-grade UK PropTech API with integrated frontend. Single Render deployment serves both.

## Render Deployment (Web Service)

### Settings

| Field | Value |
|-------|-------|
| **Root Directory** | `Backend` |
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | 20 |

### Environment Variables (set in Render Dashboard)

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://zimifeglobal:<password>@firstcluster.8jwpjyi.mongodb.net/PropOSweb?retryWrites=true&w=majority
DB_NAME=PropOSweb
JWT_SECRET=<your-strong-secret-min-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<another-strong-secret>
REFRESH_TOKEN_EXPIRES_IN=7d
AML_THRESHOLD=10000
CRON_ENABLED=true
LOG_LEVEL=info
CLIENT_URL=https://your-app.onrender.com
```

> ⚠️ **Never commit `.env` to git** — configure these in Render's dashboard only.

## API Endpoints (summary)

| Base | Description |
|------|-------------|
| `GET /api/health` | Health check + DB status |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login (returns JWT) |
| `GET /api/portfolios` | Portfolios (auth) |
| `GET /api/assets` | Assets (auth + scoped) |
| `GET /api/units` | Units linked to assets (auth) |
| `GET /api/tenancies` | Tenancies (auth) |
| `GET /api/maintenance/...` | Maintenance tickets, SSE stream (auth) |
| `GET /api/finance/transactions` | Transactions (auth) |
| `POST /api/finance/reconciliation` | AI rent reconciliation |
| `GET /api/compliance/audit-status` | Compliance overview |
| `GET /api/insurance/policies` | Insurance policies |
| `POST /api/insurance/quote` | ESG quote engine |
| `POST /api/support/messages` | Support messages (auth) |
| `GET /api/docs` | Swagger UI |

The full contract is in **Swagger** at `/api/docs` after the server is running.

## Local Development

```bash
cd Backend
npm install
# Copy .env.example to .env and fill values
npm run dev      # ts-node-dev with hot reload
npm test         # 25 unit tests
npm run build    # compile to dist/ (gitignored — generate on deploy or locally)
npm run sync:public   # copy Frontend/PropOS-Entreprise-main → public/ (HTML, CSS, JS)
```

From the repo root you can also run `node scripts/sync-frontend-to-public.js` or `.\scripts\sync-frontend-to-public.ps1`.

> **`Backend/dist/`** is listed in `.gitignore`. Do not commit compiled JS; Render and other hosts should run `npm run build` so `dist/` matches `src/`.

## Architecture

```
Backend/
├── src/
│   ├── app.ts              Express app factory
│   ├── server.ts           Entry point (DB + cron)
│   ├── config/             database.ts, swagger.ts
│   ├── models/             Mongoose schemas (users, portfolios, assets, units, …)
│   ├── controllers/        Domain controllers (auth, portfolios, assets, units, …)
│   ├── services/           auth, reconciliation, lease, compliance, insurance, cron, maintenance-events
│   ├── middlewares/        auth, aml, validate, scope, error
│   ├── routes/             Route modules + index
│   ├── schemas/            Zod validation schemas
│   ├── utils/              logger, apiResponse, fuzzyMatch, generateToken
│   ├── types/              express.d.ts
│   └── tests/              reconciliation + compliance (25 tests)
└── public/                 Frontend static files (mirror of Frontend/PropOS-Entreprise-main)
```
