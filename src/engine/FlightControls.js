import * as THREE from 'three';

export class FlightControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.boost = false;

    // Dynamics & Physics parameters
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.baseSpeed = 120.0;
    this.boostMultiplier = 3.2;
    this.damping = 0.88;

    // Mouse / Drone orientation
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.mouseSensitivity = 0.0022;

    // Boundary constraints
    this.minAltitude = 4.0;
    this.maxAltitude = 650.0;
    this.maxRadius = 800.0;

    this.initEventListeners();
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Support wheel zoom/pitch adjustments
    this.domElement.addEventListener('wheel', (e) => {
      const zoomSpeed = 8.0;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.camera.position.addScaledVector(forward, -Math.sign(e.deltaY) * zoomSpeed);
    }, { passive: true });
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'KeyE':
        this.moveUp = true;
        break;
      case 'KeyQ':
        this.moveDown = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.boost = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'KeyE':
        this.moveUp = false;
        break;
      case 'KeyQ':
        this.moveDown = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.boost = false;
        break;
    }
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.previousMousePosition = { x: event.clientX, y: event.clientY };

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= deltaX * this.mouseSensitivity;
    this.euler.x -= deltaY * this.mouseSensitivity;

    // Clamp pitch to prevent gimbal flip
    this.euler.x = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  update(delta) {
    const actualDelta = Math.min(delta, 0.1);
    const speed = (this.boost ? this.baseSpeed * this.boostMultiplier : this.baseSpeed) * actualDelta;

    this.direction.set(0, 0, 0);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    
    // Horizontal strafe vectors
    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();

    if (this.moveForward) this.direction.add(forward);
    if (this.moveBackward) this.direction.sub(forward);
    if (this.moveRight) this.direction.add(right);
    if (this.moveLeft) this.direction.sub(right);

    // Altitude vertical movement
    if (this.moveUp) this.direction.y += 1.0;
    if (this.moveDown) this.direction.y -= 1.0;

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
      this.velocity.addScaledVector(this.direction, speed);
    }

    // Apply inertia damping
    this.camera.position.add(this.velocity);
    this.velocity.multiplyScalar(this.damping);

    // Boundary & Terrain collision bounds
    if (this.camera.position.y < this.minAltitude) {
      this.camera.position.y = this.minAltitude;
      this.velocity.y = 0;
    }
    if (this.camera.position.y > this.maxAltitude) {
      this.camera.position.y = this.maxAltitude;
      this.velocity.y = 0;
    }

    const horizontalDist = Math.sqrt(
      this.camera.position.x * this.camera.position.x +
      this.camera.position.z * this.camera.position.z
    );

    if (horizontalDist > this.maxRadius) {
      const factor = this.maxRadius / horizontalDist;
      this.camera.position.x *= factor;
      this.camera.position.z *= factor;
    }
  }
}
