/**
 * Front-end/Customer/Customer.js
 * - Relative API URLs only
 * - Auth token sent on request submission (guard added)
 * - alert() replaced with toast
 * - "My Requests" section added — polls GET /api/requests/mine
 */
import { requireLogin, requireAdmin } from '../shared/guard.js';
import { getToken, getUser, logout }  from '../shared/auth.js';
import { showToast }                  from '../shared/ui/toast.js';

// Guard — must be logged in (not admin) to view this page
requireLogin();

// ── Mobile nav toggle ───────────────────────────────────────────────
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks      = document.getElementById('nav-links');
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ? '✖' : '☰';
  });
}

// ── Inject user name into nav if element exists ──────────────────────
const navUser = document.getElementById('nav-user-name');
if (navUser) { const u = getUser(); navUser.textContent = u?.name || 'Customer'; }

// ── Logout button ───────────────────────────────────────────────────
document.querySelectorAll('[data-action="logout"]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
});

// ── Custom request form ─────────────────────────────────────────────
const requestForm = document.querySelector('.request-form');
if (requestForm) {
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn      = requestForm.querySelector('.submit-btn');
    const originalText   = submitBtn.textContent;
    submitBtn.disabled   = true;
    submitBtn.textContent = 'Submitting...';

    const formData = new FormData();
    formData.append('fullName',       document.getElementById('fullName').value);
    formData.append('workEmail',      document.getElementById('workEmail').value);
    formData.append('targetPlatform', document.getElementById('targetPlatform').value);
    formData.append('specifications', document.getElementById('specifications').value);

    const fileInput = document.getElementById('blueprintFile');
    if (fileInput?.files.length > 0) formData.append('blueprintFile', fileInput.files[0]);

    try {
      const token = getToken();
      const res   = await fetch('/api/requests', {
        method:  'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body:    formData,
      });
      const data = await res.json();

      if (data.success) {
        showToast('Request submitted successfully! We will get back to you shortly.', 'success', 6000);
        requestForm.reset();
        // Refresh "My Requests" section
        loadMyRequests();
      } else {
        const msg = data.code === 'AUTH_REQUIRED'
          ? 'Please log in to submit a request.'
          : (data.message || 'Submission failed. Please try again.');
        showToast(msg, 'error');
      }
    } catch (err) {
      showToast('Could not reach the server. Please check your connection.', 'error');
    } finally {
      submitBtn.disabled   = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ── My Requests section ─────────────────────────────────────────────
const STATUS_BADGE = {
  Pending:    'badge-pending',
  Accepted:   'badge-accepted',
  InProgress: 'badge-inprogress',
  Completed:  'badge-completed',
  Delivered:  'badge-delivered',
  Rejected:   'badge-rejected',
};

async function loadMyRequests() {
  const container = document.getElementById('my-requests-list');
  if (!container) return;

  container.innerHTML = `<div class="spinner-wrap"><i class="fa-solid fa-spinner fa-spin"></i> Loading your requests...</div>`;

  try {
    const token = getToken();
    if (!token) { container.innerHTML = '<p class="empty-msg">Please log in to see your requests.</p>'; return; }

    const res  = await fetch('/api/requests/mine', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success || !data.requests?.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>You haven't submitted any requests yet.</p>
        </div>`;
      return;
    }

    container.innerHTML = data.requests.map(r => {
      const badgeClass = STATUS_BADGE[r.status] || 'badge-pending';
      const date       = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—';
      const note       = r.adminNote  ? `<p class="req-note"><strong>Admin note:</strong> ${r.adminNote}</p>` : '';
      const quote      = r.quotedPrice != null ? `<p class="req-quote"><strong>Quoted price:</strong> ₹${r.quotedPrice.toLocaleString()}</p>` : '';

      return `
        <div class="req-card">
          <div class="req-card-header">
            <span class="req-platform">${r.targetPlatform || 'General'}</span>
            <span class="badge ${badgeClass}">${r.status}</span>
          </div>
          <p class="req-specs">${r.specifications?.slice(0, 160)}${r.specifications?.length > 160 ? '…' : ''}</p>
          ${note}${quote}
          <span class="req-date">Submitted ${date}</span>
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<p class="empty-msg error">Could not load your requests. Please refresh.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadMyRequests);

// ── Card video playback ─────────────────────────────────────────────
window.playVideo = function(cardElement) {
  const video = cardElement.querySelector('video');
  if (!video) return;
  if (video.paused) { video.play(); video.controls = true; }
  else { video.pause(); }
};
