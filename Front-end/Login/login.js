/**
 * Front-end/Login/login.js
 * Uses shared api.js + auth.js — relative URLs only, no localhost hardcoding.
 */
import { saveSession } from '../shared/auth.js';
import { showToast }   from '../shared/ui/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm       = document.getElementById('loginForm');
  const authAlert       = document.getElementById('authAlert');
  const loginBtn        = document.querySelector('.login-btn');
  const emailInput      = document.getElementById('email');
  const rememberCheckbox= document.querySelector('.remember-me input[type="checkbox"]');

  // Auto-fill remembered email
  const saved = localStorage.getItem('ather_remembered_email');
  if (saved && emailInput) { emailInput.value = saved; if (rememberCheckbox) rememberCheckbox.checked = true; }

  function showAlert(message, type = 'error') {
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
    authAlert.style.display = 'flex';
  }
  function clearAlert() { authAlert.style.display = 'none'; }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email    = emailInput.value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) { showAlert('Please enter both email and password.'); return; }

    if (rememberCheckbox?.checked) {
      localStorage.setItem('ather_remembered_email', email);
    } else {
      localStorage.removeItem('ather_remembered_email');
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOGGING IN...';

    try {
      const res = await fetch('/api/users/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showAlert(data.message || 'Invalid email or password.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'LOGIN';
        return;
      }

      saveSession(data.token, data.user);
      showAlert('Login successful! Redirecting...', 'success');

      // Honour ?next= return path
      const params = new URLSearchParams(window.location.search);
      const next   = params.get('next');

      setTimeout(() => {
        if (next) { window.location.href = decodeURIComponent(next); return; }
        window.location.href = data.user?.role === 'admin'
          ? '/Admin/Admin.html'
          : '/Customer/Customer.html';
      }, 900);

    } catch (err) {
      showAlert('Unable to connect to server. Please ensure the backend is running.');
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'LOGIN';
    }
  });
});
