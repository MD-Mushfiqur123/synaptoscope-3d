# 🏙️ SynaptoScope 3D — Autonomous 3D Codebase City & Flight Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Three.js](https://img.shields.io/badge/Engine-Three.js_WebGL-black?logo=three.js)](https://threejs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Style-Tailwind_CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Creator](https://img.shields.io/badge/Lead_Developer-Md_Mushfiqur_Rahim-green)](https://github.com/MD-Mushfiqur123)

**SynaptoScope 3D** transforms any software repository into an explorable, living 3D procedural skyscraper city and interactive neural dependency constellation. Fly through millions of lines of code with real-time WebGL rendering, inspect file architectures, and trace AST dependency laser bridges across the codebase.

---

## 🌟 Key Features

- 🏙️ **3D Squarified Treemap City:** Every directory forms a distinct city district; every source file becomes a 3D glassmorphic skyscraper where height correlates with Lines of Code (LOC) and complexity.
- 🚁 **Drone Flight Simulator Controls:** Smooth WASD 6DOF flight physics, altitude boost, mouse-look camera damping, and gimbal-lock protection.
- ⚡ **Instant Live GitHub Importer:** Paste any public GitHub repository URL (`owner/repo`) to stream the git tree in real time.
- 📂 **Zero-Server Offline Local Folder Scanner:** Drag & drop any local project directory to scan and render completely in-browser via File System Access API.
- 🌈 **3 Dynamic Shading & Heatmap Modes:**
  - **Language Matrix:** Metallic PBR materials colored by language (TypeScript blue, Python yellow, Rust orange, CSS purple, etc.).
  - **Complexity Heatmap:** Real-time gradient visualization (Cyan/Green for simple modules $\to$ Crimson Red for high-LOC files).
  - **Recency Pulse:** Dynamic GLSL scanlines and breathing emissive glows.
- 🌉 **AST Laser Dependency Bridges:** Client-side AST/regex parser extracting ES6 `import`, CommonJS `require`, Python `import/from`, and Rust `use` to draw 3D glowing laser links.
- 🔍 **Glassmorphic Inspector Drawer:** Click any building to view metadata, dependency graph callers/callees, and syntax-highlighted code.
- 🔊 **Web Audio Cyber Soundscapes:** Subtle procedural audio chimes on flight maneuvers, node focus, and scanning triggers.

---

## 🚀 Quickstart

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/MD-Mushfiqur123/synaptoscope-3d.git
cd synaptoscope-3d

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🎮 Flight Controls

| Key / Action | Function |
| :--- | :--- |
| **`W` / `S`** | Move Forward / Backward |
| **`A` / `D`** | Strafe Left / Right |
| **`Q` / `E`** | Descend / Ascend Altitude |
| **`Shift`** | 3x Hyper-Boost Speed |
| **Left Click + Drag** | Mouse Orbit / Pitch & Yaw Look |
| **Click on Building** | Select File & Open Code Inspector |
| **`Space`** | Reset Camera & Center View |

---

## 🏗️ Architecture

```
synaptoscope-3d/
├── index.html                 # Cyberpunk HUD Overlay & canvas mount
├── src/
│   ├── engine/
│   │   ├── SceneManager.js    # Three.js WebGLRenderer & Post-processing Bloom
│   │   ├── CityGenerator.js   # Squarified Treemap 3D Procedural Skyscrapers
│   │   ├── FlightControls.js  # 6DOF Drone Flight Physics & Collision Damping
│   │   ├── HeatmapShaders.js  # Language, Complexity, & Recency GLSL Shaders
│   │   └── RaycasterSelector.js # Interactive Bounding Box & Selection Listener
│   ├── ui/
│   │   ├── HUDOverlay.js      # Top Nav, Telemetry, View Mode Toggles & Presets
│   │   ├── InspectorPanel.js  # Slide-out Telemetry Drawer & Code Viewer
│   │   └── FolderDropzone.js  # Local Folder Drag & Drop Parser
│   ├── services/
│   │   ├── GithubFetcher.js   # Recursive Git Tree API & Rate-limit Handler
│   │   ├── ASTParser.js       # Multi-language AST Dependency Bridge Tracer
│   │   └── SampleCodebases.js # Instant Zero-Setup Demo Repositories
│   └── main.js                # App Orchestrator & Loop Controller
```

---

## 👤 Author & Maintainer

- **Creator & Lead Architect:** **Md Mushfiqur Rahim**  
- **GitHub:** [@MD-Mushfiqur123](https://github.com/MD-Mushfiqur123)  
- **License:** MIT License  
