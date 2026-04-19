/* ─── PropOS Enterprise — Global API Config ────────────────────── */

/**
 * Auto-detect API base URL:
 * - Local file/localhost development -> localhost backend
 * - Hosted frontend + hosted backend on same domain -> /api
 * - Optional override via window.__PROPOS_API_BASE__
 * - Local port override: window.__PROPOS_API_PORT__ (default 5000, must match Backend PORT)
 */
const RENDER_API = 'https://proposwebsite.onrender.com/api';

/**
 * Hostnames where the SPA is served by the same Express app as the API — use /api (same origin).
 * Must match any production custom domains that point at this Render service (see Backend CORS).
 */
const SAME_ORIGIN_API_HOSTS = new Set([
  'proposwebsite.onrender.com',
  'www.proposwebsite.onrender.com',
  'propos.elitestays.name.ng',
  'www.propos.elitestays.name.ng',
  'itestays.name.ng',
  'www.itestays.name.ng',
]);

function shouldUseRelativeApi(hostname) {
  if (hostname.endsWith('.onrender.com')) return true;
  return SAME_ORIGIN_API_HOSTS.has(hostname);
}

const API_BASE = (() => {
  if (typeof window.__PROPOS_API_BASE__ === 'string' && window.__PROPOS_API_BASE__.trim()) {
    return window.__PROPOS_API_BASE__.trim().replace(/\/$/, '');
  }
  const { hostname, protocol } = window.location;
  if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
    const localPort =
      typeof window.__PROPOS_API_PORT__ === 'string' && window.__PROPOS_API_PORT__.trim()
        ? window.__PROPOS_API_PORT__.trim()
        : '5000';
    const localHost = protocol === 'file:' || !hostname ? 'localhost' : hostname;
    return `http://${localHost}:${localPort}/api`;
  }
  /* Static-only deploy on Vercel — API stays on Render (cross-origin, CORS) */
  if (/\.vercel\.app$/i.test(hostname)) {
    return RENDER_API;
  }
  /* Same deployment (Render default host, preview URLs, or listed custom domains) */
  if (shouldUseRelativeApi(hostname)) {
    return '/api';
  }
  return RENDER_API;
})();

function getApiBase() {
  return API_BASE;
}

/** Endpoints where 401 must not trigger refresh (login/register/refresh). */
function shouldAttemptRefresh(endpoint) {
  if (/^\/auth\/(login|register|refresh)(\?|$)/.test(endpoint)) return false;
  if (!localStorage.getItem('propos_refresh')) return false;
  return true;
}

let refreshPromise = null;

/**
 * Uses POST /auth/refresh to rotate tokens. Shared across concurrent 401s.
 * @returns {Promise<boolean>} true if new access token is stored
 */
async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = localStorage.getItem('propos_refresh');
      if (!rt) return false;
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        const rawBody = await res.text();
        let data = null;
        if (rawBody) {
          try {
            data = JSON.parse(rawBody);
          } catch {
            data = null;
          }
        }
        const accessToken = data?.data?.accessToken;
        const newRefresh = data?.data?.refreshToken;
        if (!res.ok || !data?.success || !accessToken || !newRefresh) {
          clearSession();
          window.location.href = 'index.html';
          return false;
        }
        localStorage.setItem('propos_token', accessToken);
        localStorage.setItem('propos_refresh', newRefresh);
        return true;
      } catch {
        clearSession();
        window.location.href = 'index.html';
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

const api = {
  /** Exposed for SSE and other raw fetch callers that need the same refresh behaviour */
  refreshSession,

  /** Generic fetch wrapper with auth header and one automatic refresh+retry on 401 */
  async request(endpoint, options = {}, isRetry = false) {
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

      if (res.status === 401 && !isRetry && shouldAttemptRefresh(endpoint)) {
        const renewed = await refreshSession();
        if (renewed) {
          return api.request(endpoint, options, true);
        }
        throw {
          status: 401,
          message: data?.message || 'Session expired. Please sign in again.',
        };
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
      if (err && err.message === 'Failed to fetch') {
        throw {
          status: 0,
          message:
            'Cannot reach the API (network or browser security). If you use a custom domain, ensure it points at this app and redeploy the latest frontend. Try refreshing the page or use the official site URL.',
        };
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
