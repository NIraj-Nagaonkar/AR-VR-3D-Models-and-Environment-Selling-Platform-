// Admin.js

// ── Auth guard (non-module: read localStorage directly) ──────────────────────
(function adminAuthGuard() {
    try {
        const session = JSON.parse(localStorage.getItem('ather_session') || '{}');
        if (!session.token) {
            const next = encodeURIComponent(window.location.pathname);
            window.location.replace('/Login/login.html?next=' + next);
            return;
        }
        if (session.user && session.user.role !== 'admin') {
            window.location.replace('/Customer/Customer.html');
        }
    } catch (e) {
        window.location.replace('/Login/login.html');
    }
})();

// --- Three.js Background Wireframe Grid System ---
// Wrapped in try/catch — if CDN fails the rest of the page still works
try {
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hero-canvas'), alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Geometry: Rotating Wireframe Icosahedron
const geometry = new THREE.IcosahedronGeometry(3, 2);
const material = new THREE.MeshBasicMaterial({
    color: 0x38BDF8,
    wireframe: true,
    transparent: true,
    opacity: 0.35
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 6;

// Mouse interaction effect
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.x += 0.003;
    sphere.rotation.y += 0.005;

    sphere.rotation.y += mouseX * 0.05;
    sphere.rotation.x += mouseY * 0.05;

    renderer.render(scene, camera);
}
animate();

// Responsive Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
} catch (threeErr) {
    console.warn('Three.js canvas not available:', threeErr.message);
}

// --- Portfolio Filter Functionality ---
function filterAssets(category, clickedBtn) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('onclick')?.includes("'" + category + "'")) {
                btn.classList.add('active');
            }
        });
    }

    // Show/hide cards
    document.querySelectorAll('.asset-card').forEach(card => {
        const match = category === 'all' || card.getAttribute('data-category') === category;
        card.style.display = match ? 'flex' : 'none';
    });
}

// --- Hamburger Menu Toggle & Dropdown Sheet ---
function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    const backdrop = document.getElementById('menuBackdrop');
    const toggleBtn = document.querySelector('.menu-toggle');
    if (!dropdown) return;
    const isOpen = dropdown.classList.toggle('open');
    if (backdrop) {
        backdrop.classList.toggle('open', isOpen);
    }
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isOpen);
    }
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('menuDropdown');
    const toggleBtn = document.querySelector('.menu-toggle');
    if (dropdown && toggleBtn && !dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeMenuDropdown();
    }
});

// Close dropdown when pressing Escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenuDropdown();
    }
});

// --- AI Chat Drawer Control Logic ---
function toggleAiChatDrawer() {
    const drawer = document.getElementById('aiChatDrawer');
    drawer.classList.toggle('open');
}

// --- Modal Controls & Navigation Actions ---
function openModal(modalId) {
    closeMenuDropdown();
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    const backdrop = document.getElementById('menuBackdrop');
    const toggleBtn = document.querySelector('.menu-toggle');
    dropdown?.classList.remove('open');
    backdrop?.classList.remove('open');
    toggleBtn?.classList.remove('active');
}

