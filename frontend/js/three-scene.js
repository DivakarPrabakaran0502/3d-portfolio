/**
 * three-scene.js — Epic hero Three.js animated scene
 * Features: star field, rotating torus knot, orbiting rings,
 * floating geometric shapes, mouse parallax camera, dynamic lighting.
 */

(function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ─── Renderer ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ─── Scene & Camera ────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 8);

  // ─── Mouse Tracking ────────────────────────────────────────
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', e => {
    mouse.targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Lights ────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x1a1a3e, 1.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x6366f1, 4, 30);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x06b6d4, 3, 25);
  pointLight2.position.set(-5, -3, 3);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xec4899, 2, 20);
  pointLight3.position.set(0, 5, -5);
  scene.add(pointLight3);

  // ─── Star Field Particles ──────────────────────────────────
  const particleSystem = new ParticleSystem(scene, 6000);

  // ─── Central Torus Knot ────────────────────────────────────
  const torusGeo = new THREE.TorusKnotGeometry(1.6, 0.45, 180, 24, 2, 3);
  const torusMat = new THREE.MeshPhongMaterial({
    color: 0x6366f1,
    emissive: 0x1a1a5e,
    emissiveIntensity: 0.3,
    shininess: 80,
    wireframe: false,
    transparent: true,
    opacity: 0.9,
  });
  const torusKnot = new THREE.Mesh(torusGeo, torusMat);
  scene.add(torusKnot);

  // Wireframe overlay for the torus knot
  const wireGeo = new THREE.TorusKnotGeometry(1.62, 0.46, 180, 24, 2, 3);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const wireKnot = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireKnot);

  // ─── Orbiting Rings ────────────────────────────────────────
  const rings = [];
  const ringConfigs = [
    { r: 2.8, tube: 0.025, color: 0x6366f1, rotX: Math.PI / 3, rotY: 0, speed: 0.4 },
    { r: 3.4, tube: 0.020, color: 0x06b6d4, rotX: Math.PI / 5, rotY: Math.PI / 4, speed: -0.3 },
    { r: 4.0, tube: 0.015, color: 0x8b5cf6, rotX: Math.PI / 2, rotY: Math.PI / 3, speed: 0.2 },
  ];
  ringConfigs.forEach(cfg => {
    const geo = new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 128);
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = cfg.rotX;
    ring.rotation.y = cfg.rotY;
    ring.userData.speed = cfg.speed;
    scene.add(ring);
    rings.push(ring);
  });

  // ─── Floating Satellites ───────────────────────────────────
  const satellites = [];
  const satGeos = [
    new THREE.IcosahedronGeometry(0.22, 0),
    new THREE.OctahedronGeometry(0.25, 0),
    new THREE.TetrahedronGeometry(0.28, 0),
    new THREE.BoxGeometry(0.32, 0.32, 0.32),
    new THREE.DodecahedronGeometry(0.2, 0),
  ];
  const satColors = [0x6366f1, 0x8b5cf6, 0x06b6d4, 0xec4899, 0x10b981];

  for (let i = 0; i < 12; i++) {
    const geo = satGeos[i % satGeos.length];
    const mat = new THREE.MeshPhongMaterial({
      color: satColors[i % satColors.length],
      emissive: satColors[i % satColors.length],
      emissiveIntensity: 0.2,
      wireframe: i % 3 === 0,
      transparent: true,
      opacity: 0.7 + Math.random() * 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Distribute around a sphere
    const phi   = Math.acos(-1 + (2 * i) / 12);
    const theta = Math.sqrt(12 * Math.PI) * phi;
    const r = 5 + Math.random() * 2;

    mesh.position.set(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    );
    mesh.userData = {
      orbitRadius: r,
      orbitTheta: theta,
      orbitPhi:   phi,
      rotX: (Math.random() - 0.5) * 0.04,
      rotY: (Math.random() - 0.5) * 0.04,
      orbitSpeed: (0.1 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1),
    };
    scene.add(mesh);
    satellites.push(mesh);
  }

  // ─── Galaxy Core Glow (additive sprite) ───────────────────
  function makeGlowSprite(color, size) {
    const canvas2 = document.createElement('canvas');
    canvas2.width = canvas2.height = 128;
    const ctx = canvas2.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0,   color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
    gradient.addColorStop(0.4, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    gradient.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture  = new THREE.CanvasTexture(canvas2);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, transparent: true });
    const sprite   = new THREE.Sprite(spriteMat);
    sprite.scale.set(size, size, 1);
    return sprite;
  }
  const glow1 = makeGlowSprite('rgb(99, 102, 241)', 8);
  const glow2 = makeGlowSprite('rgb(6, 182, 212)', 5);
  glow2.position.set(2, 1, -1);
  scene.add(glow1, glow2);

  // ─── Animation Loop ────────────────────────────────────────
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Camera drift
    camera.position.x = mouse.x * 0.6;
    camera.position.y = -mouse.y * 0.4;
    camera.lookAt(0, 0, 0);

    // Torus knot rotation
    torusKnot.rotation.x = t * 0.18;
    torusKnot.rotation.y = t * 0.22;
    wireKnot.rotation.x  = t * 0.18;
    wireKnot.rotation.y  = t * 0.22;

    // Pulse torus emissive
    torusMat.emissiveIntensity = 0.2 + Math.abs(Math.sin(t * 0.8)) * 0.4;

    // Orbiting rings
    rings.forEach(ring => {
      ring.rotation.z += ring.userData.speed * 0.008;
      ring.rotation.y += ring.userData.speed * 0.004;
    });

    // Satellite orbits
    satellites.forEach((sat, i) => {
      sat.userData.orbitTheta += sat.userData.orbitSpeed * 0.008;
      const r   = sat.userData.orbitRadius;
      const phi = sat.userData.orbitPhi;
      const theta = sat.userData.orbitTheta;
      sat.position.x = r * Math.cos(theta) * Math.sin(phi);
      sat.position.y = r * Math.sin(theta) * Math.sin(phi);
      sat.position.z = r * Math.cos(phi);
      sat.rotation.x += sat.userData.rotX;
      sat.rotation.y += sat.userData.rotY;
    });

    // Lights animate
    pointLight1.position.x = Math.sin(t * 0.7) * 6;
    pointLight1.position.y = Math.cos(t * 0.5) * 4;
    pointLight2.position.x = Math.cos(t * 0.6) * -5;
    pointLight3.position.y = Math.sin(t * 0.4) * 6;

    // Particles
    particleSystem.setMouse(mouse.x, mouse.y);
    particleSystem.update(t);

    renderer.render(scene, camera);
  }
  animate();

  // ─── Resize Handler ────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ─── Scroll parallax ──────────────────────────────────────
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    torusKnot.scale.setScalar(Math.max(0.5, 1 - scrollY * 0.001));
    torusKnot.position.z = -scrollY * 0.005;
  });

})();
