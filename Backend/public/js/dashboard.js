/* ─── Dashboard JS — real data from all API endpoints ─────────── */
requireAuth();
const user = getCurrentUser();

// ─── State ────────────────────────────────────────────────────────
let allPortfolios = [];
let allAssets     = [];
let allTransactions = [];
let allDirectoryUnits = [];
let directoryScrollScheduled = false;
let dispatcherStreamAbort = null;
let dispatcherReconnectTimer = null;
let assignTicketId = null;

const DIR_ROW_H = 56;

/** Preset labels for new portfolios (users pick one or enter a custom name). */
const PORTFOLIO_NAME_TEMPLATES = [
  'UK Prime Residential',
  'Build to Rent (BTR)',
  'Commercial Office',
  'Retail & Leisure',
  'Industrial & Logistics',
  'Mixed Use',
  'Student Housing',
  'Senior Living',
  'Development & Construction',
];

// ─── Bootstrap ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  populateSidebar();
  setupNav();
  setupResponsiveSidebar();
  await refreshAll();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSupportDrawer();
      closeModal();
      closeMobileSidebar();
    }
  });
});

const MOBILE_SIDEBAR_BP = 768;

function isMobileSidebarLayout() {
  return typeof window.matchMedia === 'function' && window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BP}px)`).matches;
}

function setupResponsiveSidebar() {
  const reset = () => {
    const sb = document.getElementById('sidebar');
    const main = document.querySelector('.main-wrap');
    const bd = document.getElementById('sidebar-backdrop');
    if (isMobileSidebarLayout()) {
      sb?.classList.remove('collapsed');
      main?.classList.remove('expanded');
      sb?.classList.remove('is-open');
      bd?.classList.add('hidden');
    } else {
      sb?.classList.remove('is-open');
      bd?.classList.add('hidden');
    }
  };
  window.addEventListener('resize', reset, { passive: true });
  reset();
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('is-open');
  document.getElementById('sidebar-backdrop')?.classList.add('hidden');
}

async function refreshAll() {
  await Promise.allSettled([
    loadOverview(),
    loadPortfolios(),
    loadAssets(),
    loadTransactions(),
    loadCompliance(),
    loadInsurance(),
    loadProfile(),
    loadDirectoryUnits(),
    loadMaintenanceTickets(),
  ]);
}

// ─── Sidebar ──────────────────────────────────────────────────────
function populateSidebar() {
  if (!user) return;
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  document.getElementById('user-avatar').textContent    = initials;
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent   = user.name;
  document.getElementById('sidebar-role').textContent   = cap(user.role);
  applyRoleBasedNav();
}

function applyRoleBasedNav() {
  if (!user) return;
  document.querySelectorAll('[data-show-roles]').forEach((el) => {
    const roles = (el.getAttribute('data-show-roles') || '').split(/\s*,\s*/).filter(Boolean);
    if (!roles.length) return;
    el.style.display = roles.includes(user.role) ? '' : 'none';
  });
}

// ─── Navigation ───────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.section);
    });
  });
}

function navigateTo(section) {
  if (isMobileSidebarLayout()) closeMobileSidebar();
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  document.querySelectorAll('.section').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }
  const titles = {
    overview: 'Overview',
    portfolios: 'Portfolios',
    assets: 'Assets',
    directory: 'Directory',
    dispatcher: 'Dispatcher',
    finance: 'Finance',
    compliance: 'Compliance',
    insurance: 'Insurance',
    profile: 'Profile',
  };
  document.getElementById('page-title').textContent = titles[section] || cap(section);

  if (section === 'dispatcher') {
    loadMaintenanceTickets();
    startDispatcherRealtime();
  } else {
    stopDispatcherRealtime();
  }
  if (section === 'directory') {
    scheduleDirectoryRedraw();
  }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.querySelector('.main-wrap');
  const bd = document.getElementById('sidebar-backdrop');
  if (!sb || !main) return;
  if (isMobileSidebarLayout()) {
    sb.classList.remove('collapsed');
    const open = sb.classList.toggle('is-open');
    bd?.classList.toggle('hidden', !open);
    return;
  }
  sb.classList.toggle('collapsed');
  main.classList.toggle('expanded');
}

// ─── OVERVIEW ─────────────────────────────────────────────────────
async function loadOverview() {
  try {
    const [pfData, assetData, txData, compData] = await Promise.allSettled([
      api.get('/portfolios'),
      api.get('/assets'),
      api.get('/finance/transactions?limit=5'),
      api.get('/compliance/audit-status'),
    ]);

    // Stats
    const pfCount = pfData.value?.data?.length || 0;
    const assetCount = assetData.value?.data?.length || 0;
    const totalAum = (pfData.value?.data || []).reduce((s, p) => s + (p.total_aum || 0), 0);
    const compStatus = compData.value?.data?.overallStatus || '—';

    document.getElementById('stat-portfolios').textContent = pfCount;
    document.getElementById('stat-assets').textContent     = assetCount;
    document.getElementById('stat-aum').textContent        = fmt.currency(totalAum);
    document.getElementById('stat-compliance').textContent = cap(compStatus);

    // Recent transactions
    const txs = txData.value?.data || [];
    document.getElementById('badge-txs').textContent = txData.value?.meta?.total || 0;
    renderRecentTxs(txs);

    // Compliance summary
    const cSummary = compData.value?.data || {};
    renderComplianceSummary(cSummary);

    const health = await api.get('/health');
    const statusEl = document.getElementById('topbar-status');
    const labelEl = document.getElementById('conn-label');
    if (labelEl) labelEl.textContent = 'Connected';
    if (statusEl) {
      statusEl.title = `Services online · ${health.environment || 'production'} · ${health.database?.name || 'database'}`;
    }
  } catch (e) {
    console.error('Overview load error:', e);
    const labelEl = document.getElementById('conn-label');
    if (labelEl) labelEl.textContent = 'Check connection';
  }
}

function renderRecentTxs(txs) {
  if (!txs.length) {
    document.getElementById('recent-txs').innerHTML =
      '<p class="empty-msg">No transactions yet. <button type="button" class="link-inline" onclick="navigateTo(\'finance\')">Add one</button></p>';
    return;
  }
  document.getElementById('recent-txs').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Ref</th><th>Amount</th><th>Dir</th><th>Category</th><th>AML</th><th>Date</th></tr></thead>
      <tbody>${txs.map(t => `
        <tr>
          <td><code style="font-size:0.75rem">${esc(t.bank_ref)}</code></td>
          <td><strong>${fmt.currency(t.amount)}</strong></td>
          <td><span class="dir-badge ${t.direction}">${t.direction === 'in' ? '⬇ In' : '⬆ Out'}</span></td>
          <td>${cap(t.category)}</td>
          <td>${t.aml_flagged ? '<span class="status-pill inactive">🚨 Flagged</span>' : '<span class="status-pill active">Clear</span>'}</td>
          <td>${fmt.date(t.date)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderComplianceSummary(cData) {
  const summary = cData.summary || {};
  const types = Object.keys(summary);
  if (!types.length) {
    document.getElementById('compliance-summary').innerHTML = '<p class="empty-msg">No compliance data yet.</p>';
    return;
  }
  document.getElementById('compliance-summary').innerHTML = `
    <div style="padding:1rem;display:flex;flex-direction:column;gap:0.65rem;">
      <div class="meta-item"><span class="meta-label">Overall Status</span><span class="role-badge ${cData.overallStatus === 'pass' ? 'cashier' : cData.overallStatus === 'flagged' ? 'admin' : 'manager'}">${cap(cData.overallStatus || '—')}</span></div>
      <div class="meta-item"><span class="meta-label">Flagged Items</span><span style="color:var(--red);font-weight:700">${cData.flaggedCount || 0}</span></div>
      <div class="meta-item"><span class="meta-label">Pending Review</span><span style="color:var(--orange);font-weight:700">${cData.pendingCount || 0}</span></div>
      <div class="meta-item"><span class="meta-label">Total Logs</span><span>${cData.totalLogs || 0}</span></div>
    </div>`;
}

// ─── PORTFOLIOS ───────────────────────────────────────────────────
async function loadPortfolios() {
  try {
    const data = await api.get('/portfolios');
    allPortfolios = data.data || [];
    renderPortfolios();
  } catch (e) {
    document.getElementById('portfolios-list').innerHTML = `<p class="empty-msg error">${e.message}</p>`;
  }
}

function renderPortfolios() {
  const el = document.getElementById('portfolios-list');
  if (!allPortfolios.length) {
    el.innerHTML = `<div style="padding:2rem;text-align:center">
      <p class="empty-msg">No portfolios yet.</p>
      <button class="btn-primary" style="width:auto;margin-top:1rem" onclick="showCreatePortfolioModal()">Create Your First Portfolio</button>
    </div>`;
    return;
  }
  el.innerHTML = `
    <div class="cards-grid">
      ${allPortfolios.map(p => `
        <div class="info-card">
          <div class="info-card-top">
            <div>
              <div class="info-card-title">${esc(p.name)}</div>
              <div class="info-card-sub">${p.currency} Portfolio</div>
            </div>
            <span class="role-badge manager">${p.currency}</span>
          </div>
          <div class="info-card-stats">
            <div class="info-stat"><span class="meta-label">Total AUM</span><strong>${fmt.currency(p.total_aum)}</strong></div>
            <div class="info-stat"><span class="meta-label">Created</span><span>${fmt.date(p.createdAt)}</span></div>
          </div>
          ${p.description ? `<p style="font-size:0.8rem;color:var(--muted);margin-top:0.5rem">${esc(p.description)}</p>` : ''}
        </div>`).join('')}
    </div>`;
}

function portfolioNameTemplateOptionsHtml() {
  const taken = new Set((allPortfolios || []).map((p) => String(p.name).trim().toLowerCase()));
  const parts = PORTFOLIO_NAME_TEMPLATES.map((label) => {
    const exists = taken.has(label.toLowerCase());
    const dis = exists ? ' disabled' : '';
    const suffix = exists ? ' (already added)' : '';
    return `<option value="${escAttr(label)}"${dis}>${esc(label + suffix)}</option>`;
  });
  return (
    `<option value="">— Select a portfolio name —</option>` +
    parts.join('') +
    `<option value="__custom__">Custom name…</option>`
  );
}

function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function onPortfolioNamePresetChange() {
  const preset = document.getElementById('pf-name-preset');
  const wrap = document.getElementById('pf-name-custom-wrap');
  const input = document.getElementById('pf-name-custom');
  if (!preset || !wrap || !input) return;
  const custom = preset.value === '__custom__';
  wrap.classList.toggle('hidden', !custom);
  input.required = custom;
  if (!custom) input.value = '';
}

function showCreatePortfolioModal() {
  openModal('New Portfolio', `
    <form onsubmit="submitPortfolio(event)" style="display:flex;flex-direction:column;gap:1rem;padding:1.25rem">
      <div class="form-group">
        <label for="pf-name-preset">Portfolio name</label>
        <select class="filter-select" id="pf-name-preset" style="width:100%" required onchange="onPortfolioNamePresetChange()">
          ${portfolioNameTemplateOptionsHtml()}
        </select>
      </div>
      <div class="form-group hidden" id="pf-name-custom-wrap">
        <label for="pf-name-custom">Custom name</label>
        <input class="filter-input" id="pf-name-custom" placeholder="e.g. UK Prime Residential Q2" style="width:100%"/>
      </div>
      <div class="form-group"><label>Currency</label><select class="filter-select" id="pf-currency" style="width:100%"><option>GBP</option><option>USD</option><option>EUR</option></select></div>
      <div class="form-group"><label>Total AUM (£)</label><input type="number" class="filter-input" id="pf-aum" placeholder="0" style="width:100%"/></div>
      <div class="form-group"><label>Description</label><textarea class="filter-input" id="pf-desc" placeholder="Optional description…" style="width:100%;height:70px;resize:vertical"></textarea></div>
      <button type="submit" class="btn-primary">Create Portfolio</button>
    </form>`);
  onPortfolioNamePresetChange();
}

async function submitPortfolio(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const preset = document.getElementById('pf-name-preset');
    const custom = document.getElementById('pf-name-custom');
    let name = '';
    if (preset?.value === '__custom__') {
      name = custom?.value.trim() || '';
    } else {
      name = preset?.value.trim() || '';
    }
    if (!name) {
      showModalError('Please select a portfolio name from the list or enter a custom name.');
      btn.disabled = false;
      btn.textContent = 'Create Portfolio';
      return;
    }
    await api.post('/portfolios', {
      name,
      currency: document.getElementById('pf-currency').value,
      total_aum: parseFloat(document.getElementById('pf-aum').value) || 0,
      description: document.getElementById('pf-desc').value.trim(),
    });
    closeModal();
    await loadPortfolios();
    await loadOverview();
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Create Portfolio';
    showModalError(err.message);
  }
}

