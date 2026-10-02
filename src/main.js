/**
 * SynaptoScope 3D - Next-Gen 3D Codebase Visualizer & Intelligence Engine
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Core Controller: Orchestrates WebGL 3D Engine, HUD, Inspector, AST Parser, and GitHub Importer.
 */

import * as THREE from 'three';
import './styles.css';

import { SceneManager, CityGenerator, FlightControls, RaycasterSelector } from './engine/index.js';
import { HUDOverlay } from './ui/HUDOverlay.js';
import { InspectorPanel } from './ui/InspectorPanel.js';
import { FolderDropzone } from './ui/FolderDropzone.js';
import { GithubFetcher } from './services/GithubFetcher.js';
import { ASTParser } from './services/ASTParser.js';
import { SAMPLE_CODEBASES } from './services/SampleCodebases.js';

class SynaptoScopeApp {
  constructor() {
    this.currentCodebase = null;
    this.laserLinksGroup = new THREE.Group();
    this.laserMeshes = [];
    this.audioContext = null;
    this.audioEnabled = true;
    this.autoRotate = true;
    this.currentViewMode = 'city';
    this.rotationAngle = 0;

    this.init();
  }

  async init() {
    console.log("⚡ [SynaptoScope 3D] Booting Cyber Engine by Md Mushfiqur Rahim (@MD-Mushfiqur123)...");

    // 1. Initialize 3D WebGL Canvas
    const canvasContainer = document.getElementById('canvas-container') || document.body;
    this.sceneManager = new SceneManager(canvasContainer);
    this.cityGenerator = new CityGenerator(this.sceneManager);
    this.flightControls = new FlightControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
    
    // Add laser bridge group to scene
    this.sceneManager.scene.add(this.laserLinksGroup);

    // 2. Initialize Services
    this.githubFetcher = new GithubFetcher();

    // 3. Initialize UI Mount Point
    const appContainer = document.getElementById('app') || document.body;

    // 4. Initialize Inspector Panel
    this.inspector = new InspectorPanel(
      appContainer,
      (node) => this.focusNodeIn3D(node),
      (node) => this.selectNode(node)
    );

    // 5. Initialize Folder Dropzone
    this.dropzone = new FolderDropzone(
      appContainer,
      (codebase) => this.loadCodebase(codebase),
      (error) => this.hud?.showToast(error, 'error')
    );

    // 6. Initialize HUD Overlay
    this.hud = new HUDOverlay(appContainer, {
      onLoadRepo: (repo) => this.fetchAndLoadRepo(repo),
      onLoadSample: (sampleKey) => this.loadSample(sampleKey),
      onOpenLocalFolder: () => this.dropzone.show(),
      onChangeViewMode: (mode) => this.setViewMode(mode),
      onFilterChange: (query) => this.filterNodes(query),
      onToggleAutoRotate: (enabled) => { this.autoRotate = enabled; },
      onToggleBloom: (enabled) => this.toggleBloom(enabled),
      onToggleAudio: (enabled) => { this.audioEnabled = enabled; },
      onSaveToken: (token) => this.githubFetcher.setToken(token),
      onResetCamera: () => this.resetCamera()
    });

    // 7. Initialize Raycaster Interaction
    this.raycaster = new RaycasterSelector(this.sceneManager, this.cityGenerator, (fileData) => {
      if (!fileData) return;
      this.playSfx('select');
      const fullNode = this.currentCodebase?.files?.find(f => (f.normalizedPath || f.path) === fileData.path) || fileData;
      this.inspector.inspect(fullNode, this.currentCodebase?.links || [], this.currentCodebase?.files || []);
      this.highlightLaserBridges(fileData.path);
    });

    // 8. Tooltip Hover Setup
    this.setupHoverTooltip();

    // 9. Load Default Preset: MD-Mushfiqur123/orion-space
    await this.loadSample('MD-Mushfiqur123/orion-space');

    // 10. Start Animation & Render Loop
    this.sceneManager.render((delta, time) => {
      this.flightControls.update(delta);
      this.hud.updateFPS(performance.now());
      this.animateScene(delta, time);
    });
  }

