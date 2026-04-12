/* ─── Auth page logic ──────────────────────────────────────────── */

// Redirect to dashboard if already logged in
redirectIfAuth();

// Check API health on load
window.addEventListener('DOMContentLoaded', checkApiStatus);

async function checkApiStatus() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const data = await api.get('/health');
    dot.className    = 'status-dot green';
    text.textContent = `Connected · DB: ${data.database?.name || 'PropOSweb'}`;
  } catch {
    dot.className    = 'status-dot red';
    text.textContent = 'Backend offline — check connection';
  }
}

/* ─── Tab switching ─────────────────────────────────────────────── */
function switchTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  hideAlert();
}

/* ─── Alert helpers ─────────────────────────────────────────────── */
function showAlert(msg, type = 'error') {
  const el = document.getElementById('alert');
  el.textContent = msg;
  el.className = `alert ${type}`;
}
function hideAlert() {
  document.getElementById('alert').className = 'alert hidden';
}

/* ─── Password toggle ───────────────────────────────────────────── */
function togglePassword(inputId, btn) {
  const inp = document.getElementById(inputId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

/* ─── Loading state ─────────────────────────────────────────────── */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

/* ─── Login ─────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  hideAlert();
  setLoading('login-btn', true);

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await api.post('/auth/login', { email, password });

    // Handle MFA requirement
    if (res.data?.mfa_required) {
      showAlert('MFA is required for this account. Please contact your administrator.', 'error');
      return;
    }

    saveSession(res.data.accessToken, res.data.refreshToken, res.data.user);
    showAlert('Login successful! Redirecting…', 'success');
    setTimeout(() => (window.location.href = 'dashboard.html'), 800);
  } catch (err) {
    showAlert(err.message || 'Login failed. Check your credentials.');
  } finally {
    setLoading('login-btn', false);
  }
}

/* ─── Register ──────────────────────────────────────────────────── */
async function handleRegister(e) {
  e.preventDefault();
  hideAlert();
  setLoading('register-btn', true);

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    setLoading('register-btn', false);
    return;
  }

  try {
    const res = await api.post('/auth/register', { name, email, password, role });
    saveSession(res.data.accessToken, res.data.refreshToken, res.data.user);
    showAlert('Account created! Redirecting…', 'success');
    setTimeout(() => (window.location.href = 'dashboard.html'), 800);
  } catch (err) {
    showAlert(err.message || 'Registration failed.');
  } finally {
    setLoading('register-btn', false);
  }
}
