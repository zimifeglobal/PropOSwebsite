/* ─── PropOS Enterprise — Global API Config ────────────────────── */

/**
 * Auto-detect API base URL:
 * - Local dev (file:// or localhost)  → http://localhost:5000/api
 * - Production (Vercel frontend)      → Render backend URL
 *
 * ⚠️  Replace RENDER_BACKEND_URL below with your actual Render service URL.
 *     Example: 'https://proposwebsite.onrender.com/api'
 */
const RENDER_BACKEND_URL = 'https://proposwebsite.onrender.com/api';

const API_BASE = (() => {
  const { hostname, protocol } = window.location;
  if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Frontend is on Vercel, backend is on Render — must use the full absolute URL.
  return RENDER_BACKEND_URL;
})();

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
      const data = await res.json();
      if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' };
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
