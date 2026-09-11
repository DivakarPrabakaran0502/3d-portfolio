/**
 * dashboard.js — Protected dashboard logic
 * Features: auth guard, portfolio CRUD, mini Three.js card previews,
 * modal forms, stats, view/list toggle.
 */

const API = '';
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

// ─── Auth Guard ────────────────────────────────────────────────
if (!token) { window.location.href = '/login.html'; }

let currentUser = null;
try { currentUser = JSON.parse(userStr); } catch(e) {}

// ─── State ─────────────────────────────────────────────────────
let portfolioItems = [];
let editingId      = null;
let selectedColor  = '#6366f1';
let selectedShape  = 'torusknot';
let cardRenderers  = {};

// ─── DOM Refs ─────────────────────────────────────────────────
const portfolioGrid   = document.getElementById('portfolio-grid');
const modal           = document.getElementById('item-modal');
const modalBackdrop   = document.getElementById('modal-backdrop');
const modalTitle      = document.getElementById('modal-title');
const itemForm        = document.getElementById('item-form');
const addBtn          = document.getElementById('add-btn');
const statCount       = document.getElementById('stat-count');
const statViews       = document.getElementById('stat-views');
const statCategories  = document.getElementById('stat-categories');
const userNameEls     = document.querySelectorAll('.js-user-name');
const userEmailEls    = document.querySelectorAll('.js-user-email');
const userAvatarEls   = document.querySelectorAll('.js-user-avatar');
const logoutBtn       = document.getElementById('logout-btn');

