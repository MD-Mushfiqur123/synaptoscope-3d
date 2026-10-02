import * as THREE from 'three';

export class RaycasterSelector {
  constructor(sceneManager, cityGenerator, onSelectCallback) {
    this.sceneManager = sceneManager;
    this.cityGenerator = cityGenerator;
    this.onSelectCallback = onSelectCallback;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.hoveredMesh = null;
    this.selectedMesh = null;

    this.highlightBox = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
    this.highlightBox.visible = false;
    this.sceneManager.scene.add(this.highlightBox);

    this.initListeners();
  }

  initListeners() {
    const dom = this.sceneManager.renderer.domElement;

    dom.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkHover();
    });

    dom.addEventListener('click', () => {
      this.checkSelect();
    });
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const intersects = this.raycaster.intersectObjects(this.cityGenerator.buildingMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      if (this.hoveredMesh !== mesh) {
        this.hoveredMesh = mesh;
        this.highlightBox.setFromObject(mesh);
        this.highlightBox.material.color.setHex(0x38bdf8);
        this.highlightBox.visible = true;
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredMesh) {
        this.hoveredMesh = null;
        if (!this.selectedMesh) {
          this.highlightBox.visible = false;
        } else {
          this.highlightBox.setFromObject(this.selectedMesh);
          this.highlightBox.material.color.setHex(0xa855f7);
        }
        document.body.style.cursor = 'default';
      }
    }
  }

  checkSelect() {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const intersects = this.raycaster.intersectObjects(this.cityGenerator.buildingMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      this.selectedMesh = mesh;
      this.highlightBox.setFromObject(mesh);
      this.highlightBox.material.color.setHex(0xa855f7);
      this.highlightBox.visible = true;

      if (this.onSelectCallback && mesh.userData) {
        this.onSelectCallback(mesh.userData);
      }
    }
  }

  selectByPath(path) {
    const found = this.cityGenerator.buildingMeshes.find(m => m.userData && m.userData.path === path);
    if (found) {
      this.selectedMesh = found;
      this.highlightBox.setFromObject(found);
      this.highlightBox.material.color.setHex(0xa855f7);
      this.highlightBox.visible = true;
      if (this.onSelectCallback) {
        this.onSelectCallback(found.userData);
      }
    }
  }
}