function showAdminToast(msg, type = 'info') {
    let c = document.getElementById('admin-toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'admin-toast-container';
        c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.style.cssText = 'padding:10px 16px;border-radius:8px;color:#fff;font-family:sans-serif;font-size:13px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);';
    t.style.background = type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#9333ea';
    const icon = document.createElement('i');
    icon.className = `fa-solid ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`;
    const span = document.createElement('span');
    span.textContent = msg;
    t.appendChild(icon);
    t.appendChild(span);
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function showNotifications() {
    closeMenuDropdown();
    showAdminToast('No new notifications at this time.', 'info');
}

function visitClientDashboard() {
    closeMenuDropdown();
    window.location.href = '/Customer/Customer.html';
}   

function visitWorkSpace() {
    closeMenuDropdown();
    window.location.href = 'Workspace.html';
}

function loadAdminProfileData() {
    try {
        const session = JSON.parse(localStorage.getItem('ather_session') || '{}');
        const user = session.user || {};
        const adminName = user.name || 'Admin';
        const adminEmail = user.email || 'ather3dadmin@gmail.com';

        // Compute initials (e.g. "Admin" -> "AD", "Niraj Nagaonkar" -> "NN")
        let initials = 'AD';
        if (adminName) {
            const parts = adminName.trim().split(/\s+/);
            initials = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : (adminName.length > 1 ? adminName.substring(0, 2).toUpperCase() : adminName[0].toUpperCase());
        }

        // Top nav header pill
        const navAvatar = document.getElementById('navAdminAvatar');
        const navName = document.getElementById('navAdminName');
        if (navAvatar) navAvatar.textContent = initials;
        if (navName) navName.textContent = adminName;

        // Modal hero card
        const modalAvatar = document.getElementById('adminModalAvatar');
        const modalNameDisplay = document.getElementById('adminModalNameDisplay');
        const modalEmailDisplay = document.getElementById('adminModalEmailDisplay');
        if (modalAvatar) modalAvatar.textContent = initials;
        if (modalNameDisplay) modalNameDisplay.textContent = adminName;
        if (modalEmailDisplay) modalEmailDisplay.textContent = adminEmail;

        // Form inputs
        const profileNameInput = document.getElementById('profileName');
        const profileEmailInput = document.getElementById('profileEmail');
        if (profileNameInput && !profileNameInput.matches(':focus')) {
            profileNameInput.value = adminName;
        }
        if (profileEmailInput && !profileEmailInput.matches(':focus')) {
            profileEmailInput.value = adminEmail;
        }
    } catch (e) {
        console.warn('Could not load admin profile data', e);
    }
}

function openSettingsModal(tabKey = 'profile') {
    closeMenuDropdown();
    loadAdminProfileData();
    switchSettingsTab(tabKey);
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
}

function switchSettingsTab(tabKey) {
    const tabs = ['profile', 'session', 'security'];
    tabs.forEach(t => {
        const cap = t.charAt(0).toUpperCase() + t.slice(1);
        const btn = document.getElementById(`tabBtn${cap}`);
        const panel = document.getElementById(`panel${cap}`);
        if (btn) btn.classList.toggle('active', t === tabKey);
        if (panel) panel.classList.toggle('active', t === tabKey);
    });
}

function saveProfile(event) {
    event.preventDefault();
    try {
        const newName = document.getElementById('profileName')?.value.trim();
        if (newName) {
            const session = JSON.parse(localStorage.getItem('ather_session') || '{}');
            if (session.user) {
                session.user.name = newName;
                localStorage.setItem('ather_session', JSON.stringify(session));
            }
        }
        loadAdminProfileData();
        showAdminToast('Admin profile updated successfully!', 'success');
        closeModal('settingsModal');
    } catch (e) {
        showAdminToast('Failed to save profile changes.', 'error');
    }
}

function saveSecurityPrivacy(event) {
    event.preventDefault();
    showAdminToast('Security and privacy preferences updated successfully!', 'success');
    closeModal('settingsModal');
}

function clearSessionLogs() {
    const list = document.getElementById('sessionLogsList');
    if (list) {
        list.innerHTML = `
            <div style="padding: 1rem; color: #64748B; font-size: 0.88rem; text-align: center;">
                <i class="fa-solid fa-check"></i> Session activity logs cleared.
            </div>
        `;
    }
}

function logoutAdmin() {
    if (confirm('Are you sure you want to end your administrator session and log out?')) {
        localStorage.removeItem('ather_session');
        window.location.href = '/Login/login.html';
    }
}

// Close modals when clicking outside content box
window.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    const requestDetailsModal = document.getElementById('requestDetailsModal');
    if (e.target === settingsModal) closeModal('settingsModal');
    if (e.target === requestDetailsModal) closeModal('requestDetailsModal');
});