// ─── Helpers ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon"></span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeInUp 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ─── User Info ─────────────────────────────────────────────────
function populateUser() {
  if (!currentUser) return;
  userNameEls.forEach(el  => el.textContent = currentUser.name);
  userEmailEls.forEach(el => el.textContent = currentUser.email);
  userAvatarEls.forEach(el => {
    el.src = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff&bold=true`;
    el.alt = currentUser.name;
  });
}

// ─── Fetch Portfolio ───────────────────────────────────────────
async function fetchPortfolio() {
  try {
    const res  = await fetch(`${API}/api/portfolio`, { headers: authHeaders() });
    if (res.status === 401) { localStorage.clear(); window.location.href = '/login.html'; return; }
    portfolioItems = await res.json();
    renderGrid();
    updateStats();
  } catch (err) {
    showToast('Failed to load portfolio.', 'error');
  }
}

// ─── Stats ────────────────────────────────────────────────────
function updateStats() {
  if (statCount)      statCount.textContent      = portfolioItems.length;
  if (statViews)      statViews.textContent      = portfolioItems.reduce((s, i) => s + (i.views || 0), 0);
  if (statCategories) statCategories.textContent = new Set(portfolioItems.map(i => i.category)).size;
}

// ─── Render Grid ───────────────────────────────────────────────
function renderGrid() {
  // Cleanup old Three.js renderers
  Object.values(cardRenderers).forEach(r => { r.dispose(); });
  cardRenderers = {};

  if (!portfolioItems.length) {
    portfolioGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌌</div>
        <div class="empty-state-title">No projects yet</div>
        <p class="empty-state-desc">Add your first portfolio project to get started.</p>
        <button class="btn-glow" onclick="openModal()">✦ Add Project</button>
      </div>`;
    return;
  }

  portfolioGrid.innerHTML = portfolioItems.map(item => `
    <div class="portfolio-card" data-id="${item.id}">
      <div class="card-canvas-wrap">
        <canvas class="card-canvas" id="canvas-${item.id}"></canvas>
        <div class="card-category-badge">${item.category}</div>
        <div class="card-actions-overlay">
          <button class="icon-btn edit" onclick="openModal('${item.id}')" title="Edit">✎</button>
          <button class="icon-btn delete" onclick="deleteItem('${item.id}')" title="Delete">✕</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <p class="card-desc">${escapeHtml(item.description)}</p>
        <div class="card-tags">
          ${(item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="card-footer">
          <div class="card-links">
            ${item.liveUrl ? `<a href="${item.liveUrl}" target="_blank" class="card-link">🔗 Live</a>` : ''}
            ${item.githubUrl ? `<a href="${item.githubUrl}" target="_blank" class="card-link">⌥ GitHub</a>` : ''}
          </div>
          <span class="card-views">👁 ${item.views || 0}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Initialize mini Three.js previews after DOM is updated
  requestAnimationFrame(() => {
    portfolioItems.forEach(item => initCardScene(item));
  });
}

// ─── Mini Three.js Card Scene ──────────────────────────────────
function initCardScene(item) {
  const canvas = document.getElementById(`canvas-${item.id}`);
  if (!canvas || typeof THREE === 'undefined') return;

  const w = canvas.clientWidth  || 320;
  const h = canvas.clientHeight || 180;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 3.5;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  const color   = parseInt(item.color.replace('#', '0x'));
  const pointL  = new THREE.PointLight(color, 4, 20);
  pointL.position.set(3, 3, 3);
  const pointL2 = new THREE.PointLight(0xffffff, 1.5, 15);
  pointL2.position.set(-3, -2, 2);
  scene.add(ambient, pointL, pointL2);

  // Main mesh based on shape
  const geo = getGeometry(item.shape || 'torusknot');
  const mat = new THREE.MeshPhongMaterial({
    color:     color,
    emissive:  color,
    emissiveIntensity: 0.15,
    shininess: 100,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Wireframe overlay
  const wgeo = getGeometry(item.shape || 'torusknot');
  const wmat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 });
  const wmesh = new THREE.Mesh(wgeo, wmat);
  scene.add(wmesh);

  // Particle halo
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) {
    const r = 1.5 + Math.random();
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i*3+2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color, size: 0.04, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  let t = 0;
  function loop() {
    if (!document.getElementById(`canvas-${item.id}`)) {
      renderer.dispose();
      return;
    }
    requestAnimationFrame(loop);
    t += 0.012;
    mesh.rotation.x  = t * 0.4;
    mesh.rotation.y  = t * 0.6;
    wmesh.rotation.x = t * 0.4;
    wmesh.rotation.y = t * 0.6;
    mat.emissiveIntensity = 0.1 + Math.abs(Math.sin(t)) * 0.25;
    renderer.render(scene, camera);
  }
  loop();

  cardRenderers[item.id] = renderer;
}

function getGeometry(shape) {
  switch (shape) {
    case 'torus':       return new THREE.TorusGeometry(0.8, 0.3, 16, 60);
    case 'torusknot':   return new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16);
    case 'sphere':      return new THREE.SphereGeometry(0.9, 32, 32);
    case 'icosahedron': return new THREE.IcosahedronGeometry(0.9, 1);
    case 'octahedron':  return new THREE.OctahedronGeometry(0.95, 0);
    case 'box':         return new THREE.BoxGeometry(1.2, 1.2, 1.2);
    default:            return new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Modal ─────────────────────────────────────────────────────
window.openModal = function(id = null) {
  editingId = id;
  clearForm();

  if (id) {
    const item = portfolioItems.find(i => i.id === id);
    if (!item) return;
    modalTitle.textContent = 'Edit Project';
    document.getElementById('f-title').value       = item.title;
    document.getElementById('f-description').value = item.description;
    document.getElementById('f-category').value    = item.category;
    document.getElementById('f-tags').value        = (item.tags || []).join(', ');
    document.getElementById('f-liveUrl').value     = item.liveUrl || '';
    document.getElementById('f-githubUrl').value   = item.githubUrl || '';
    selectedColor = item.color || '#6366f1';
    selectedShape = item.shape || 'torusknot';
  } else {
    modalTitle.textContent = 'New Project';
    selectedColor = '#6366f1';
    selectedShape = 'torusknot';
  }

  updateColorSelection();
  updateShapeSelection();
  modalBackdrop.classList.add('open');
};

window.closeModal = function() {
  modalBackdrop.classList.remove('open');
  editingId = null;
};

function clearForm() {
  itemForm.reset();
  document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(el => {
    el.style.borderColor = '';
  });
}

// Color swatches
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    selectedColor = sw.dataset.color;
    updateColorSelection();
  });
});
function updateColorSelection() {
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.color === selectedColor);
  });
}

// Shape buttons
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedShape = btn.dataset.shape;
    updateShapeSelection();
  });
});
function updateShapeSelection() {
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.shape === selectedShape);
  });
}

// Close on backdrop click
modalBackdrop?.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// ─── Form Submit ───────────────────────────────────────────────
itemForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title       = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const category    = document.getElementById('f-category').value;
  const tagsRaw     = document.getElementById('f-tags').value;
  const liveUrl     = document.getElementById('f-liveUrl').value.trim();
  const githubUrl   = document.getElementById('f-githubUrl').value.trim();

  if (!title || !description) {
    showToast('Title and description are required.', 'error');
    return;
  }

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const payload = { title, description, category, tags, liveUrl, githubUrl, color: selectedColor, shape: selectedShape };

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    let res, data;
    if (editingId) {
      res  = await fetch(`${API}/api/portfolio/${editingId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
    } else {
      res  = await fetch(`${API}/api/portfolio`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    }
    data = await res.json();

    if (!res.ok) { showToast(data.error || 'Save failed.', 'error'); return; }

    showToast(editingId ? 'Project updated! ✨' : 'Project added! 🚀');
    closeModal();
    await fetchPortfolio();
  } catch (err) {
    showToast('Network error.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Project';
  }
});

// ─── Delete ────────────────────────────────────────────────────
window.deleteItem = async function(id) {
  if (!confirm('Delete this project?')) return;
  try {
    const res = await fetch(`${API}/api/portfolio/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) { showToast('Delete failed.', 'error'); return; }
    showToast('Project deleted.');
    portfolioItems = portfolioItems.filter(i => i.id !== id);
    renderGrid();
    updateStats();
  } catch { showToast('Network error.', 'error'); }
};

// ─── Add Button ────────────────────────────────────────────────
addBtn?.addEventListener('click', () => openModal());

// ─── Logout ────────────────────────────────────────────────────
logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
});

// ─── View Toggle ───────────────────────────────────────────────
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isGrid = btn.dataset.view === 'grid';
    portfolioGrid.classList.toggle('list-view', !isGrid);
  });
});

// ─── Init ──────────────────────────────────────────────────────
populateUser();
fetchPortfolio();