// ─── ASSETS ───────────────────────────────────────────────────────
async function loadAssets() {
  try {
    const data = await api.get('/assets');
    allAssets = data.data || [];
    renderAssets(allAssets);
    // Populate quote dropdown
    const select = document.getElementById('quote-asset');
    if (select) {
      select.innerHTML = '<option value="">Select asset…</option>' +
        allAssets.map(a => `<option value="${a._id}">${esc(a.name)}</option>`).join('');
    }
  } catch (e) {
    document.getElementById('assets-list').innerHTML = `<p class="empty-msg error">${e.message}</p>`;
  }
}

function filterAssets() {
  const q = document.getElementById('asset-search')?.value.toLowerCase() || '';
  const filtered = allAssets.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.address?.city?.toLowerCase().includes(q) ||
    a.address?.postcode?.toLowerCase().includes(q)
  );
  renderAssets(filtered);
}

function renderAssets(assets) {
  const el = document.getElementById('assets-list');
  if (!assets.length) {
    el.innerHTML = `<div style="padding:2rem;text-align:center">
      <p class="empty-msg">No assets found.</p>
      <button class="btn-primary" style="width:auto;margin-top:1rem" onclick="showCreateAssetModal()">Add First Asset</button>
    </div>`;
    return;
  }
  el.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Name</th><th>Address</th><th>Type</th><th>ESG</th><th>Health</th><th>Value</th><th>Added</th></tr></thead>
      <tbody>${assets.map(a => `
        <tr>
          <td><strong>${esc(a.name)}</strong></td>
          <td>${esc(a.address?.street)}, ${esc(a.address?.city)}<br><code style="font-size:0.72rem">${esc(a.address?.postcode)}</code></td>
          <td><span class="role-badge manager">${cap(a.property_type || '—')}</span></td>
          <td><div class="score-bar"><div class="score-fill" style="width:${a.esg_score}%;background:${esgColor(a.esg_score)}"></div></div><small>${a.esg_score}/100</small></td>
          <td><div class="score-bar"><div class="score-fill" style="width:${a.building_health_score}%;background:${esgColor(a.building_health_score)}"></div></div><small>${a.building_health_score}/100</small></td>
          <td>${fmt.currency(a.total_value)}</td>
          <td>${fmt.date(a.createdAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function esgColor(score) {
  if (score >= 70) return 'var(--green)';
  if (score >= 40) return 'var(--orange)';
  return 'var(--red)';
}

function showCreateAssetModal() {
  if (!allPortfolios.length) {
    alert('Please create a portfolio first.');
    navigateTo('portfolios');
    return;
  }
  openModal('Add Property Asset', `
    <form onsubmit="submitAsset(event)" style="display:flex;flex-direction:column;gap:0.9rem;padding:1.25rem">
      <div class="form-group"><label>Portfolio</label><select class="filter-select" id="a-portfolio" style="width:100%" required>${allPortfolios.map(p => `<option value="${p._id}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Asset Name</label><input class="filter-input" id="a-name" placeholder="e.g. One Thames View" required style="width:100%"/></div>
      <div class="form-group"><label>Street</label><input class="filter-input" id="a-street" placeholder="123 Main Street" required style="width:100%"/></div>
      <div class="form-group form-row">
        <div class="form-group" style="flex:1;position:relative;min-width:0">
          <label>City</label>
          <input class="filter-input" id="a-city" placeholder="Search city…" autocomplete="off" required style="width:100%"/>
          <ul class="city-suggestions hidden" id="a-city-suggestions" role="listbox" aria-label="City suggestions"></ul>
        </div>
        <div style="flex:1"><label>Postcode</label><input class="filter-input" id="a-postcode" placeholder="SW1A 1AA or 101241" required style="width:100%"/></div>
      </div>
      <div class="form-group form-row">
        <div style="flex:1"><label>ESG Score (0–100)</label><input type="number" class="filter-input" id="a-esg" value="50" min="0" max="100" style="width:100%"/></div>
        <div style="flex:1"><label>Property Type</label><select class="filter-select" id="a-type" style="width:100%"><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="mixed">Mixed</option><option value="industrial">Industrial</option></select></div>
      </div>
      <div class="form-group"><label>Total Value (£)</label><input type="number" class="filter-input" id="a-value" placeholder="0" required style="width:100%"/></div>
      <button type="submit" class="btn-primary">Add Asset</button>
    </form>`);
  initCityAutocomplete();
}

function initCityAutocomplete() {
  const input = document.getElementById('a-city');
  const list = document.getElementById('a-city-suggestions');
  if (!input || !list) return;
  const all = window.PROPOS_ADDRESS_CITIES || [];
  const render = (filter) => {
    const q = (filter || '').trim().toLowerCase();
    const rows = !q
      ? all.slice(0, 28)
      : all.filter((c) => c.toLowerCase().includes(q)).slice(0, 36);
    if (!rows.length) {
      list.innerHTML = '<li class="city-suggestion-empty">No match — try another spelling.</li>';
      list.classList.remove('hidden');
      return;
    }
    list.innerHTML = rows
      .map((c) => `<li class="city-suggestion-item" role="option">${esc(c)}</li>`)
      .join('');
    list.querySelectorAll('.city-suggestion-item').forEach((li) => {
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        input.value = li.textContent;
        list.classList.add('hidden');
      });
    });
    list.classList.remove('hidden');
  };
  input.addEventListener('focus', () => render(input.value));
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') list.classList.add('hidden');
  });
  input.addEventListener('blur', () => setTimeout(() => list.classList.add('hidden'), 200));
}

