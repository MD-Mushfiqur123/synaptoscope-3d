import * as THREE from 'three';
import { HeatmapShaders } from './HeatmapShaders.js';

export class CityGenerator {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.cityGroup = new THREE.Group();
    this.buildingMeshes = [];
    this.districtMeshes = [];
    this.currentMode = 'lang'; // 'lang' | 'complexity' | 'recency'
    this.sceneManager.scene.add(this.cityGroup);
  }

  /**
   * Squarified Treemap Layout Engine for Hierarchical Codebase Tree
   */
  generateCity(treeData, totalWidth = 320, totalDepth = 320) {
    this.clear();
    const bounds = { x: -totalWidth / 2, z: -totalDepth / 2, w: totalWidth, d: totalDepth };
    this.layoutNode(treeData, bounds, 0, '');
    return this.cityGroup;
  }

  clear() {
    while (this.cityGroup.children.length > 0) {
      const obj = this.cityGroup.children[0];
      this.cityGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    this.buildingMeshes = [];
    this.districtMeshes = [];
  }

  /**
   * Compute aggregate weights (lines of code / size) recursively
   */
  computeNodeWeight(node) {
    if (node.type === 'file') {
      node.weight = Math.max(node.loc || (node.size ? Math.ceil(node.size / 30) : 25), 10);
      return node.weight;
    }
    let sum = 0;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        sum += this.computeNodeWeight(child);
      }
    }
    node.weight = Math.max(sum, 15);
    return node.weight;
  }

  /**
   * Recursive squarified layout partitioner
   */
  layoutNode(node, bounds, depth, pathPrefix) {
    const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
    const padding = Math.max(1.5, 4 - depth * 0.8);

    if (node.type === 'directory' || (node.children && node.children.length > 0)) {
      // Create District Foundation Platform
      const districtMat = new THREE.MeshStandardMaterial({
        color: depth === 0 ? 0x0f172a : (depth % 2 === 0 ? 0x1e293b : 0x0f172a),
        roughness: 0.6,
        metalness: 0.7,
        wireframe: false
      });

      const distHeight = 2 + depth * 1.5;
      const distGeo = new THREE.BoxGeometry(
        Math.max(1, bounds.w - padding),
        distHeight,
        Math.max(1, bounds.d - padding)
      );

      const districtMesh = new THREE.Mesh(distGeo, districtMat);
      districtMesh.position.set(
        bounds.x + bounds.w / 2,
        distHeight / 2,
        bounds.z + bounds.d / 2
      );
      districtMesh.receiveShadow = true;
      districtMesh.userData = {
        type: 'district',
        name: node.name,
        path: currentPath,
        depth: depth
      };

      // Add cyber border wireframe outline for district
      const edges = new THREE.EdgesGeometry(distGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: depth === 0 ? 0x38bdf8 : 0x818cf8,
        transparent: true,
        opacity: 0.4
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      districtMesh.add(wireframe);

      this.cityGroup.add(districtMesh);
      this.districtMeshes.push(districtMesh);

      // Slice bounds for children using squarified layout
      const innerBounds = {
        x: bounds.x + padding,
        z: bounds.z + padding,
        w: Math.max(1, bounds.w - padding * 2),
        d: Math.max(1, bounds.d - padding * 2)
      };

      const children = [...(node.children || [])];
      this.computeNodeWeight(node);
      children.sort((a, b) => (b.weight || 1) - (a.weight || 1));

      this.squarifyChildren(children, innerBounds, depth + 1, currentPath);
    } else {
      // Leaf Node -> Procedural 3D Skyscraper
      this.createBuilding(node, bounds, depth, currentPath);
    }
  }

  /**
   * Squarified Treemap partition algorithm
   */
  squarifyChildren(children, bounds, depth, parentPath) {
    if (children.length === 0) return;

    const totalWeight = children.reduce((acc, c) => acc + (c.weight || 1), 0);
    const isHorizontal = bounds.w >= bounds.d;

    let currentOffset = isHorizontal ? bounds.x : bounds.z;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const ratio = (child.weight || 1) / totalWeight;

      let childBounds;
      if (isHorizontal) {
        const sliceWidth = bounds.w * ratio;
        childBounds = {
          x: currentOffset,
          z: bounds.z,
          w: Math.max(sliceWidth - 1, 2),
          d: bounds.d
        };
        currentOffset += sliceWidth;
      } else {
        const sliceDepth = bounds.d * ratio;
        childBounds = {
          x: bounds.x,
          z: currentOffset,
          w: bounds.w,
          d: Math.max(sliceDepth - 1, 2)
        };
        currentOffset += sliceDepth;
      }

      this.layoutNode(child, childBounds, depth, parentPath);
    }
  }

  /**
   * Create a 3D Procedural Cyber Skyscraper
   */
  createBuilding(fileNode, bounds, depth, fullPath) {
    const loc = fileNode.loc || 50;
    const height = Math.min(180, Math.max(6, Math.sqrt(loc) * 5.5));
    const width = Math.max(2.5, bounds.w * 0.85);
    const depthSize = Math.max(2.5, bounds.d * 0.85);

    const geometry = new THREE.BoxGeometry(width, height, depthSize);
    
    // Setup initial materials according to active mode
    const ext = fileNode.name.split('.').pop();
    const langMat = HeatmapShaders.createLanguageMaterial(ext);
    const complexityMat = HeatmapShaders.createComplexityMaterial(loc, fileNode.complexity || 1);
    const recencyMat = HeatmapShaders.createRecencyPulseShaderMaterial(fileNode.recencyHours || 4);

    this.sceneManager.registerAnimatedMaterial(recencyMat);

    const activeMat = this.currentMode === 'lang' 
      ? langMat 
      : (this.currentMode === 'complexity' ? complexityMat : recencyMat);

    const mesh = new THREE.Mesh(geometry, activeMat);
    mesh.position.set(
      bounds.x + bounds.w / 2,
      height / 2 + depth * 1.5,
      bounds.z + bounds.d / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Attach metadata for Raycaster & Inspector
    mesh.userData = {
      type: 'building',
      name: fileNode.name,
      path: fullPath,
      loc: loc,
      size: fileNode.size || loc * 35,
      extension: ext,
      complexity: fileNode.complexity || (loc > 300 ? 'High' : (loc > 100 ? 'Medium' : 'Low')),
      recencyHours: fileNode.recencyHours || 2,
      materials: {
        lang: langMat,
        complexity: complexityMat,
        recency: recencyMat
      }
    };

    // Roof Beacon / Helipad Indicator for large files
    if (loc > 250) {
      const beaconGeo = new THREE.CylinderGeometry(width * 0.25, width * 0.25, 0.8, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = height / 2 + 0.4;
      mesh.add(beacon);
    }

    // Edge wireframe glow for crisp cyber silhouettes
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    mesh.add(wireframe);

    this.cityGroup.add(mesh);
    this.buildingMeshes.push(mesh);
  }

  /**
   * Switch between Language, Complexity, and Recency visual modes dynamically
   */
  setShadingMode(mode) {
    if (!['lang', 'complexity', 'recency'].includes(mode)) return;
    this.currentMode = mode;

    for (const mesh of this.buildingMeshes) {
      if (mesh.userData && mesh.userData.materials) {
        mesh.material = mesh.userData.materials[mode];
      }
    }
  }
}
