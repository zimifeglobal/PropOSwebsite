/* ─── PropOS Enterprise — Global API Config ────────────────────── */

/**
 * Auto-detect API base URL:
 * - Local file/localhost development -> localhost backend
 * - Hosted frontend + hosted backend on same domain -> /api
 * - Optional override via window.__PROPOS_API_BASE__
 */
const RENDER_API = 'https://proposwebsite.onrender.com/api';

const API_BASE = (() => {
  if (typeof window.__PROPOS_API_BASE__ === 'string' && window.__PROPOS_API_BASE__.trim()) {
    return window.__PROPOS_API_BASE__.trim().replace(/\/$/, '');
  }
  const { hostname, protocol } = window.location;
  if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  /* Backend serves this SPA from the same host — use relative /api */
  if (hostname === 'proposwebsite.onrender.com') {
    return '/api';
  }
  /* Vercel (*.vercel.app), custom domains, and any other static host: call Render directly */
  return RENDER_API;
})();

function getApiBase() {
  return API_BASE;
}

const api = {
  /** Generic fetch wrapper with auth header */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('propos_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const rawBody = await res.text();
      let data = null;
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        const fallbackMessage = rawBody && !data
          ? `Server returned non-JSON (HTTP ${res.status}). Static hosts must use the Render API URL — redeploy the latest frontend.`
          : 'Request failed';
        throw { status: res.status, message: data?.message || fallbackMessage };
      }

      if (!data) {
        throw { status: res.status, message: 'Invalid JSON response from server.' };
      }

      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw { status: 0, message: 'Cannot reach server. Check your connection.' };
      }
      throw err;
    }
  },

  get:    (endpoint)       => api.request(endpoint, { method: 'GET' }),
  post:   (endpoint, body) => api.request(endpoint, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (endpoint, body) => api.request(endpoint, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  (endpoint, body) => api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint)       => api.request(endpoint, { method: 'DELETE' }),
};

/* ─── Session helpers ─────────────────────────────────────────── */
function saveSession(accessToken, refreshToken, user) {
  localStorage.setItem('propos_token', accessToken);
  localStorage.setItem('propos_refresh', refreshToken);
  localStorage.setItem('propos_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('propos_token');
  localStorage.removeItem('propos_refresh');
  localStorage.removeItem('propos_user');
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('propos_user')); }
  catch { return null; }
}

function requireAuth() {
  if (!localStorage.getItem('propos_token')) window.location.href = 'index.html';
}

function redirectIfAuth() {
  if (localStorage.getItem('propos_token')) window.location.href = 'dashboard.html';
}

/* ─── Formatters ──────────────────────────────────────────────── */
const fmt = {
  currency: (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
  number:   (n) => Number(n || 0).toLocaleString('en-GB'),
  date:     (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  datetime: (d) => d ? new Date(d).toLocaleString('en-GB') : '—',
  percent:  (n) => `${Number(n || 0).toFixed(1)}%`,
};