function isKnownCity(name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return false;
  return (window.PROPOS_ADDRESS_CITIES || []).some((c) => c.toLowerCase() === n);
}

async function submitAsset(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Adding…';
  try {
    const cityRaw = document.getElementById('a-city').value.trim();
    if (!isKnownCity(cityRaw)) {
      showModalError('Please choose a city from the suggestions list.');
      btn.disabled = false;
      btn.textContent = 'Add Asset';
      return;
    }
    const cityCanonical =
      (window.PROPOS_ADDRESS_CITIES || []).find((c) => c.toLowerCase() === cityRaw.toLowerCase()) || cityRaw;
    await api.post('/assets', {
      portfolio_id: document.getElementById('a-portfolio').value,
      name: document.getElementById('a-name').value.trim(),
      address: {
        street: document.getElementById('a-street').value.trim(),
        city: cityCanonical,
        postcode: document.getElementById('a-postcode').value.trim().toUpperCase(),
      },
      esg_score: parseInt(document.getElementById('a-esg').value) || 50,
      property_type: document.getElementById('a-type').value,
      total_value: parseFloat(document.getElementById('a-value').value) || 0,
    });
    closeModal();
    await loadAssets();
    await loadOverview();
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Add Asset';
    showModalError(err.message);
  }
}

// ─── DIRECTORY (virtual list) & MAINTENANCE ───────────────────────
function getFilteredDirectoryUnits() {
  const status = document.getElementById('directory-filter-status')?.value || '';
  const rows = allDirectoryUnits || [];
  if (status === 'occupied' || status === 'vacant') {
    return rows.filter((u) => u.status === status);
  }
  return rows;
}

