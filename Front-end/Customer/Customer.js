/**
 * Front-end/Customer/Customer.js
 * - Uses shared api.js for centralized 401 redirection and bearer token attachment
 * - XSS-sanitized template rendering
 * - Non-blocking toast notifications
 * - My Requests section polls /api/requests/mine
 */
import { requireLogin } from '../shared/guard.js';
import { getUser, logout } from '../shared/auth.js';
import { api, ApiError } from '../shared/api.js';
import { showToast } from '../shared/ui/toast.js';

// Guard — must be logged in to view this page
requireLogin();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Mobile nav toggle ───────────────────────────────────────────────
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks      = document.getElementById('nav-links');
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✖' : '☰';
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
    formData.append('fullName',       document.getElementById('fullName').value.trim());
    formData.append('workEmail',      document.getElementById('workEmail').value.trim());
    formData.append('targetPlatform', document.getElementById('targetPlatform').value);
    formData.append('specifications', document.getElementById('specifications').value.trim());

    const fileInput = document.getElementById('blueprintFile');
    if (fileInput?.files.length > 0) formData.append('blueprintFile', fileInput.files[0]);

    try {
      const data = await api.post('/requests', formData);

      if (data.success) {
        showToast('Request submitted successfully! We will get back to you shortly.', 'success', 6000);
        requestForm.reset();
        // Refresh "My Requests" section
        loadMyRequests();
      } else {
        showToast(data.message || 'Submission failed. Please try again.', 'error');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Redirection already handled by api.js
        return;
      }
      showToast(err.message || 'Could not reach the server. Please check your connection.', 'error');
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
    const data = await api.get('/requests/mine');

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
      const safePlatform = escapeHtml(r.targetPlatform || 'General');
      const safeStatus   = escapeHtml(r.status || 'Pending');
      const rawSpecs     = r.specifications || '';
      const safeSpecs    = escapeHtml(rawSpecs.slice(0, 160) + (rawSpecs.length > 160 ? '…' : ''));
      const note         = r.adminNote ? `<p class="req-note"><strong>Admin note:</strong> ${escapeHtml(r.adminNote)}</p>` : '';
      const quote        = r.quotedPrice != null ? `<p class="req-quote"><strong>Quoted price:</strong> ₹${escapeHtml(r.quotedPrice.toLocaleString())}</p>` : '';

      return `
        <div class="req-card">
          <div class="req-card-header">
            <span class="req-platform">${safePlatform}</span>
            <span class="badge ${badgeClass}">${safeStatus}</span>
          </div>
          <p class="req-specs">${safeSpecs}</p>
          ${note}${quote}
          <span class="req-date">Submitted ${escapeHtml(date)}</span>
        </div>`;
    }).join('');

  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return;
    container.innerHTML = `<p class="empty-msg error">Could not load your requests. Please refresh.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMyRequests();

  // Attach click listener for video cards
  document.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => {
      const video = card.querySelector('video');
      if (!video) return;
      if (video.paused) { video.play(); video.controls = true; }
      else { video.pause(); }
    });
  });
});