  /**
   * Continuous scene animation (auto-rotation, laser pulsing)
   */
  animateScene(delta, time) {
    if (this.autoRotate && !this.flightControls.isDragging) {
      this.cityGenerator.cityGroup.rotation.y += delta * 0.06;
      this.laserLinksGroup.rotation.y = this.cityGenerator.cityGroup.rotation.y;
    }

    // Animate glowing laser links
    if (this.laserMeshes.length > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      this.laserMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.opacity !== undefined) {
          mesh.material.opacity = 0.35 + pulse * 0.45;
        }
      });
    }
  }

  /**
   * Convert flat codebase file array to hierarchical tree for CityGenerator
   */
  buildTreeFromFiles(files, rootName = 'root') {
    const root = { name: rootName, type: 'directory', children: [] };

    files.forEach(file => {
      const parts = (file.path || '').replace(/\\/g, '/').split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = (i === parts.length - 1);

        if (isLeaf) {
          current.children.push({
            name: part,
            type: 'file',
            path: file.path,
            size: file.size || 1000,
            loc: file.loc || 50,
            complexity: file.complexity || (file.loc > 250 ? 'High' : (file.loc > 80 ? 'Medium' : 'Low')),
            recencyHours: Math.random() * 48 + 1,
            language: file.language,
            content: file.content
          });
        } else {
          let dir = current.children.find(c => c.name === part && c.type === 'directory');
          if (!dir) {
            dir = { name: part, type: 'directory', children: [] };
            current.children.push(dir);
          }
          current = dir;
        }
      }
    });

    return root;
  }

  /**
   * Load codebase dataset and generate 3D architecture
   */
  async loadCodebase(codebase) {
    this.currentCodebase = codebase;
    this.playSfx('load');

    const tree = this.buildTreeFromFiles(codebase.files, codebase.name);
    
    // Generate Procedural City
    const citySize = Math.min(600, Math.max(280, Math.sqrt(codebase.files.length) * 45));
    this.cityGenerator.generateCity(tree, citySize, citySize);

    // Build 3D Laser Dependency Bridges
    this.buildLaserBridges(codebase.links || []);

    // Update Telemetry on HUD
    const totalLoc = codebase.files.reduce((sum, f) => sum + (f.loc || 0), 0);
    this.hud.updateTelemetry({
      filesCount: codebase.files.length,
      loc: totalLoc,
      linksCount: (codebase.links || []).length
    });

    this.hud.showToast(`Visualized ${codebase.files.length} nodes for "${codebase.name}"`, 'success');
    this.resetCamera();
  }

  /**
   * Load Pre-bundled Sample Codebase
   */
  async loadSample(sampleKey) {
    const sample = SAMPLE_CODEBASES[sampleKey];
    if (sample) {
      this.hud.showToast(`Loading preset: ${sample.label}...`, 'loading');
      const astGraph = ASTParser.parseDependencies(sample.files);
      const codebase = {
        ...sample,
        files: astGraph.nodes,
        links: astGraph.links,
        stats: astGraph.stats
      };
      await this.loadCodebase(codebase);
    } else {
      await this.fetchAndLoadRepo(sampleKey);
    }
  }

  /**
   * Fetch from GitHub API and visualize
   */
  async fetchAndLoadRepo(repoString) {
    try {
      this.hud.showToast(`Querying GitHub API for ${repoString}...`, 'loading');
      
      // Check if matches local sample first for instant speed
      if (SAMPLE_CODEBASES[repoString]) {
        return await this.loadSample(repoString);
      }

      const codebase = await this.githubFetcher.fetchRepository(repoString, ({ status }) => {
        this.hud.showToast(status, 'loading');
      });

      await this.loadCodebase(codebase);
    } catch (err) {
      console.error(err);
      this.hud.showToast(`Failed: ${err.message}`, 'error');
      // Fallback to sample if offline/rate-limited
      if (SAMPLE_CODEBASES['MD-Mushfiqur123/orion-space']) {
        setTimeout(() => this.loadSample('MD-Mushfiqur123/orion-space'), 2000);
      }
    }
  }

  /**
   * Construct 3D Curved Glowing Laser Bridges between dependent files
   */
  buildLaserBridges(links) {
    // Clear existing lasers
    while (this.laserLinksGroup.children.length > 0) {
      const obj = this.laserLinksGroup.children[0];
      this.laserLinksGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    this.laserMeshes = [];

    const meshMap = new Map();
    this.cityGenerator.buildingMeshes.forEach(m => {
      if (m.userData && m.userData.path) {
        meshMap.set(m.userData.path, m);
        meshMap.set(m.userData.path.toLowerCase(), m);
      }
    });

    const maxLinksToRender = Math.min(links.length, 120);

    for (let i = 0; i < maxLinksToRender; i++) {
      const link = links[i];
      const sourceMesh = meshMap.get(link.source) || meshMap.get(link.source.toLowerCase());
      const targetMesh = meshMap.get(link.target) || meshMap.get(link.target.toLowerCase());

      if (sourceMesh && targetMesh && sourceMesh !== targetMesh) {
        const p1 = sourceMesh.position.clone();
        const p2 = targetMesh.position.clone();

        // Control point above both buildings
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const dist = p1.distanceTo(p2);
        const arcHeight = Math.max(p1.y, p2.y) + Math.min(dist * 0.35, 90) + 10;
        const mid = new THREE.Vector3(midX, arcHeight, midZ);

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        const points = curve.getPoints(24);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const color = (i % 2 === 0) ? 0x00f0ff : 0xff007f;
        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.6,
          linewidth: 2,
          blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(geometry, material);
        line.userData = {
          sourcePath: link.source,
          targetPath: link.target,
          type: 'laserBridge'
        };

        this.laserLinksGroup.add(line);
        this.laserMeshes.push(line);
      }
    }
  }

  /**
   * Highlight lasers connected to a specific file
   */
  highlightLaserBridges(filePath) {
    if (!filePath) return;
    const norm = filePath.toLowerCase();
    this.laserMeshes.forEach(line => {
      const s = (line.userData.sourcePath || '').toLowerCase();
      const t = (line.userData.targetPath || '').toLowerCase();
      const isConnected = s.includes(norm) || t.includes(norm);

      if (isConnected) {
        line.material.opacity = 1.0;
        line.material.color.setHex(0x00ff88);
      } else {
        line.material.opacity = 0.12;
        line.material.color.setHex(0x00f0ff);
      }
    });
  }

  /**
   * Switch View Mode (City, Nebula, Heatmap, Graph)
   */
  setViewMode(mode) {
    this.currentViewMode = mode;
    this.playSfx('mode');

    if (mode === 'city') {
      this.cityGenerator.setShadingMode('lang');
      this.laserLinksGroup.visible = true;
      this.animateMeshesToCity();
    } else if (mode === 'heatmap') {
      this.cityGenerator.setShadingMode('complexity');
      this.laserLinksGroup.visible = true;
    } else if (mode === 'nebula') {
      this.cityGenerator.setShadingMode('recency');
      this.animateMeshesToNebula();
    } else if (mode === 'graph') {
      this.cityGenerator.setShadingMode('lang');
      this.laserLinksGroup.visible = true;
      this.highlightAllLasers();
    }
  }

  animateMeshesToCity() {
    this.cityGenerator.buildingMeshes.forEach(mesh => {
      if (mesh.userData && mesh.userData.originalPos) {
        mesh.position.copy(mesh.userData.originalPos);
      }
    });
  }

  animateMeshesToNebula() {
    // Arrange buildings into a floating spiral galaxy
    this.cityGenerator.buildingMeshes.forEach((mesh, idx) => {
      if (!mesh.userData.originalPos) {
        mesh.userData.originalPos = mesh.position.clone();
      }
      const angle = idx * 0.35;
      const radius = 25 + Math.sqrt(idx) * 22;
      const height = Math.sin(idx * 0.5) * 40 + 50;
      mesh.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    });
  }

  highlightAllLasers() {
    this.laserMeshes.forEach(line => {
      line.material.opacity = 0.9;
    });
  }

  /**
   * Filter buildings by search text in real-time
   */
  filterNodes(query) {
    const clean = query.trim().toLowerCase();
    this.cityGenerator.buildingMeshes.forEach(mesh => {
      if (!clean) {
        mesh.visible = true;
        mesh.material.opacity = 1.0;
        mesh.material.transparent = false;
      } else {
        const path = (mesh.userData.path || '').toLowerCase();
        const matches = path.includes(clean);
        mesh.visible = matches;
      }
    });
  }

  /**
   * Smoothly pan camera to focus a node
   */
  focusNodeIn3D(node) {
    const norm = (node.normalizedPath || node.path || '').toLowerCase();
    const mesh = this.cityGenerator.buildingMeshes.find(m => (m.userData.path || '').toLowerCase() === norm);
    if (mesh) {
      this.raycaster.selectedMesh = mesh;
      this.raycaster.highlightBox.setFromObject(mesh);
      this.raycaster.highlightBox.visible = true;

      // Animate Camera to building position
      const targetPos = mesh.position.clone().add(new THREE.Vector3(45, 35, 45));
      this.sceneManager.camera.position.set(targetPos.x, targetPos.y, targetPos.z);
      this.sceneManager.camera.lookAt(mesh.position);
    }
  }

  selectNode(node) {
    this.focusNodeIn3D(node);
  }

  resetCamera() {
    this.sceneManager.camera.position.set(220, 180, 260);
    this.sceneManager.camera.lookAt(0, 0, 0);
  }

  toggleBloom(enabled) {
    this.sceneManager.renderer.toneMappingExposure = enabled ? 1.35 : 0.9;
    this.laserLinksGroup.visible = enabled;
  }

  setupHoverTooltip() {
    const tooltip = document.getElementById('hover-tooltip');
    if (!tooltip) return;

    const dom = this.sceneManager.renderer.domElement;
    dom.addEventListener('mousemove', (e) => {
      if (this.raycaster && this.raycaster.hoveredMesh && this.raycaster.hoveredMesh.userData) {
        const data = this.raycaster.hoveredMesh.userData;
        tooltip.innerHTML = `
          <div class="font-bold text-[#00f0ff]">${data.name}</div>
          <div class="text-[10px] text-gray-300 font-sans">${data.path}</div>
          <div class="flex items-center space-x-2 mt-1 text-[9px]">
            <span class="text-[#00ff88]">LOC: ${data.loc}</span>
            <span class="text-[#ffb700]">Size: ${(data.size / 1024).toFixed(1)}KB</span>
            <span class="text-[#ff007f]">${data.complexity}</span>
          </div>
        `;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
        tooltip.classList.remove('opacity-0');
      } else {
        tooltip.classList.add('opacity-0');
      }
    });
  }

  /**
   * Cyberpunk Audio Synthesizer (Web Audio API)
   */
  playSfx(type = 'select') {
    if (!this.audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'load') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'mode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }
}

// Bootstrap SynaptoScope 3D on window load
window.addEventListener('DOMContentLoaded', () => {
  new SynaptoScopeApp();
});
