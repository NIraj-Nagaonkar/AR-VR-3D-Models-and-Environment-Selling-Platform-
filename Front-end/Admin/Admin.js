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
    color: 0x00D2FF,
    wireframe: true,
    transparent: true,
    opacity: 0.25
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

// --- Hamburger Menu Toggle & Dropdown ---
function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('open');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('menuDropdown');
    const toggleBtn = document.querySelector('.menu-toggle');
    if (!dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        dropdown.classList.remove('open');
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
    document.getElementById('menuDropdown').classList.remove('open');
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

function saveProfile(event) {
    event.preventDefault();
    alert('Profile settings updated successfully!');
    closeModal('profileModal');
}

function saveSettings(event) {
    event.preventDefault();
    alert('System preferences saved successfully!');
    closeModal('settingsModal');
}

// Close modals when clicking outside content box
window.addEventListener('click', (e) => {
    const profileModal = document.getElementById('profileModal');
    const settingsModal = document.getElementById('settingsModal');
    if (e.target === profileModal) closeModal('profileModal');
    if (e.target === settingsModal) closeModal('settingsModal');
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

// Function handle queue item decisions (Accept / Reject) - now persists to backend
async function handleQueueAction(buttonElement, decision) {
    const row = buttonElement.closest('tr');
    const statusCell = row.querySelector('.status-badge');
    const actionsCell = row.querySelector('.queue-actions');
    const mongoId = row.getAttribute('data-mongo-id');

    const newStatus = decision === 'accept' ? 'Accepted' : 'Rejected';

    // Update backend first (if this row came from the database)
    if (mongoId) {
        try {
            const response = await fetch(`http://localhost:5000/api/requests/${mongoId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (!data.success) {
                alert('Could not update status: ' + data.message);
                return;
            }
        } catch (error) {
            alert('Could not reach the server to update status.');
            console.error('Status update error:', error);
            return;
        }
    }

    if (decision === 'accept') {
        statusCell.className = 'status-badge accepted';
        statusCell.innerText = 'Accepted';
        actionsCell.innerHTML = '<span style="color: #059669; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-check"></i> Approved</span>';
    } else if (decision === 'reject') {
        statusCell.className = 'status-badge rejected';
        statusCell.innerText = 'Rejected';
        actionsCell.innerHTML = '<span style="color: #DC2626; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-xmark"></i> Declined</span>';
    }
}

// Optional utility function to dynamically inject a request row if you want to test UI behavior locally
// mongoId (optional): if provided, Accept/Reject buttons will persist status changes to the backend
function addSampleRequestToQueue(requestId, clientName, projectTitle, category, date, status = 'Pending', mongoId = null) {
    const tbody = document.getElementById('queueTableBody');
    const emptyRow = document.getElementById('emptyQueueRow');
    if (emptyRow) emptyRow.remove();

    const newRow = document.createElement('tr');
    if (mongoId) newRow.setAttribute('data-mongo-id', mongoId);

    const statusClass = status.toLowerCase(); // 'pending' | 'accepted' | 'rejected'
    let actionsHtml = `
        <div class="queue-actions">
            <button class="btn btn-accept btn-sm" onclick="handleQueueAction(this, 'accept')"><i class="fa-solid fa-check"></i> Accept</button>
            <button class="btn btn-reject btn-sm" onclick="handleQueueAction(this, 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
        </div>
    `;
    if (status === 'Accepted') {
        actionsHtml = '<span style="color: #059669; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-check"></i> Approved</span>';
    } else if (status === 'Rejected') {
        actionsHtml = '<span style="color: #DC2626; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-xmark"></i> Declined</span>';
    }

    newRow.innerHTML = `
        <td>#${requestId}</td>
        <td>${clientName}</td>
        <td>${projectTitle}</td>
        <td><span class="tag">${category}</span></td>
        <td>${date}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>${actionsHtml}</td>
    `;
    tbody.appendChild(newRow);
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
    try {
        const response = await fetch('http://localhost:5000/api/requests');
        const data = await response.json();

        if (!data.success || !data.requests || data.requests.length === 0) {
            return; // leave the "No active project requests" empty state as-is
        }

        data.requests.forEach((req) => {
            const shortId = req._id.slice(-6).toUpperCase();
            const projectTitle = req.specifications.length > 40
                ? req.specifications.slice(0, 40) + '...'
                : req.specifications;
            const category = PLATFORM_LABELS[req.targetPlatform] || req.targetPlatform;
            const date = new Date(req.createdAt).toLocaleDateString();

            addSampleRequestToQueue(
                shortId,
                req.fullName,
                projectTitle,
                category,
                date,
                req.status,
                req._id
            );
        });
    } catch (error) {
        console.error('Could not load requests from server:', error);
    }
}

// Load real requests as soon as the admin page opens
document.addEventListener('DOMContentLoaded', loadRequestsFromServer);