function scheduleDirectoryRedraw() {
  if (directoryScrollScheduled) return;
  directoryScrollScheduled = true;
  requestAnimationFrame(() => {
    directoryScrollScheduled = false;
    renderDirectoryVirtual();
  });
}

function renderDirectoryVirtual() {
  const wrap = document.getElementById('directory-viewport');
  const inner = document.getElementById('directory-virtual-inner');
  if (!wrap || !inner) return;

  const rows = getFilteredDirectoryUnits();
  const total = rows.length;
  inner.innerHTML = '';

  if (!total) {
    inner.style.minHeight = '0';
    inner.innerHTML =
      '<p class="directory-empty" style="padding:1rem 1.25rem">No units match this filter.</p>';
    return;
  }
  inner.style.minHeight = `${total * DIR_ROW_H}px`;

  const st = wrap.scrollTop;
  const vh = wrap.clientHeight;
  const buf = 8;
  let start = Math.max(0, Math.floor(st / DIR_ROW_H) - buf);
  let end = Math.min(total, Math.ceil((st + vh) / DIR_ROW_H) + buf);

  for (let i = start; i < end; i += 1) {
    const u = rows[i];
    const row = document.createElement('div');
    row.className = 'directory-row';
    row.style.top = `${i * DIR_ROW_H}px`;
    const asset = u.asset_id;
    const assetName = asset?.name || '—';
    const city = asset?.address?.city || '';
    const post = asset?.address?.postcode || '';
    const uid = String(u._id || '');
    row.innerHTML = `
      <div class="directory-row__main">
        <strong>${esc(assetName)}</strong>
        <span class="directory-row__unit">Unit ${esc(u.unit_number)}</span>
      </div>
      <div class="directory-row__addr">${esc(city)} · ${esc(post)}</div>
      <div class="directory-row__rent">${fmt.currency(u.current_rent)}</div>
      <div class="directory-row__status"><span class="occ-pill occ-pill--${u.status}">${cap(u.status)}</span></div>
      <div class="directory-row__action">
        <button type="button" class="btn-primary-sm" data-unit-id="${esc(uid)}">Report issue</button>
      </div>`;
    const btn = row.querySelector('[data-unit-id]');
    btn?.addEventListener('click', () => openReportIssueModal(uid));
    inner.appendChild(row);
  }
}

function onDirectoryFilterChange() {
  const vp = document.getElementById('directory-viewport');
  if (vp) vp.scrollTop = 0;
  scheduleDirectoryRedraw();
}

async function loadDirectoryUnits() {
  const meta = document.getElementById('directory-meta');
  const note = document.getElementById('directory-empty-note');
  try {
    const data = await api.get('/units');
    allDirectoryUnits = data.data || [];
    if (meta) {
      meta.textContent = `${allDirectoryUnits.length} unit${allDirectoryUnits.length === 1 ? '' : 's'} in your portfolios`;
    }
    if (note) note.classList.toggle('hidden', allDirectoryUnits.length > 0);
    const vp = document.getElementById('directory-viewport');
    if (vp) vp.scrollTop = 0;
    scheduleDirectoryRedraw();
  } catch (e) {
    if (meta) meta.textContent = e.message || 'Could not load units.';
  }
}

async function seedDemoDirectory(ev) {
  const btn = ev?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Loading…';
  }
  try {
    const res = await api.post('/units/seed-demo', {});
    await loadDirectoryUnits();
    await loadOverview();
    alert(res.message || 'Demo data ready.');
  } catch (e) {
    alert(e.message || 'Could not load demo data.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Load demo data';
    }
  }
}

function openReportIssueModal(unitId) {
  openModal('Report maintenance issue', `
    <form onsubmit="submitReportIssue(event)" style="display:flex;flex-direction:column;gap:0.9rem;padding:1.25rem">
      <input type="hidden" id="report-unit-id" value="${esc(unitId)}" />
      <div class="form-group"><label>Title</label><input class="filter-input" id="report-title" required maxlength="200" style="width:100%" placeholder="e.g. Heating not working"/></div>
      <div class="form-group"><label>Details</label><textarea class="filter-input" id="report-desc" required minlength="10" maxlength="8000" style="width:100%;min-height:100px" placeholder="Describe the issue (min. 10 characters)"></textarea></div>
      <div class="form-group"><label>Priority</label><select class="filter-select" id="report-priority" style="width:100%"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option></select></div>
      <button type="submit" class="btn-primary">Submit ticket</button>
    </form>`);
}

