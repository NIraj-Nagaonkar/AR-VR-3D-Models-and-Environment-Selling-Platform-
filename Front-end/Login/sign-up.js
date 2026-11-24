/**
 * Front-end/Login/sign-up.js
 * Uses shared auth.js — relative URLs, no localhost hardcoding.
 */
import { saveSession } from '../shared/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const authAlert  = document.getElementById('authAlert');
  const signupBtn  = document.querySelector('.signup-btn');

  function showAlert(message, type = 'error') {
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
    authAlert.style.display = 'flex';
  }
  function clearAlert() { authAlert.style.display = 'none'; }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const fullname       = document.getElementById('fullname').value.trim();
    const email          = document.getElementById('email').value.trim();
    const password       = document.getElementById('password').value;
    const confirmPassword= document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) { showAlert('Passwords do not match.'); return; }
    if (password.length < 6)          { showAlert('Password must be at least 6 characters.'); return; }

    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREATING ACCOUNT...';

    try {
      const res = await fetch('/api/users/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: fullname, email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showAlert(data.message || 'Failed to create account.');
        signupBtn.disabled = false;
        signupBtn.innerHTML = 'SIGN UP';
        return;
      }

      saveSession(data.token, data.user);
      showAlert('Account created! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = data.user?.role === 'admin'
          ? '/Admin/Admin.html'
          : '/Customer/Customer.html';
      }, 1000);

    } catch (err) {
      showAlert('Unable to connect to server. Please ensure the backend is running.');
      signupBtn.disabled = false;
      signupBtn.innerHTML = 'SIGN UP';
    }
  });
});
