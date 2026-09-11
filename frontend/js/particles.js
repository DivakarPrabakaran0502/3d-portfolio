/**
 * particles.js — Interactive star field particle system using Three.js
 * Creates a dense galaxy-like background with mouse-reactive drift.
 */

class ParticleSystem {
  constructor(scene, count = 8000) {
    this.scene = scene;
    this.count = count;
    this.mouse = { x: 0, y: 0 };
    this.particles = null;
    this.velocities = [];
    this._init();
  }

  _init() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors    = new Float32Array(this.count * 3);
    const sizes     = new Float32Array(this.count);

    // Color palette
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < this.count; i++) {
      // Spread particles in a large sphere
      const r     = 400 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Assign color from palette with slight variation
      const base = palette[Math.floor(Math.random() * palette.length)].clone();
      base.multiplyScalar(0.7 + Math.random() * 0.3);
      colors[i * 3]     = base.r;
      colors[i * 3 + 1] = base.g;
      colors[i * 3 + 2] = base.b;

      sizes[i] = 0.5 + Math.random() * 2.5;

      // Store drift velocity per particle
      this.velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.001,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setMouse(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  update(time) {
    if (!this.particles) return;

    // Slow global rotation
    this.particles.rotation.y = time * 0.02;
    this.particles.rotation.x = time * 0.005 + this.mouse.y * 0.08;
    this.particles.rotation.z = this.mouse.x * 0.04;

    // Twinkle: modulate sizes
    const sizes = this.particles.geometry.attributes.size.array;
    for (let i = 0; i < this.count; i += 8) {
      sizes[i] = 0.5 + Math.abs(Math.sin(time * 2 + i)) * 2;
    }
    this.particles.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {
    this.particles.geometry.dispose();
    this.particles.material.dispose();
    this.scene.remove(this.particles);
  }
}

window.ParticleSystem = ParticleSystem;
