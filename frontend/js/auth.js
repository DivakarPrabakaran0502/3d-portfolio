/**
 * auth.js — Login / Register page logic
 * Handles tab switching, form validation, API calls, JWT storage.
 */

const API = '';  // same-origin via Express static serving

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

function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<span class="loader-ring" style="width:20px;height:20px;border-width:2px;"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
    btn.disabled = false;
  }
}

function setFieldError(inputId, msg) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(inputId + '-error');
  if (!input) return;
  if (msg) {
    input.style.borderColor = '#ef4444';
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  } else {
    input.style.borderColor = '';
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  }
}

function clearErrors() {
  ['reg-name','reg-email','reg-password','login-email','login-password'].forEach(id => setFieldError(id, ''));
}

// ─── Tab Switching ─────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === target));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === target + '-panel'));
    clearErrors();
  });
});

// ─── Register ─────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  let valid = true;

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name)     { setFieldError('reg-name',     'Full name is required.'); valid = false; }
  if (!email)    { setFieldError('reg-email',    'Email is required.'); valid = false; }
  if (!password) { setFieldError('reg-password', 'Password is required.'); valid = false; }
  else if (password.length < 6) { setFieldError('reg-password', 'Minimum 6 characters.'); valid = false; }

  if (!valid) return;

  const btn = document.getElementById('register-btn');
  setLoading(btn, true);

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.error?.toLowerCase().includes('email')) setFieldError('reg-email', data.error);
      else showToast(data.error || 'Registration failed.', 'error');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast(`Welcome, ${data.user.name}! 🚀`);
    setTimeout(() => window.location.href = '/dashboard.html', 800);
  } catch (err) {
    showToast('Network error. Is the server running?', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Login ─────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  let valid = true;

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email)    { setFieldError('login-email',    'Email is required.'); valid = false; }
  if (!password) { setFieldError('login-password', 'Password is required.'); valid = false; }

  if (!valid) return;

  const btn = document.getElementById('login-btn');
  setLoading(btn, true);

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFieldError('login-email',    ' ');
      setFieldError('login-password', data.error || 'Invalid credentials.');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast(`Welcome back, ${data.user.name}! ✨`);
    setTimeout(() => window.location.href = '/dashboard.html', 800);
  } catch (err) {
    showToast('Network error. Is the server running?', 'error');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Password Visibility Toggle ────────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
  });
});

// ─── Redirect if already logged in ────────────────────────────
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

// ─── Login Page Three.js Background ───────────────────────────
(function initLoginBg() {
  const canvas = document.getElementById('login-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  // Floating triangles
  const meshes = [];
  const colors = [0x6366f1, 0x8b5cf6, 0x06b6d4, 0xec4899];

  for (let i = 0; i < 20; i++) {
    const geo = Math.random() > 0.5
      ? new THREE.OctahedronGeometry(0.15 + Math.random() * 0.3, 0)
      : new THREE.TetrahedronGeometry(0.15 + Math.random() * 0.35, 0);

    const mat = new THREE.MeshPhongMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      wireframe: Math.random() > 0.4,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.4,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5 - 2
    );
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.02,
      rotY: (Math.random() - 0.5) * 0.02,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.3 + Math.random() * 0.5,
    };
    scene.add(mesh);
    meshes.push(mesh);
  }

  const ambientLight = new THREE.AmbientLight(0x6366f1, 0.5);
  const pointLight   = new THREE.PointLight(0x8b5cf6, 2, 30);
  pointLight.position.set(3, 3, 3);
  scene.add(ambientLight, pointLight);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    meshes.forEach(m => {
      m.rotation.x += m.userData.rotX;
      m.rotation.y += m.userData.rotY;
      m.position.y += Math.sin(t * m.userData.floatSpeed + m.userData.floatOffset) * 0.003;
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
})();