// --- Integrated AI Chat API Logic ---
async function handleSendMessage(event) {
    event.preventDefault();
    const inputField = document.getElementById('chatInput');
    const messageContainer = document.getElementById('chatMessages');
    const userText = inputField.value.trim();

    if (!userText) return;

    // Append User Message
    const userBubble = document.createElement('div');
    userBubble.className = 'message user';
    userBubble.innerText = userText;
    messageContainer.appendChild(userBubble);

    inputField.value = '';
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Append temporary Loading Bubble for AI response
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'message assistant';
    loadingBubble.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing request...';
    messageContainer.appendChild(loadingBubble);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    try {
        // Simulated delay & response for AI API integration endpoint
        await new Promise(resolve => setTimeout(resolve, 1000));
        let aiReply = `I've analyzed your request regarding "${userText}". All active 3D/AR models are operating nominally.`;
        
        if (userText.toLowerCase().includes('model') || userText.toLowerCase().includes('environment')) {
            aiReply = "You can filter through company 3D AR/VR models and immersive environments right from the main asset gallery.";
        } else if (userText.toLowerCase().includes('client') || userText.toLowerCase().includes('dashboard')) {
            aiReply = "You can jump to the client-side view anytime via the top right menu options.";
        }

        loadingBubble.innerText = aiReply;
    } catch (error) {
        loadingBubble.innerText = "Error connecting to AI API endpoint. Please check your network configuration.";
        loadingBubble.style.color = "#DC2626";
    }
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// --- Queue Project Request Management Logic ---

// Function handle queue item decisions (Accept / Reject) - persists to backend
async function handleQueueAction(buttonElement, decision) {
    const row = buttonElement.closest('tr');
    const statusCell = row.querySelector('.status-badge');
    const actionsCell = row.querySelector('.queue-actions') || buttonElement.parentElement;
    const mongoId = row.getAttribute('data-mongo-id');

    const newStatus = decision === 'accept' ? 'Accepted' : 'Rejected';

    // Disable buttons while updating
    const buttons = row.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);

    // Update backend first (if this row came from the database)
    if (mongoId) {
        try {
            const session = JSON.parse(localStorage.getItem('ather_session') || '{}');
            const token   = session.token || '';
            const response = await fetch(`/api/requests/${mongoId}/status`, {
                method:  'PATCH',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();
            if (!data.success) {
                // Show inline error without blocking alert()
                console.error('Status update failed:', data.message);
                const toast = document.createElement('div');
                toast.textContent = 'Could not update status: ' + (data.message || 'Server error');
                toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#DC2626;color:#fff;padding:12px 18px;border-radius:8px;z-index:9999;font-family:Montserrat,sans-serif';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
                buttons.forEach(b => b.disabled = false);
                return;
            }
        } catch (error) {
            console.error('Status update error:', error);
            buttons.forEach(b => b.disabled = false);
            return;
        }
    }

    if (decision === 'accept') {
        statusCell.className = 'status-badge accepted';
        statusCell.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Accepted</span>';
        actionsCell.innerHTML = '<span class="action-status-approved"><i class="fa-solid fa-check"></i> Approved</span>';
    } else if (decision === 'reject') {
        statusCell.className = 'status-badge rejected';
        statusCell.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <span>Rejected</span>';
        actionsCell.innerHTML = '<span class="action-status-declined"><i class="fa-solid fa-xmark"></i> Declined</span>';
    }
}

// Helper to get downloadable/viewable URL for uploaded client files
function getClientFileUrl(filePath) {
    if (!filePath) return '';
    const filename = filePath.split(/[/\\]/).pop();
    return `/uploads/${encodeURIComponent(filename)}`;
}

// Helper to determine the appropriate font-awesome icon for files
function getFileIconClass(fileName) {
    if (!fileName) return 'fa-file';
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'fa-file-pdf';
    if (lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.obj') || lower.endsWith('.fbx')) return 'fa-cube';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) return 'fa-file-image';
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) return 'fa-file-zipper';
    return 'fa-file-lines';
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Utility function to dynamically inject a request row into the queue table
function addSampleRequestToQueue(requestId, clientName, customDescription, category, date, status = 'Pending', mongoId = null, email = '', fileName = '', filePath = '') {
    const tbody = document.getElementById('queueTableBody');
    const emptyRow = document.getElementById('emptyQueueRow');
    if (emptyRow) emptyRow.remove();

    const newRow = document.createElement('tr');
    if (mongoId) newRow.setAttribute('data-mongo-id', mongoId);

    const statusClass = status.toLowerCase(); // 'pending' | 'accepted' | 'rejected'
    let actionsHtml = `
        <div class="queue-actions">
            <button class="btn btn-details btn-sm" onclick="openRequestDetails('${mongoId}')" title="View Full Description & Details"><i class="fa-solid fa-eye"></i> Details</button>
            <button class="btn btn-accept btn-sm" onclick="handleQueueAction(this, 'accept')"><i class="fa-solid fa-check"></i> Accept</button>
            <button class="btn btn-reject btn-sm" onclick="handleQueueAction(this, 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
        </div>
    `;
    if (status === 'Accepted') {
        actionsHtml = `
            <div class="queue-actions">
                <button class="btn btn-details btn-sm" onclick="openRequestDetails('${mongoId}')" title="View Full Description & Details"><i class="fa-solid fa-eye"></i> Details</button>
                <span class="action-status-approved"><i class="fa-solid fa-check"></i> Approved</span>
            </div>
        `;
    } else if (status === 'Rejected') {
        actionsHtml = `
            <div class="queue-actions">
                <button class="btn btn-details btn-sm" onclick="openRequestDetails('${mongoId}')" title="View Full Description & Details"><i class="fa-solid fa-eye"></i> Details</button>
                <span class="action-status-declined"><i class="fa-solid fa-xmark"></i> Declined</span>
            </div>
        `;
    }

    let statusIcon = '<i class="fa-solid fa-clock"></i>';
    if (statusClass === 'accepted') statusIcon = '<i class="fa-solid fa-circle-check"></i>';
    if (statusClass === 'rejected') statusIcon = '<i class="fa-solid fa-circle-xmark"></i>';

    // File Column HTML
    let fileHtml = '<span class="no-file-badge"><i class="fa-solid fa-minus"></i> No File</span>';
    if (fileName && filePath) {
        const fileUrl = getClientFileUrl(filePath);
        const iconClass = getFileIconClass(fileName);
        const shortName = fileName.length > 20 ? fileName.slice(0, 18) + '...' : fileName;
        fileHtml = `
            <a href="${fileUrl}" target="_blank" class="client-file-btn" download="${escapeHtml(fileName)}" title="View / Download ${escapeHtml(fileName)}">
                <i class="fa-solid ${iconClass}"></i>
                <span class="file-name-text">${escapeHtml(shortName)}</span>
            </a>
        `;
    }

    // Truncated Description for Table Cell
    const truncatedDesc = customDescription && customDescription.length > 55
        ? customDescription.slice(0, 52) + '...'
        : (customDescription || 'No description provided');

    newRow.innerHTML = `
        <td><span class="request-id-badge">#${requestId}</span></td>
        <td>
            <div class="client-name-cell" title="${email || clientName}">
                <div class="client-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="client-info">
                    <span class="client-name">${escapeHtml(clientName)}</span>
                    ${email ? `<span class="client-email">${escapeHtml(email)}</span>` : ''}
                </div>
            </div>
        </td>
        <td class="custom-desc-cell">
            <div class="custom-desc-preview" onclick="openRequestDetails('${mongoId}')" title="Click to view full description: ${escapeHtml(customDescription)}">
                <span>${escapeHtml(truncatedDesc)}</span>
            </div>
        </td>
        <td><span class="category-badge">${escapeHtml(category)}</span></td>
        <td class="client-file-cell">${fileHtml}</td>
        <td class="date-cell">${date}</td>
        <td class="status-cell"><span class="status-badge ${statusClass}">${statusIcon} <span>${status}</span></span></td>
        <td class="actions-cell">${actionsHtml}</td>
    `;
    tbody.appendChild(newRow);
}

// Global store for fetched requests to populate detail view
window.allProjectRequests = [];

// --- Open Request Details Modal with Custom Description & Client Sent File ---
function openRequestDetails(mongoId) {
    if (!window.allProjectRequests) return;
    const req = window.allProjectRequests.find(r => r._id === mongoId);
    if (!req) return;

    const shortId = req._id ? req._id.slice(-6).toUpperCase() : 'REQ';
    const category = PLATFORM_LABELS[req.targetPlatform] || req.targetPlatform || 'General';
    const date = req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Recent';
    const status = req.status || 'Pending';
    const statusClass = status.toLowerCase();

    // Populate Meta Cards
    document.getElementById('detailRequestId').innerText = `#${shortId}`;
    
    let statusIcon = '<i class="fa-solid fa-clock"></i>';
    if (statusClass === 'accepted') statusIcon = '<i class="fa-solid fa-circle-check"></i>';
    if (statusClass === 'rejected') statusIcon = '<i class="fa-solid fa-circle-xmark"></i>';
    document.getElementById('detailStatusBadge').innerHTML = `<span class="status-badge ${statusClass}">${statusIcon} <span>${status}</span></span>`;

    document.getElementById('detailClientName').innerText = req.fullName || 'Client';
    document.getElementById('detailClientEmail').innerHTML = req.workEmail 
        ? `<a href="mailto:${escapeHtml(req.workEmail)}" style="color: var(--primary-purple); text-decoration: none;">${escapeHtml(req.workEmail)}</a>`
        : 'Not provided';
    document.getElementById('detailPlatform').innerText = category;
    document.getElementById('detailDate').innerText = date;

    // Populate Client Custom Description
    const descBox = document.getElementById('detailDescriptionText');
    if (descBox) {
        descBox.innerText = req.specifications || 'No custom description provided by client.';
    }

    // Populate Client Sent File
    const fileContainer = document.getElementById('detailFileContainer');
    if (fileContainer) {
        if (req.fileName && req.fileKey) {
            const fileUrl = getClientFileUrl(req.fileKey);
            const iconClass = getFileIconClass(req.fileName);
            fileContainer.innerHTML = `
                <div class="file-preview-card">
                    <div class="file-icon-box"><i class="fa-solid ${iconClass}"></i></div>
                    <div class="file-info-box">
                        <span class="file-title" title="${escapeHtml(req.fileName)}">${escapeHtml(req.fileName)}</span>
                        <span class="file-subtitle">Uploaded Reference / Blueprint File</span>
                    </div>
                    <a href="${fileUrl}" target="_blank" class="btn btn-primary btn-sm btn-download-file" download="${escapeHtml(req.fileName)}">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open / Download File
                    </a>
                </div>
            `;
        } else {
            fileContainer.innerHTML = `
                <div class="no-file-alert">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>No reference file attached by client for this project request.</span>
                </div>
            `;
        }
    }

    // Modal Footer Actions
    const modalFooter = document.getElementById('detailModalFooter');
    if (modalFooter) {
        if (status === 'Pending') {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-outline btn-sm" onclick="closeModal('requestDetailsModal')">Close</button>
                <button type="button" class="btn btn-reject btn-sm" onclick="handleModalDecision('${mongoId}', 'reject')"><i class="fa-solid fa-xmark"></i> Reject Request</button>
                <button type="button" class="btn btn-accept btn-sm" onclick="handleModalDecision('${mongoId}', 'accept')"><i class="fa-solid fa-check"></i> Accept Request</button>
            `;
        } else {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-outline btn-sm" onclick="closeModal('requestDetailsModal')">Close</button>
            `;
        }
    }

    openModal('requestDetailsModal');
}

// Handle Decision from inside the Modal
async function handleModalDecision(mongoId, decision) {
    const row = document.querySelector(`tr[data-mongo-id="${mongoId}"]`);
    if (row) {
        const actionBtn = row.querySelector(decision === 'accept' ? '.btn-accept' : '.btn-reject');
        if (actionBtn) {
            await handleQueueAction(actionBtn, decision);
        }
    }

    // Update in-memory record
    const req = window.allProjectRequests?.find(r => r._id === mongoId);
    if (req) {
        req.status = decision === 'accept' ? 'Accepted' : 'Rejected';
    }

    closeModal('requestDetailsModal');
}

// --- Fetch real requests from the backend and populate the queue table ---
const PLATFORM_LABELS = {
    'meta-quest': 'Meta Quest / PC VR',
    'apple-vision': 'Apple Vision Pro',
    'mobile-ar': 'Mobile AR',
    'webxr': 'WebXR',
    'other': 'Multiple / Unsure',
};

async function loadRequestsFromServer() {
    const tbody = document.getElementById('queueTableBody');
    const counter = document.getElementById('queueCounter');

    // Show loading state
    if (counter) counter.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading requests...';
    if (tbody) tbody.innerHTML = `
        <tr><td colspan="8" class="empty-queue-row">
            <div class="empty-queue-content">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Loading incoming requests...</span>
            </div>
        </td></tr>`;

    try {
        const session = JSON.parse(localStorage.getItem('ather_session') || '{}');
        const token   = session.token || '';

        if (!token) {
            window.location.replace('/Login/login.html?next=' + encodeURIComponent(window.location.pathname));
            return;
        }

        const response = await fetch('/api/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Session expired — show message and redirect
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('ather_session');
            if (counter) counter.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Session expired';
            if (tbody) tbody.innerHTML = `
                <tr><td colspan="8" class="empty-queue-row">
                    <div class="empty-queue-content">
                        <i class="fa-solid fa-lock"></i>
                        <span>Session expired. <a href="/Login/login.html" style="color:var(--primary-purple)">Please log in again.</a></span>
                    </div>
                </td></tr>`;
            setTimeout(() => window.location.replace('/Login/login.html'), 2500);
            return;
        }

        const data = await response.json();

        if (!data.success || !data.requests || data.requests.length === 0) {
            window.allProjectRequests = [];
            if (tbody) {
                tbody.innerHTML = `
                    <tr id="emptyQueueRow">
                        <td colspan="8" class="empty-queue-row">
                            <div class="empty-queue-content">
                                <i class="fa-regular fa-folder-open"></i>
                                <span>No active project requests in queue. (Waiting for incoming client submissions)</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
            if (counter) counter.innerHTML = '<i class="fa-solid fa-inbox"></i> 0 Requests';
            return;
        }

        window.allProjectRequests = data.requests;

        if (tbody) tbody.innerHTML = '';
        if (counter) {
            const count = data.requests.length;
            counter.innerHTML = `<i class="fa-solid fa-list-check"></i> ${count} Project Request${count === 1 ? '' : 's'}`;
        }

        data.requests.forEach((req) => {
            const shortId = req._id ? req._id.slice(-6).toUpperCase() : 'REQ';
            const category = PLATFORM_LABELS[req.targetPlatform] || req.targetPlatform || 'General';
            const date = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent';

            addSampleRequestToQueue(
                shortId,
                req.fullName || 'Client',
                req.specifications || '',
                category,
                date,
                req.status || 'Pending',
                req._id,
                req.workEmail || '',
                req.fileName || '',
                req.fileKey  || ''
            );
        });
    } catch (error) {
        console.error('Could not load requests from server:', error);
        if (counter) counter.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Server Offline';
    }
}

// Initialize admin profile and load real requests on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfileData();
    loadRequestsFromServer();
});
