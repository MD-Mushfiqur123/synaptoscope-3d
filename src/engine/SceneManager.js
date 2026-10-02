import * as THREE from 'three';

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement || document.body;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.animatedMaterials = [];

    this.initRenderer();
    this.initCamera();
    this.initLighting();
    this.initEnvironment();
    this.setupResizeListener();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.5, 5000);
    this.camera.position.set(220, 180, 260);
    this.camera.lookAt(0, 0, 0);
  }

  initLighting() {
    // Cyber ambient deep blue
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambientLight);

    // Primary Cyber Sun / Directional light with soft shadows
    this.sunLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    this.sunLight.position.set(250, 450, 150);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1200;
    this.sunLight.shadow.camera.left = -500;
    this.sunLight.shadow.camera.right = 500;
    this.sunLight.shadow.camera.top = 500;
    this.sunLight.shadow.camera.bottom = -500;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Secondary Neon Accent Lights (Purple & Cyan rim lights)
    const accentLight1 = new THREE.PointLight(0xa855f7, 3.5, 800, 1.5);
    accentLight1.position.set(-200, 120, -200);
    this.scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0x06b6d4, 3.0, 800, 1.5);
    accentLight2.position.set(200, 120, -200);
    this.scene.add(accentLight2);

    // Hemisphere light for ground-sky gradient realism
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x030712, 1.0);
    this.scene.add(hemiLight);
  }

  initEnvironment() {
    // Fog for infinite cyber depth
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x030712, 0.0016);

    // Cyberpunk Infinite Grid Ground
    const gridHelper = new THREE.GridHelper(1600, 80, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);

    // Holographic ground plane with subtle glow
    const groundGeo = new THREE.PlaneGeometry(2400, 2400);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.8,
      metalness: 0.5,
      side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -1;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Starfield / Cyber Dust Particle System
    this.initCyberDust();
  }

  initCyberDust() {
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color(0x38bdf8);
    const purple = new THREE.Color(0xc084fc);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1200;
      positions[i + 1] = Math.random() * 500;
      positions[i + 2] = (Math.random() - 0.5) * 1200;

      const col = Math.random() > 0.5 ? cyan : purple;
      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  registerAnimatedMaterial(mat) {
    if (mat && mat.isCustomShader && !this.animatedMaterials.includes(mat)) {
      this.animatedMaterials.push(mat);
    }
  }

  unregisterAnimatedMaterial(mat) {
    const idx = this.animatedMaterials.indexOf(mat);
    if (idx !== -1) {
      this.animatedMaterials.splice(idx, 1);
    }
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  render(updateCallback) {
    const loop = () => {
      requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // Rotate cyber dust gently
      if (this.particles) {
        this.particles.rotation.y = elapsedTime * 0.02;
      }

      // Update animated custom shaders
      for (const mat of this.animatedMaterials) {
        if (mat.uniforms && mat.uniforms.uTime) {
          mat.uniforms.uTime.value = elapsedTime;
        }
      }

      if (updateCallback) {
        updateCallback(delta, elapsedTime);
      }

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}
