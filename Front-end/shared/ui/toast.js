/**
 * shared/ui/toast.js
 * Lightweight toast notification system.
 * Replaces every browser alert() call across the app.
 *
 * Usage:
 *   import { showToast } from '../shared/ui/toast.js';
 *   showToast('Request submitted!', 'success');
 *   showToast('Invalid file type', 'error');
 *   showToast('Please wait...', 'warning');
 *   showToast('Note saved', 'info');
 */

const ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info',
};

function ensureContainer() {
  let c = document.getElementById('ather-toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'ather-toast-container';
    c.setAttribute('aria-live', 'polite');
    c.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:99999;
      display:flex; flex-direction:column; gap:10px; max-width:360px;
    `;
    document.body.appendChild(c);
  }
  return c;
}

export function showToast(message, type = 'info', duration = 4000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  const icon  = ICONS[type] || ICONS.info;

  toast.style.cssText = `
    display:flex; align-items:center; gap:10px;
    padding:12px 16px; border-radius:10px;
    font-family:Montserrat,sans-serif; font-size:14px; font-weight:500;
    color:#fff; box-shadow:0 4px 20px rgba(0,0,0,.25);
    animation:ather-slide-in .25s ease;
    cursor:pointer;
    ${type === 'success' ? 'background:#16A34A;' :
      type === 'error'   ? 'background:#DC2626;' :
      type === 'warning' ? 'background:#D97706;' :
                           'background:#2563EB;'}
  `;

  // Safe DOM creation — never interpret message as HTML to prevent XSS
  const iconEl = document.createElement('i');
  iconEl.className = `fa-solid ${icon}`;
  iconEl.style.flexShrink = '0';

  const textEl = document.createElement('span');
  textEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(textEl);
  toast.addEventListener('click', () => dismiss(toast));

  container.appendChild(toast);

  // Inject keyframe once
  if (!document.getElementById('ather-toast-style')) {
    const style = document.createElement('style');
    style.id = 'ather-toast-style';
    style.textContent = `
      @keyframes ather-slide-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
      @keyframes ather-slide-out { to { opacity:0; transform:translateY(12px); } }
    `;
    document.head.appendChild(style);
  }

  if (duration > 0) setTimeout(() => dismiss(toast), duration);
}

function dismiss(toast) {
  toast.style.animation = 'ather-slide-out .25s ease forwards';
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}
