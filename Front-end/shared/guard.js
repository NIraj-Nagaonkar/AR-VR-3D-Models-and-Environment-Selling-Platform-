/**
 * shared/guard.js
 * Page-level auth guard — import and call at top of every protected page.
 * This is UX only; the server is the real gatekeeper.
 *
 * Usage (top of page script, before any other logic):
 *   import { requireLogin, requireAdmin } from '../shared/guard.js';
 *   requireLogin();     // any logged-in user
 *   requireAdmin();     // admin role only
 */

import { isLoggedIn, isAdmin } from './auth.js';

export function requireLogin() {
  if (!isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/Login/login.html?next=${next}`);
  }
}

export function requireAdmin() {
  if (!isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/Login/login.html?next=${next}`);
    return;
  }
  if (!isAdmin()) {
    window.location.replace('/Customer/Customer.html');
  }
}
