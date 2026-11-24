/**
 * shared/auth.js
 * Single source of truth for session: token + user object.
 * Replaces the six duplicate localStorage keys previously used.
 */

const SESSION_KEY = 'ather_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch { return null; }
}

export function getToken() {
  return getSession()?.token || null;
}

export function getUser() {
  return getSession()?.user || null;
}

export function saveSession(token, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  // Migrate & remove old keys
  ['ather_auth_token','ather_user_data','aether_auth_token','aether_user_data',
   'ather_gemini_key','ather_luma_key'].forEach(k => localStorage.removeItem(k));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  return getUser()?.role === 'admin';
}

export function logout() {
  clearSession();
  window.location.href = '/Login/login.html';
}
