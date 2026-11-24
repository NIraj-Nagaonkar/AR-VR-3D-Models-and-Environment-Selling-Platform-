/**
 * Front-end/Login/reset-password.js
 * Reads ?token= from URL, submits new password to /api/users/reset-password/:token
 */

document.addEventListener('DOMContentLoaded', () => {
  const authAlert      = document.getElementById('authAlert');
  const resetForm      = document.getElementById('resetForm');
  const resetBtn       = document.getElementById('resetBtn');
  const newPasswordEl  = document.getElementById('newPassword');
  const confirmPassEl  = document.getElementById('confirmPassword');

  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');

  function showAlert(message, type = 'error') {
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
    authAlert.style.display = 'flex';
  }

  // Guard: no token in URL
  if (!token) {
    showAlert('Invalid or missing reset link. Please request a new one.');
    if (resetForm) resetForm.style.display = 'none';
    return;
  }

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authAlert.style.display = 'none';

    const password = newPasswordEl.value;
    const confirm  = confirmPassEl.value;

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showAlert('Passwords do not match.');
      return;
    }

    resetBtn.disabled    = true;
    resetBtn.textContent = 'SAVING...';

    try {
      const res  = await fetch(`/api/users/reset-password/${encodeURIComponent(token)}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showAlert(data.message || 'Reset failed. The link may have expired.');
        resetBtn.disabled    = false;
        resetBtn.textContent = 'SET NEW PASSWORD';
        return;
      }

      showAlert('Password reset successful! Redirecting to login…', 'success');
      resetForm.style.display = 'none';
      setTimeout(() => { window.location.href = '/Login/login.html'; }, 2000);
    } catch (err) {
      showAlert('Unable to connect to server. Please try again.');
      resetBtn.disabled    = false;
      resetBtn.textContent = 'SET NEW PASSWORD';
    }
  });
});