async function submitReportIssue(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  try {
    await api.post('/maintenance/tickets', {
      unit_id: document.getElementById('report-unit-id').value,
      title: document.getElementById('report-title').value.trim(),
      description: document.getElementById('report-desc').value.trim(),
      priority: document.getElementById('report-priority').value,
    });
    closeModal();
    await loadMaintenanceTickets();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Submit ticket';
    showModalError(err.message);
  }
}

function setDispatcherLiveUi(mode) {
  const label = document.getElementById('dispatcher-live-label');
  if (!label) return;
  if (mode === 'sse') {
    label.textContent = '● Live (push)';
    label.style.color = 'var(--green)';
    label.title = 'Server-sent events: the table refreshes when tickets change.';
  } else if (mode === 'reconnect') {
    label.textContent = '○ Reconnecting…';
    label.style.color = 'var(--orange)';
    label.title = 'Reconnecting to the live stream…';
  } else {
    label.textContent = '● Live';
    label.style.color = 'var(--green)';
    label.title = '';
  }
}

function handleSseEventBlock(block) {
  const trimmed = block.trim();
  if (!trimmed || trimmed.startsWith(':')) return;
  let eventName = 'message';
  for (const line of trimmed.split(/\r?\n/)) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
  }
  if (eventName === 'tickets_changed') {
    const sec = document.getElementById('section-dispatcher');
    if (sec?.classList.contains('active')) loadMaintenanceTickets(true);
  }
}

function scheduleDispatcherReconnect(delayMs) {
  if (dispatcherReconnectTimer) clearTimeout(dispatcherReconnectTimer);
  dispatcherReconnectTimer = setTimeout(() => {
    dispatcherReconnectTimer = null;
    if (!document.getElementById('section-dispatcher')?.classList.contains('active')) return;
    startDispatcherRealtime();
  }, delayMs);
}

function stopDispatcherRealtime() {
  if (dispatcherStreamAbort) {
    dispatcherStreamAbort.abort();
    dispatcherStreamAbort = null;
  }
  if (dispatcherReconnectTimer) {
    clearTimeout(dispatcherReconnectTimer);
    dispatcherReconnectTimer = null;
  }
}

async function startDispatcherRealtime(alreadyRetried) {
  if (dispatcherReconnectTimer) {
    clearTimeout(dispatcherReconnectTimer);
    dispatcherReconnectTimer = null;
  }
  if (dispatcherStreamAbort) {
    dispatcherStreamAbort.abort();
    dispatcherStreamAbort = null;
  }
  if (typeof getApiBase !== 'function') {
    setDispatcherLiveUi('reconnect');
    scheduleDispatcherReconnect(4000);
    return;
  }
  const base = getApiBase();
  let token = localStorage.getItem('propos_token');
  if (!token) return;

  const controller = new AbortController();
  dispatcherStreamAbort = controller;

  try {
    const res = await fetch(`${base}/maintenance/stream`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
    });

    if (res.status === 401 && !alreadyRetried && typeof api.refreshSession === 'function') {
      const renewed = await api.refreshSession();
      if (renewed) {
        return startDispatcherRealtime(true);
      }
    }

    if (!res.ok || !res.body) {
      setDispatcherLiveUi('reconnect');
      scheduleDispatcherReconnect(5000);
      return;
    }

    setDispatcherLiveUi('sse');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || '';
        for (const block of parts) {
          handleSseEventBlock(block);
        }
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }

    if (!controller.signal.aborted && document.getElementById('section-dispatcher')?.classList.contains('active')) {
      setDispatcherLiveUi('reconnect');
      scheduleDispatcherReconnect(2000);
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
    if (document.getElementById('section-dispatcher')?.classList.contains('active')) {
      setDispatcherLiveUi('reconnect');
      scheduleDispatcherReconnect(4000);
    }
  }
}

async function loadMaintenanceTickets(silent) {
  const el = document.getElementById('dispatcher-tickets');
  if (!el) return;
  if (!silent) el.innerHTML = '<p class="empty-msg">Loading…</p>';
  try {
    const data = await api.get('/maintenance/tickets');
    const tickets = data.data || [];
    if (!tickets.length) {
      el.innerHTML =
        '<p class="empty-msg">No maintenance tickets yet. Report an issue from the Directory.</p>';
      return;
    }
    const canAssign = user && (user.role === 'manager' || user.role === 'admin');
    el.innerHTML = `
      <div class="dispatcher-table-wrap">
      <table class="data-table dispatcher-table">
        <thead><tr><th>Ticket</th><th>Unit</th><th>Status</th><th>Priority</th><th>Technician</th>${
          canAssign ? '<th></th>' : ''
        }</tr></thead>
        <tbody>${tickets
          .map((t) => {
            const unit = t.unit_id;
            const assetName = unit?.asset_id?.name || '—';
            const unitNo = unit?.unit_number || '—';
            const tech = t.assigned_technician_name || '—';
            const tid = String(t._id);
            const assignBtn =
              canAssign && t.status === 'open'
                ? `<button type="button" class="btn-primary-sm" data-assign-ticket="${esc(tid)}">Assign technician</button>`
                : '—';
            return `<tr>
              <td><strong>${esc(t.title)}</strong><br/><span class="dispatcher-ticket-meta">${fmt.datetime(
                t.updatedAt
              )}</span></td>
              <td>${esc(assetName)} · ${esc(unitNo)}</td>
              <td><span class="status-pill ${t.status === 'open' ? 'inactive' : 'active'}">${cap(
                t.status
              )}</span></td>
              <td>${cap(t.priority)}</td>
              <td>${esc(tech)}</td>${canAssign ? `<td>${assignBtn}</td>` : ''}
            </tr>`;
          })
          .join('')}
        </tbody>
      </table>
      </div>`;
    el.querySelectorAll('[data-assign-ticket]').forEach((b) => {
      b.addEventListener('click', () => openAssignTechnicianModal(b.getAttribute('data-assign-ticket')));
    });
  } catch (e) {
    el.innerHTML = `<p class="empty-msg error">${esc(e.message)}</p>`;
  }
}

