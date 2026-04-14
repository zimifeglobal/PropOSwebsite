import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import apiRoutes from './routes/index';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app = express();

// ─── Security ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────
// CLIENT_URL can be a comma-separated list for multiple allowed origins.
// e.g. on Render: CLIENT_URL=https://propos.elitestays.name.ng
const envOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...envOrigins,
  'https://propos.elitestays.name.ng', // production frontend
  'https://itestays.name.ng',
  'https://www.itestays.name.ng',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return cb(null, true);
      // Allow exact matches
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow any Vercel preview/production deployment automatically
      if (/^https:\/\/[\w-]+(\.vercel\.app)$/.test(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Swagger Docs ──────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'PropOS Enterprise API Docs',
  customCss: '.swagger-ui .topbar { background: #6366f1; }',
}));

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Root ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  const publicDir = path.join(__dirname, '../public');
  const indexFile = path.join(publicDir, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.json({
      success: true,
      message: '🚀 PropOS Enterprise API v1.0',
      docs: '/api/docs',
      health: '/api/health',
    });
  }
});

// ─── Static Frontend (production) ──────────────────────────────────
// Serves frontend from Backend/public/ when deployed on Render
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback: non-API, non-static requests serve index.html
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/');
  }
});

// ─── Error Handling ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
