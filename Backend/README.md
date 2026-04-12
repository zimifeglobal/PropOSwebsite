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

## API Endpoints

| Base | Description |
|------|-------------|
| `GET /api/health` | Health check + DB status |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login (returns JWT) |
| `GET /api/portfolios` | Portfolios (auth) |
| `GET /api/assets` | Assets (auth + scoped) |
| `GET /api/finance/transactions` | Transactions (auth) |
| `POST /api/finance/reconciliation` | AI rent reconciliation |
| `GET /api/compliance/audit-status` | Compliance overview |
| `GET /api/insurance/policies` | Insurance policies |
| `POST /api/insurance/quote` | ESG quote engine |
| `GET /api/docs` | Swagger UI |

## Local Development

```bash
cd Backend
npm install
# Copy .env.example to .env and fill values
npm run dev      # ts-node-dev with hot reload
npm test         # 25 unit tests
npm run build    # compile to dist/
```

## Architecture

```
Backend/
├── src/
│   ├── app.ts              Express app factory
│   ├── server.ts           Entry point (DB + cron)
│   ├── config/             database.ts, swagger.ts
│   ├── models/             8 Mongoose schemas
│   ├── controllers/        8 domain controllers
│   ├── services/           auth, reconciliation, lease, compliance, insurance, cron
│   ├── middlewares/        auth, aml, validate, scope, error
│   ├── routes/             8 route files + index
│   ├── schemas/            7 Zod validation schemas
│   ├── utils/              logger, apiResponse, fuzzyMatch, generateToken
│   ├── types/              express.d.ts
│   └── tests/              reconciliation + compliance (25 tests)
└── public/                 Frontend static files (served by Express)
```