function openAssignTechnicianModal(ticketId) {
  assignTicketId = ticketId;
  openModal('Assign technician', `
    <form onsubmit="submitAssignTechnician(event)" style="display:flex;flex-direction:column;gap:0.9rem;padding:1.25rem">
      <div class="form-group"><label>Technician name</label><input class="filter-input" id="assign-tech-name" required minlength="2" maxlength="120" placeholder="e.g. Alex Rivera" style="width:100%"/></div>
      <button type="submit" class="btn-primary">Assign</button>
    </form>`);
}

async function submitAssignTechnician(e) {
  e.preventDefault();
  if (!assignTicketId) return;
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Assigning…';
  try {
    await api.patch(`/maintenance/tickets/${assignTicketId}/assign`, {
      assigned_technician_name: document.getElementById('assign-tech-name').value.trim(),
    });
    closeModal();
    assignTicketId = null;
    await loadMaintenanceTickets();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Assign';
    showModalError(err.message);
  }
}

// ─── FINANCE ──────────────────────────────────────────────────────
async function loadTransactions() {
  const dir = document.getElementById('tx-filter-dir')?.value || '';
  const aml = document.getElementById('tx-filter-aml')?.value || '';
  let endpoint = '/finance/transactions?limit=50';
  if (dir) endpoint += `&direction=${dir}`;
  if (aml) endpoint += `&aml_flagged=${aml}`;

  try {
    const data = await api.get(endpoint);
    allTransactions = data.data || [];
    renderTransactions(allTransactions);

    // Compute stats
    const income   = allTransactions.filter(t=>t.direction==='in').reduce((s,t)=>s+t.amount,0);
    const expense  = allTransactions.filter(t=>t.direction==='out').reduce((s,t)=>s+t.amount,0);
    const amlCount = allTransactions.filter(t=>t.aml_flagged).length;
    const recCount = allTransactions.filter(t=>t.reconciled).length;
    if (document.getElementById('stat-income')) document.getElementById('stat-income').textContent = fmt.currency(income);
    if (document.getElementById('stat-expense')) document.getElementById('stat-expense').textContent = fmt.currency(expense);
    if (document.getElementById('stat-aml')) document.getElementById('stat-aml').textContent = amlCount;
    if (document.getElementById('stat-reconciled')) document.getElementById('stat-reconciled').textContent = recCount;
  } catch (e) {
    document.getElementById('transactions-list').innerHTML = `<p class="empty-msg error">${e.message}</p>`;
  }
}

