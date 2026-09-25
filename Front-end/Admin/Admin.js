// Admin.js
// --- Three.js Background Wireframe Grid System ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hero-canvas'), alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Geometry: Rotating Wireframe Icosahedron
const geometry = new THREE.IcosahedronGeometry(3, 2);
const material = new THREE.MeshBasicMaterial({
    color: 0xC084FC,
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

// --- Portfolio Filter Functionality ---
function filterAssets(category) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    } else {
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(category)) {
                btn.classList.add('active');
            }
        });
    }

    const cards = document.querySelectorAll('.asset-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
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

function showNotifications() {
    closeMenuDropdown();
    alert('No new notifications at this time.');
}

function visitClientDashboard() {
    closeMenuDropdown();
    window.location.href = '../../Front-end/Customer/Customer.html';
}   

function visitWorkSpace() {
    closeMenuDropdown();
    window.location.href = 'Workspace.html';
}

function openSettingsModal(tabKey = 'profile') {
    closeMenuDropdown();
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
    alert('Admin profile settings updated successfully!');
    closeModal('settingsModal');
}

function saveSecurityPrivacy(event) {
    event.preventDefault();
    alert('Security and privacy preferences updated successfully!');
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
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '../Login/login.html';
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
            let response;
            try {
                response = await fetch(`http://localhost:5000/api/requests/${mongoId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
            } catch (err) {
                response = await fetch(`http://127.0.0.1:5000/api/requests/${mongoId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
            }

            const data = await response.json();
            if (!data.success) {
                alert('Could not update status: ' + (data.message || 'Server error'));
                buttons.forEach(b => b.disabled = false);
                return;
            }
        } catch (error) {
            alert('Could not reach the server to update status.');
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
        if (req.fileName && req.filePath) {
            const fileUrl = getClientFileUrl(req.filePath);
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

    try {
        let response;
        try {
            response = await fetch('http://localhost:5000/api/requests');
        } catch (err) {
            response = await fetch('http://127.0.0.1:5000/api/requests');
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
                req.filePath || ''
            );
        });
    } catch (error) {
        console.error('Could not load requests from server:', error);
        if (counter) counter.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Server Offline';
    }
}

// Load real requests as soon as the admin page opens
document.addEventListener('DOMContentLoaded', loadRequestsFromServer);