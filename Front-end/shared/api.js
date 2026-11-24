/**
 * shared/api.js
 * Central fetch wrapper — all API calls go through here.
 * - Automatically attaches Authorization: Bearer <token>
 * - Sends JSON or FormData
 * - Maps { success:false, code, message } to typed errors
 * - Handles 401 → redirect to login with ?next= return path
 */

import { getToken, clearSession } from './auth.js';
import { showToast } from './ui/toast.js';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code   = code;
    this.status = status;
  }
}

async function request(method, path, body = null) {
  const token   = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let bodyInit;
  if (body instanceof FormData) {
    bodyInit = body;
    // Don't set Content-Type — browser sets multipart boundary automatically
  } else if (body !== null) {
    bodyInit = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: bodyInit });
  } catch (err) {
    throw new ApiError('NETWORK_ERROR', 'Cannot reach the server. Check that it is running.', 0);
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const code    = data.code    || 'SERVER_ERROR';
    const message = data.message || `HTTP ${res.status}`;

    if (code === 'AUTH_REQUIRED' || res.status === 401) {
      clearSession();
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/Login/login.html?next=${next}`;
      throw new ApiError(code, 'Session expired — please log in again.', 401);
    }

    if (code === 'RATE_LIMIT') {
      showToast(message, 'warning');
    }

    throw new ApiError(code, message, res.status);
  }

  return data;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
};
