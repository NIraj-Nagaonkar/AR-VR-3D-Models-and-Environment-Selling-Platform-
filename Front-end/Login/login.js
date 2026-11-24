/**
 * Front-end/Login/login.js
 * Uses shared auth.js — relative URLs only, no localhost hardcoding.
 */
import { saveSession } from '../shared/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm       = document.getElementById('loginForm');
  const authAlert       = document.getElementById('authAlert');
  const loginBtn        = document.querySelector('.login-btn');
  const emailInput      = document.getElementById('email');
  const rememberCheckbox= document.querySelector('.remember-me input[type="checkbox"]');

  // ── Forgot password modal elements
  const forgotLink      = document.getElementById('forgotPasswordLink');
  const forgotModal     = document.getElementById('forgotModal');
  const forgotAlert     = document.getElementById('forgotAlert');
  const forgotEmailEl   = document.getElementById('forgotEmail');
  const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
  const forgotCancelBtn = document.getElementById('forgotCancelBtn');

  // Auto-fill remembered email
  const saved = localStorage.getItem('ather_remembered_email');
  if (saved && emailInput) { emailInput.value = saved; if (rememberCheckbox) rememberCheckbox.checked = true; }

  function showAlert(message, type = 'error') {
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = `fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
    const span = document.createElement('span');
    span.textContent = message;
    authAlert.appendChild(icon);
    authAlert.appendChild(span);
    authAlert.style.display = 'flex';
  }
  function clearAlert() { authAlert.style.display = 'none'; }

  // ── Login form ──────────────────────────────────────────────────────────────
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

      // Validate ?next= return path — prevent script injection (javascript:...) and open redirects (// or http)
      const params = new URLSearchParams(window.location.search);
      const rawNext = params.get('next');
      let safeNext = null;

      if (rawNext) {
        try {
          const decoded = decodeURIComponent(rawNext).trim();
          // Must start with a single slash, not double slash or slash-backslash, and contain no control chars/protocol
          if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.startsWith('/\\') && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
            safeNext = decoded;
          }
        } catch (e) {
          safeNext = null;
        }
      }

      setTimeout(() => {
        if (safeNext) { window.location.href = safeNext; return; }
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

  // ── Forgot Password modal ───────────────────────────────────────────────────
  function openForgotModal() {
    forgotModal.style.display = 'flex';
    forgotAlert.style.display = 'none';
    if (forgotEmailEl) { forgotEmailEl.value = emailInput?.value || ''; forgotEmailEl.focus(); }
  }
  function closeForgotModal() {
    forgotModal.style.display = 'none';
  }

  function showForgotAlert(message, type = 'error') {
    forgotAlert.className = `auth-alert ${type}`;
    forgotAlert.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
    forgotAlert.style.display = 'flex';
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => { e.preventDefault(); openForgotModal(); });
  }
  if (forgotCancelBtn) {
    forgotCancelBtn.addEventListener('click', closeForgotModal);
  }

  // Close on backdrop click
  if (forgotModal) {
    forgotModal.addEventListener('click', (e) => { if (e.target === forgotModal) closeForgotModal(); });
  }

  if (forgotSubmitBtn) {
    forgotSubmitBtn.addEventListener('click', async () => {
      forgotAlert.style.display = 'none';
      const email = forgotEmailEl?.value?.trim();
      if (!email) { showForgotAlert('Please enter your email address.'); return; }

      forgotSubmitBtn.disabled    = true;
      forgotSubmitBtn.textContent = 'Sending…';

      try {
        const res  = await fetch('/api/users/forgot-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!data.success) {
          showForgotAlert(data.message || 'Something went wrong. Please try again.');
          forgotSubmitBtn.disabled    = false;
          forgotSubmitBtn.textContent = 'Send Reset Link';
          return;
        }

        // Dev mode: server returns resetUrl when explicitly in development
        if (data.devResetUrl) {
          const cleanUrl = String(data.devResetUrl).replace(/"/g, '&quot;');
          showForgotAlert(
            `If that email is registered, a reset link has been generated. (Dev mode: <a href="${cleanUrl}" style="color:#a3c7fc;word-break:break-all;">Open Reset Link</a>)`,
            'success'
          );
        } else {
          showForgotAlert('If that email is registered, a reset link has been sent.', 'success');
        }

        forgotSubmitBtn.disabled    = false;
        forgotSubmitBtn.textContent = 'Send Reset Link';
      } catch (err) {
        showForgotAlert('Unable to connect to server.');
        forgotSubmitBtn.disabled    = false;
        forgotSubmitBtn.textContent = 'Send Reset Link';
      }
    });
  }
});

