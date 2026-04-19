/**
 * Copies the static SPA from Frontend/PropOS-Entreprise-main into Backend/public
 * so Express serves the same UI as in development.
 *
 * Usage (from repo root):
 *   node scripts/sync-frontend-to-public.js
 *
 * Or from Backend/: npm run sync:public
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'Frontend', 'PropOS-Entreprise-main');
const destDir = path.join(repoRoot, 'Backend', 'public');

/** Files and directories to mirror (frontend is source of truth). */
const ENTRIES = ['index.html', 'dashboard.html', 'css', 'js'];

function sync() {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source not found: ${srcDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(destDir)) {
    console.error(`Destination not found: ${destDir}`);
    process.exit(1);
  }

  for (const name of ENTRIES) {
    const from = path.join(srcDir, name);
    const to = path.join(destDir, name);

    if (!fs.existsSync(from)) {
      console.error(`Missing: ${from}`);
      process.exit(1);
    }

    const st = fs.statSync(from);
    if (st.isDirectory()) {
      fs.rmSync(to, { recursive: true, force: true });
      fs.cpSync(from, to, { recursive: true });
    } else {
      fs.copyFileSync(from, to);
    }
    console.log(`Synced ${name}`);
  }

  console.log('Done. Backend/public now matches Frontend/PropOS-Entreprise-main for HTML/CSS/JS.');
}

sync();