function renderTransactions(txs) {
  const el = document.getElementById('transactions-list');
  if (!txs.length) {
    el.innerHTML = `<div style="padding:2rem;text-align:center">
      <p class="empty-msg">No transactions found.</p>
      <button class="btn-primary" style="width:auto;margin-top:1rem" onclick="showCreateTransactionModal()">Add Transaction</button>
    </div>`;
    return;
  }
  el.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Bank Ref</th><th>Amount</th><th>Direction</th><th>Category</th><th>Reconciled</th><th>AML</th><th>Date</th></tr></thead>
      <tbody>${txs.map(t => `
        <tr>
          <td><code style="font-size:0.75rem">${esc(t.bank_ref)}</code></td>
          <td><strong class="${t.direction==='in'?'text-green':'text-red'}">${fmt.currency(t.amount)}</strong></td>
          <td><span class="dir-badge ${t.direction}">${t.direction === 'in' ? '⬇ In' : '⬆ Out'}</span></td>
          <td>${cap(t.category)}</td>
          <td>${t.reconciled ? '<span class="status-pill active">Yes</span>' : '<span class="status-pill inactive">No</span>'}</td>
          <td>${t.aml_flagged ? '<span class="status-pill inactive">🚨 Flagged</span>' : '<span class="status-pill active">Clear</span>'}</td>
          <td>${fmt.date(t.date)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function showCreateTransactionModal() {
  if (!allPortfolios.length) { alert('Create a portfolio first.'); return; }
  openModal('Add Transaction', `
    <form onsubmit="submitTransaction(event)" style="display:flex;flex-direction:column;gap:0.9rem;padding:1.25rem">
      <div class="form-group"><label>Portfolio</label><select class="filter-select" id="tx-portfolio" style="width:100%" required>${allPortfolios.map(p=>`<option value="${p._id}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group form-row">
        <div style="flex:1"><label>Amount (£)</label><input type="number" class="filter-input" id="tx-amount" placeholder="0.00" min="0" step="0.01" required style="width:100%"/></div>
        <div style="flex:1"><label>Direction</label><select class="filter-select" id="tx-dir" style="width:100%"><option value="in">In</option><option value="out">Out</option></select></div>
      </div>
      <div class="form-group"><label>Category</label><select class="filter-select" id="tx-cat" style="width:100%"><option value="rent">Rent</option><option value="deposit">Deposit</option><option value="maintenance">Maintenance</option><option value="insurance">Insurance</option><option value="service_charge">Service Charge</option><option value="refund">Refund</option><option value="other">Other</option></select></div>
      <div class="form-group"><label>Bank Reference</label><input class="filter-input" id="tx-ref" placeholder="e.g. SMITH-UNIT-4A-MAY26" required style="width:100%"/></div>
      <div class="form-group"><label>Description</label><input class="filter-input" id="tx-desc" placeholder="Optional" style="width:100%"/></div>
      <p style="font-size:0.75rem;color:var(--muted)">⚠️ Transactions over £10,000 are automatically flagged for AML review.</p>
      <button type="submit" class="btn-primary">Add Transaction</button>
    </form>`);
}

async function submitTransaction(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Processing…';
  try {
    const res = await api.post('/finance/transactions', {
      portfolio_id: document.getElementById('tx-portfolio').value,
      amount: parseFloat(document.getElementById('tx-amount').value),
      direction: document.getElementById('tx-dir').value,
      category: document.getElementById('tx-cat').value,
      bank_ref: document.getElementById('tx-ref').value.trim(),
      description: document.getElementById('tx-desc').value.trim(),
    });
    closeModal();
    await loadTransactions();
    await loadOverview();
    if (res.data?.aml_flagged) {
      setTimeout(() => alert('⚠️ AML Alert: This transaction exceeds £10,000 and has been flagged for manual review.'), 300);
    }
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Add Transaction';
    showModalError(err.message);
  }
}

// ─── COMPLIANCE ───────────────────────────────────────────────────
async function loadCompliance() {
  try {
    const [auditData, logsData] = await Promise.allSettled([
      api.get('/compliance/audit-status'),
      api.get('/compliance/logs?limit=20'),
    ]);

    // Audit status
    const audit = auditData.value?.data || {};
    const types = Object.entries(audit.summary || {});
    document.getElementById('compliance-audit').innerHTML = types.length ? `
      <div style="padding:1rem;display:flex;flex-direction:column;gap:0.75rem">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          ${Object.entries(audit.summary || {}).map(([type, statuses]) => `
            <div class="compliance-type-card">
              <div class="type-badge">${type}</div>
              ${Object.entries(statuses).map(([s,n]) => `<div class="type-row"><span>${cap(s)}</span><strong>${n}</strong></div>`).join('')}
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:1rem;margin-top:0.5rem">
          <div class="meta-item"><span class="meta-label">Overall</span><span class="role-badge ${audit.overallStatus === 'pass' ? 'cashier' : 'admin'}">${cap(audit.overallStatus)}</span></div>
          <div class="meta-item"><span class="meta-label">Flagged</span><strong style="color:var(--red)">${audit.flaggedCount}</strong></div>
          <div class="meta-item"><span class="meta-label">Pending</span><strong style="color:var(--orange)">${audit.pendingCount}</strong></div>
        </div>
      </div>` : '<p class="empty-msg">No compliance data yet.</p>';

    // Logs
    const logs = logsData.value?.data || [];
    document.getElementById('badge-logs').textContent = logs.length;
    document.getElementById('compliance-logs').innerHTML = logs.length ? `
      <table class="data-table">
        <thead><tr><th>Type</th><th>Entity</th><th>Status</th><th>Notes</th><th>Last Audit</th></tr></thead>
        <tbody>${logs.map(l => `
          <tr>
            <td><span class="type-badge">${l.type}</span></td>
            <td><code style="font-size:0.72rem">${l.entity_id?.toString().slice(-8)}</code></td>
            <td><span class="status-pill ${l.status === 'pass' ? 'active' : l.status === 'flagged' ? 'inactive' : ''}">${cap(l.status)}</span></td>
            <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.notes ? esc(l.notes.slice(0,60)) + '…' : '—'}</td>
            <td>${fmt.datetime(l.last_audit)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p class="empty-msg">No compliance logs found.</p>';
  } catch (e) {
    console.error('Compliance load error:', e);
  }
}

// ─── INSURANCE ────────────────────────────────────────────────────
async function loadInsurance() {
  try {
    const data = await api.get('/insurance/policies');
    const policies = data.data || [];
    document.getElementById('badge-policies').textContent = policies.length;
    document.getElementById('insurance-list').innerHTML = policies.length ? `
      <table class="data-table">
        <thead><tr><th>Asset</th><th>Provider</th><th>Type</th><th>Premium/yr</th><th>Coverage</th><th>ESG Disc.</th><th>Expiry</th></tr></thead>
        <tbody>${policies.map(p => `
          <tr>
            <td>${esc(p.asset_id?.name || '—')}</td>
            <td>${esc(p.provider)}</td>
            <td><span class="role-badge manager">${cap(p.policy_type)}</span></td>
            <td>${fmt.currency(p.premium)}</td>
            <td>${fmt.currency(p.coverage_limit)}</td>
            <td>${p.esg_discount_applied ? '<span class="status-pill active">5% Off</span>' : '—'}</td>
            <td>${fmt.date(p.expiry_date)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p class="empty-msg">No policies yet. Use the quote tool below to get started.</p>';
  } catch (e) {
    document.getElementById('insurance-list').innerHTML = `<p class="empty-msg error">${e.message}</p>`;
  }
}

async function getInsuranceQuote() {
  const assetId = document.getElementById('quote-asset').value;
  const type    = document.getElementById('quote-type').value;
  const limit   = parseFloat(document.getElementById('quote-limit').value);
  if (!assetId || !limit) { alert('Please select an asset and enter a coverage limit.'); return; }

  const btn = document.querySelector('#section-insurance .btn-primary');
  btn.disabled = true; btn.textContent = 'Calculating…';

  try {
    const res = await api.post('/insurance/quote', { asset_id: assetId, policy_type: type, coverage_limit: limit });
    const q = res.data;
    document.getElementById('quote-result').classList.remove('hidden');
    document.getElementById('quote-result').innerHTML = `
      <div class="info-card">
        <div class="info-card-title">📋 Quote: ${esc(q.asset_name)}</div>
        <div class="info-card-stats" style="margin-top:0.75rem">
          <div class="info-stat"><span class="meta-label">Policy Type</span><strong>${cap(q.policy_type)}</strong></div>
          <div class="info-stat"><span class="meta-label">Coverage Limit</span><strong>${fmt.currency(q.coverage_limit)}</strong></div>
          <div class="info-stat"><span class="meta-label">Base Premium</span><strong>${fmt.currency(q.base_premium)}</strong></div>
          <div class="info-stat"><span class="meta-label">ESG Score</span><strong>${q.esg_score}/100</strong></div>
          ${q.esg_discount_applied ? `<div class="info-stat"><span class="meta-label">ESG Discount (5%)</span><strong style="color:var(--green)">-${fmt.currency(q.esg_discount_amount)}</strong></div>` : ''}
          <div class="info-stat"><span class="meta-label">Final Annual Premium</span><strong style="color:var(--indigo);font-size:1.2rem">${fmt.currency(q.final_premium)}</strong></div>
        </div>
        <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--muted)">Ref: ${q.quote_reference} | Valid until: ${fmt.date(q.valid_until)}</div>
      </div>`;
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Get Quote';
  }
}

// ─── PROFILE ──────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const data = await api.get('/auth/me');
    const u = data.data?.user;
    if (!u) return;
    const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
    document.getElementById('profile-avatar').textContent = initials;
    document.getElementById('profile-details').innerHTML = `
      <h3>${esc(u.name)}</h3>
      <p class="profile-email">${esc(u.email)}</p>
      <div class="profile-meta">
        <div class="meta-item"><span class="meta-label">Role</span><span class="role-badge ${u.role}">${cap(u.role)}</span></div>
        <div class="meta-item"><span class="meta-label">Status</span><span class="status-pill ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span></div>
        <div class="meta-item"><span class="meta-label">MFA</span><span>${u.mfaEnabled ? '✅ Enabled' : '⬜ Disabled'}</span></div>
        <div class="meta-item"><span class="meta-label">Member Since</span><span>${fmt.date(u.createdAt)}</span></div>
        <div class="meta-item"><span class="meta-label">Last Login</span><span>${fmt.datetime(u.lastLogin)}</span></div>
      </div>`;
  } catch (e) {
    console.error('Profile load error:', e);
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────
async function handleLogout() {
  try { await api.post('/auth/logout'); } catch {}
  clearSession();
  window.location.href = 'index.html';
}

// ─── HELP: ABOUT, GUIDE, SUPPORT ──────────────────────────────────
function openAboutModal() {
  openModal('About PropOS Enterprise', `
    <div class="help-prose">
      <p class="help-lead">PropOS Enterprise is a <strong>property and portfolio operations platform</strong> for teams who manage real estate assets, tenancies, maintenance, cash flows, and regulatory obligations in one place.</p>
      <h4>What we help you do</h4>
      <ul>
        <li><strong>Portfolios</strong> — Group assets under named portfolios with currencies and AUM for reporting.</li>
        <li><strong>Assets</strong> — Record buildings and sites with ESG and health scores, and values linked to a portfolio.</li>
        <li><strong>Directory</strong> — Browse units and tenancies per asset, raise maintenance tickets, and see status at a glance.</li>
        <li><strong>Dispatcher</strong> — Managers and admins assign technicians to open maintenance jobs.</li>
        <li><strong>Finance</strong> — Log money in and out with categories, reconciliation flags, and AML markers.</li>
        <li><strong>Compliance</strong> — See audit status and a trail of compliance checks across entities.</li>
        <li><strong>Insurance</strong> — Review policies and run indicative quotes using your asset data.</li>
        <li><strong>Profile &amp; support</strong> — View your role and account status; message your team via the Support drawer.</li>
      </ul>
      <p class="help-muted">Access to actions may vary by role. Your organisation’s admin can adjust permissions and data scope.</p>
    </div>`);
}

function openGuideModal() {
  openModal('Getting started on PropOS', `
    <div class="help-prose">
      <ol class="help-steps">
        <li><strong>Create a portfolio</strong> — Go to <em>Portfolios</em> → <em>+ New Portfolio</em>. Give it a name and optional AUM.</li>
        <li><strong>Add property assets</strong> — Open <em>Assets</em> → <em>+ Add Asset</em>. Pick the portfolio, enter address (use the city picker), type, and value.</li>
        <li><strong>Use Directory</strong> — Open <em>Directory</em> to add units, record tenancies, and create or follow maintenance tickets. Managers and admins can use <em>Dispatcher</em> to assign technicians.</li>
        <li><strong>Record transactions</strong> — Under <em>Finance</em>, add in/out movements with categories so reports stay meaningful.</li>
        <li><strong>Review compliance</strong> — Visit <em>Compliance</em> for audit status and logs; use <em>Refresh</em> after changes.</li>
        <li><strong>Insurance</strong> — When you have assets, select one in <em>Get Quote</em> to see an indicative premium.</li>
        <li><strong>Need help?</strong> — Use the <em>💬 Support</em> button (bottom-right) to message your admin team.</li>
      </ol>
      <p class="help-muted">Tip: Use <strong>Refresh</strong> in the top bar after adding data to update all tiles.</p>
    </div>`);
}

function ensureSupportIntro() {
  const th = document.getElementById('support-thread');
  if (!th || th.dataset.ready === '1') return;
  th.dataset.ready = '1';
  th.innerHTML = `
    <div class="support-bubble support-bubble--team">
      <span class="support-bubble-name">PropOS Support</span>
      <p>Hi! Send a message below — it’s delivered to your organisation’s support queue. For urgent issues, say so in the subject line.</p>
    </div>`;
}

function openSupportDrawer() {
  ensureSupportIntro();
  document.getElementById('support-drawer')?.classList.remove('hidden');
  document.getElementById('support-drawer-backdrop')?.classList.remove('hidden');
  document.getElementById('support-drawer')?.setAttribute('aria-hidden', 'false');
}

function closeSupportDrawer() {
  document.getElementById('support-drawer')?.classList.add('hidden');
  document.getElementById('support-drawer-backdrop')?.classList.add('hidden');
  document.getElementById('support-drawer')?.setAttribute('aria-hidden', 'true');
}

function appendSupportUserBubble(subject, body) {
  const th = document.getElementById('support-thread');
  if (!th) return;
  const div = document.createElement('div');
  div.className = 'support-bubble support-bubble--user';
  div.innerHTML = `<span class="support-bubble-name">You · ${esc(subject)}</span><p>${esc(body)}</p>`;
  th.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function appendSupportTeamAck() {
  const th = document.getElementById('support-thread');
  if (!th) return;
  const div = document.createElement('div');
  div.className = 'support-bubble support-bubble--team';
  div.innerHTML =
    '<span class="support-bubble-name">PropOS Support</span><p>Thanks — your message was saved and routed to the admin team. They’ll follow up by email if needed.</p>';
  th.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function submitSupportMessage(e) {
  e.preventDefault();
  const subject = document.getElementById('support-subject')?.value.trim() || '';
  const body = document.getElementById('support-body')?.value.trim() || '';
  const btn = document.getElementById('support-submit');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending…';
  }
  try {
    await api.post('/support/messages', { subject, body });
    appendSupportUserBubble(subject, body);
    appendSupportTeamAck();
    document.getElementById('support-form')?.reset();
  } catch (err) {
    alert(err?.message || 'Could not send message. Try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send to support';
    }
  }
}

// ─── MODALS ───────────────────────────────────────────────────────
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}

function showModalError(msg) {
  const existing = document.getElementById('modal-error');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'modal-error';
  div.className = 'alert error';
  div.style.margin = '0 1.25rem 1rem';
  div.textContent = msg;
  document.getElementById('modal-body').prepend(div);
}

// ─── HELPERS ──────────────────────────────────────────────────────
function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
