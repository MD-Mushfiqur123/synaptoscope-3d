/**
 * SynaptoScope 3D - Cyberpunk HUD Overlay & Controller
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Full-featured responsive HUD with repo bar, presets, view modes, telemetry stats, and filter controls.
 */

export class HUDOverlay {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = {
      onLoadRepo: callbacks.onLoadRepo || (() => {}),
      onLoadSample: callbacks.onLoadSample || (() => {}),
      onOpenLocalFolder: callbacks.onOpenLocalFolder || (() => {}),
      onChangeViewMode: callbacks.onChangeViewMode || (() => {}),
      onFilterChange: callbacks.onFilterChange || (() => {}),
      onToggleAutoRotate: callbacks.onToggleAutoRotate || (() => {}),
      onToggleBloom: callbacks.onToggleBloom || (() => {}),
      onToggleAudio: callbacks.onToggleAudio || (() => {}),
      onSaveToken: callbacks.onSaveToken || (() => {}),
      onResetCamera: callbacks.onResetCamera || (() => {})
    };

    this.currentViewMode = 'city';
    this.isAutoRotate = true;
    this.isBloom = true;
    this.isAudio = true;
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'synaptoscope-hud';
    this.element.className = 'fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 font-mono select-none';

    this.element.innerHTML = `
      <!-- TOP NAVIGATION BAR -->
      <header class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full pointer-events-auto">
        
        <!-- Brand & Title -->
        <div class="flex items-center space-x-3 bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.15)] shrink-0">
          <div class="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00f0ff] via-[#ff007f] to-[#00ff88] p-[1px]">
            <div class="w-full h-full bg-[#05070e] rounded-[11px] flex items-center justify-center">
              <svg class="w-4 h-4 text-[#00f0ff] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-sm sm:text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ffffff] to-[#ff007f]">
                SYNAPTOSCOPE 3D
              </h1>
              <span class="px-1.5 py-0.2 text-[9px] font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 rounded">v1.0</span>
            </div>
            <p class="text-[10px] text-gray-400 font-sans tracking-wide">
              by <a href="https://github.com/MD-Mushfiqur123" target="_blank" class="text-gray-300 hover:text-[#00f0ff] transition-colors underline font-medium">Md Mushfiqur Rahim</a>
            </p>
          </div>
        </div>

        <!-- Repository Search Bar & Presets -->
        <div class="flex-1 max-w-2xl flex items-center space-x-2 bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 p-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div class="relative flex-1 flex items-center">
            <svg class="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              id="repo-search-input" 
              placeholder="e.g. MD-Mushfiqur123/orion-space or GitHub URL"
              value="MD-Mushfiqur123/orion-space"
              class="w-full bg-[#05070e]/80 border border-gray-800 focus:border-[#00f0ff] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00f0ff] transition-all"
            />
          </div>

          <!-- Quick Presets Dropdown -->
          <select id="repo-preset-select" class="bg-[#0b1226] border border-gray-700 hover:border-[#00f0ff]/50 rounded-xl px-2.5 py-2 text-xs text-gray-200 focus:outline-none cursor-pointer">
            <option value="" disabled selected>Presets</option>
            <option value="MD-Mushfiqur123/orion-space">🌌 Orion Space (Mushfiqur)</option>
            <option value="facebook/react">⚛️ React Core (Meta)</option>
            <option value="torvalds/linux">🐧 Linux Kernel (Linus)</option>
          </select>

          <!-- Visualize Button -->
          <button id="visualize-btn" class="px-4 py-2 bg-gradient-to-r from-[#00f0ff] to-[#0070f3] hover:from-[#00f0ff] hover:to-[#ff007f] text-black font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center space-x-1.5 shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
            <span>Scan 3D</span>
          </button>

          <!-- Local Folder Button -->
          <button id="open-local-btn" title="Scan Local Directory" class="p-2 bg-[#0b1226] hover:bg-[#00f0ff]/20 text-gray-300 hover:text-[#00f0ff] border border-gray-700 hover:border-[#00f0ff]/50 rounded-xl text-xs transition-all shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
          </button>

          <!-- Settings / Token Button -->
          <button id="open-settings-btn" title="GitHub Token & Settings" class="p-2 bg-[#0b1226] hover:bg-[#ff007f]/20 text-gray-300 hover:text-[#ff007f] border border-gray-700 hover:border-[#ff007f]/50 rounded-xl text-xs transition-all shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>
        </div>

        <!-- View Modes Switcher -->
        <div class="flex items-center space-x-1 bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 p-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
          <button data-mode="city" class="mode-btn active px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 bg-[#00f0ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]">
            <span>🏙️</span><span class="hidden sm:inline">City</span>
          </button>
          <button data-mode="nebula" class="mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-1.5">
            <span>🌌</span><span class="hidden sm:inline">Nebula</span>
          </button>
          <button data-mode="heatmap" class="mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-1.5">
            <span>🌡️</span><span class="hidden sm:inline">Heatmap</span>
          </button>
          <button data-mode="graph" class="mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-1.5">
            <span>⚡</span><span class="hidden sm:inline">Lasers</span>
          </button>
        </div>
      </header>

      <!-- LIVE TOAST & STATUS BAR (CENTER POPUP) -->
      <div id="hud-toast-wrap" class="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 opacity-0 -translate-y-2 z-50">
        <div id="hud-toast" class="px-5 py-2.5 bg-[#0a0f22]/95 border border-[#00f0ff] rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl text-xs text-white flex items-center space-x-3">
          <div id="toast-spinner" class="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div>
          <span id="toast-text">Scanning repository...</span>
        </div>
      </div>

      <!-- BOTTOM CONTROL STRIP -->
      <footer class="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 w-full pointer-events-auto">
        
        <!-- Telemetry & Metrics Strip -->
        <div class="flex flex-wrap items-center gap-2 bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div class="flex items-center space-x-1.5 pr-2 border-r border-gray-800">
            <span class="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
            <span class="text-[11px] text-gray-400">FPS:</span>
            <span id="telemetry-fps" class="text-xs font-bold text-[#00ff88]">60</span>
          </div>

          <div class="flex items-center space-x-1.5 pr-2 border-r border-gray-800">
            <span class="text-[11px] text-gray-400">FILES:</span>
            <span id="telemetry-files" class="text-xs font-bold text-[#00f0ff]">0</span>
          </div>

          <div class="flex items-center space-x-1.5 pr-2 border-r border-gray-800">
            <span class="text-[11px] text-gray-400">TOTAL LOC:</span>
            <span id="telemetry-loc" class="text-xs font-bold text-[#ff007f]">0</span>
          </div>

          <div class="flex items-center space-x-1.5">
            <span class="text-[11px] text-gray-400">LASER LINKS:</span>
            <span id="telemetry-links" class="text-xs font-bold text-[#ffb700]">0</span>
          </div>
        </div>

        <!-- Live File Search & Filter Box -->
        <div class="relative flex items-center bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 px-3 py-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] w-full sm:w-64">
          <svg class="w-3.5 h-3.5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          <input 
            type="text" 
            id="file-filter-input" 
            placeholder="Filter files / ext..."
            class="w-full bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none"
          />
          <button id="filter-clear-btn" class="hidden text-gray-500 hover:text-white text-xs ml-1">✕</button>
        </div>

        <!-- Quick 3D Toggles (Rotate, Bloom, SFX, Reset, Help) -->
        <div class="flex items-center space-x-1.5 bg-[#080d1e]/85 backdrop-blur-md border border-[#00f0ff]/30 p-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          
          <button id="toggle-rotate-btn" title="Toggle Auto-Rotation" class="p-2 bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 rounded-xl text-xs transition-all">
            <svg class="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>

          <button id="toggle-bloom-btn" title="Toggle Neon Bloom" class="p-2 bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/40 rounded-xl text-xs transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          </button>

          <button id="toggle-audio-btn" title="Toggle Audio SFX" class="p-2 bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 rounded-xl text-xs transition-all">
            <svg id="audio-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          </button>

          <button id="reset-camera-btn" title="Reset Camera View" class="p-2 bg-gray-900 hover:bg-[#00f0ff]/20 text-gray-300 hover:text-[#00f0ff] border border-gray-700 rounded-xl text-xs transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          </button>

          <button id="open-help-btn" title="Keyboard Shortcuts" class="p-2 bg-gray-900 hover:bg-[#ffb700]/20 text-gray-300 hover:text-[#ffb700] border border-gray-700 rounded-xl text-xs transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>

        </div>
      </footer>

      <!-- GITHUB TOKEN & SETTINGS MODAL -->
      <div id="settings-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
        <div class="w-full max-w-md p-6 bg-[#090e21] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] text-white font-mono space-y-4">
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 class="text-sm font-bold text-[#00f0ff] uppercase tracking-wider flex items-center space-x-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
              <span>GitHub API Token</span>
            </h3>
            <button id="close-settings-btn" class="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <p class="text-xs text-gray-400 font-sans leading-relaxed">
            By default, unauthenticated GitHub requests are capped at 60/hr. Adding a Personal Access Token (classic with <code class="text-[#00f0ff]">public_repo</code> scope) raises your limit to 5,000 req/hr.
          </p>

          <div class="space-y-1">
            <label class="text-[11px] text-gray-300">Personal Access Token (PAT):</label>
            <input 
              type="password" 
              id="github-token-input" 
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
              class="w-full bg-[#05070e] border border-gray-700 focus:border-[#00f0ff] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2">
            <button id="clear-token-btn" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs text-gray-300">Clear</button>
            <button id="save-token-btn" class="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#0070f3] text-black font-bold rounded-xl text-xs">Save Token</button>
          </div>
        </div>
      </div>

      <!-- KEYBOARD HELP MODAL -->
      <div id="help-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
        <div class="w-full max-w-lg p-6 bg-[#090e21] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] text-white font-mono space-y-4">
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 class="text-sm font-bold text-[#00f0ff] uppercase tracking-wider">🎮 3D Navigation Controls</h3>
            <button id="close-help-btn" class="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#00f0ff] font-bold">Left Click + Drag</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Orbit / Rotate 3D Camera</p>
            </div>
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#00f0ff] font-bold">Right Click + Drag</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Pan Camera X / Y</p>
            </div>
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#00f0ff] font-bold">Scroll Wheel</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Zoom in / out of city</p>
            </div>
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#00f0ff] font-bold">Click Building</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Inspect file telemetry & code</p>
            </div>
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#ff007f] font-bold">Spacebar</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Toggle auto-rotation</p>
            </div>
            <div class="p-2.5 bg-black/40 border border-gray-800 rounded-xl">
              <span class="text-[#ff007f] font-bold">R / Esc</span>
              <p class="text-gray-400 font-sans text-[11px] mt-0.5">Reset camera / Close inspector</p>
            </div>
          </div>

          <div class="text-center pt-2 text-[11px] text-gray-500 font-sans">
            SynaptoScope 3D • Created with precision by Md Mushfiqur Rahim
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const searchInput = this.element.querySelector('#repo-search-input');
    const presetSelect = this.element.querySelector('#repo-preset-select');
    const visualizeBtn = this.element.querySelector('#visualize-btn');
    const openLocalBtn = this.element.querySelector('#open-local-btn');
    const filterInput = this.element.querySelector('#file-filter-input');
    const filterClearBtn = this.element.querySelector('#filter-clear-btn');
    const modeButtons = this.element.querySelectorAll('.mode-btn');

    const toggleRotateBtn = this.element.querySelector('#toggle-rotate-btn');
    const toggleBloomBtn = this.element.querySelector('#toggle-bloom-btn');
    const toggleAudioBtn = this.element.querySelector('#toggle-audio-btn');
    const resetCameraBtn = this.element.querySelector('#reset-camera-btn');

    const openSettingsBtn = this.element.querySelector('#open-settings-btn');
    const settingsModal = this.element.querySelector('#settings-modal');
    const closeSettingsBtn = this.element.querySelector('#close-settings-btn');
    const tokenInput = this.element.querySelector('#github-token-input');
    const saveTokenBtn = this.element.querySelector('#save-token-btn');
    const clearTokenBtn = this.element.querySelector('#clear-token-btn');

    const openHelpBtn = this.element.querySelector('#open-help-btn');
    const helpModal = this.element.querySelector('#help-modal');
    const closeHelpBtn = this.element.querySelector('#close-help-btn');

    // Preset selection
    presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        searchInput.value = e.target.value;
        this.callbacks.onLoadRepo(e.target.value);
      }
    });

    // Search submit
    const triggerSearch = () => {
      const val = searchInput.value.trim();
      if (val) {
        this.callbacks.onLoadRepo(val);
      }
    };

    visualizeBtn.addEventListener('click', triggerSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });

    // Local folder open
    openLocalBtn.addEventListener('click', () => {
      this.callbacks.onOpenLocalFolder();
    });

    // View Mode Switching
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => {
          b.className = 'mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center space-x-1.5';
        });
        btn.className = 'mode-btn active px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 bg-[#00f0ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.5)]';
        
        const mode = btn.dataset.mode;
        this.currentViewMode = mode;
        this.callbacks.onChangeViewMode(mode);
      });
    });

    // Filter typing
    filterInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      filterClearBtn.classList.toggle('hidden', query.length === 0);
      this.callbacks.onFilterChange(query);
    });

    filterClearBtn.addEventListener('click', () => {
      filterInput.value = '';
      filterClearBtn.classList.add('hidden');
      this.callbacks.onFilterChange('');
    });

    // Toggles
    toggleRotateBtn.addEventListener('click', () => {
      this.isAutoRotate = !this.isAutoRotate;
      toggleRotateBtn.classList.toggle('bg-[#00f0ff]/20', this.isAutoRotate);
      toggleRotateBtn.classList.toggle('text-[#00f0ff]', this.isAutoRotate);
      toggleRotateBtn.classList.toggle('border-[#00f0ff]/40', this.isAutoRotate);
      toggleRotateBtn.classList.toggle('bg-gray-900', !this.isAutoRotate);
      toggleRotateBtn.classList.toggle('text-gray-500', !this.isAutoRotate);
      this.callbacks.onToggleAutoRotate(this.isAutoRotate);
    });

    toggleBloomBtn.addEventListener('click', () => {
      this.isBloom = !this.isBloom;
      toggleBloomBtn.classList.toggle('bg-[#ff007f]/20', this.isBloom);
      toggleBloomBtn.classList.toggle('text-[#ff007f]', this.isBloom);
      toggleBloomBtn.classList.toggle('border-[#ff007f]/40', this.isBloom);
      toggleBloomBtn.classList.toggle('bg-gray-900', !this.isBloom);
      toggleBloomBtn.classList.toggle('text-gray-500', !this.isBloom);
      this.callbacks.onToggleBloom(this.isBloom);
    });

    toggleAudioBtn.addEventListener('click', () => {
      this.isAudio = !this.isAudio;
      toggleAudioBtn.classList.toggle('bg-[#00ff88]/20', this.isAudio);
      toggleAudioBtn.classList.toggle('text-[#00ff88]', this.isAudio);
      toggleAudioBtn.classList.toggle('border-[#00ff88]/40', this.isAudio);
      toggleAudioBtn.classList.toggle('bg-gray-900', !this.isAudio);
      toggleAudioBtn.classList.toggle('text-gray-500', !this.isAudio);
      this.callbacks.onToggleAudio(this.isAudio);
    });

    resetCameraBtn.addEventListener('click', () => {
      this.callbacks.onResetCamera();
    });

    // Settings Modal
    openSettingsBtn.addEventListener('click', () => {
      tokenInput.value = localStorage.getItem('synaptoscope_github_token') || '';
      settingsModal.classList.remove('opacity-0', 'pointer-events-none');
    });
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('opacity-0', 'pointer-events-none');
    });
    saveTokenBtn.addEventListener('click', () => {
      const token = tokenInput.value.trim();
      this.callbacks.onSaveToken(token);
      settingsModal.classList.add('opacity-0', 'pointer-events-none');
      this.showToast('GitHub Personal Token Saved!', 'success');
    });
    clearTokenBtn.addEventListener('click', () => {
      tokenInput.value = '';
      this.callbacks.onSaveToken('');
      settingsModal.classList.add('opacity-0', 'pointer-events-none');
      this.showToast('GitHub Token Removed.', 'info');
    });

    // Help Modal
    openHelpBtn.addEventListener('click', () => {
      helpModal.classList.remove('opacity-0', 'pointer-events-none');
    });
    closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('opacity-0', 'pointer-events-none');
    });

    // Global Keybindings
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRotateBtn.click();
      } else if (e.key.toLowerCase() === 'h') {
        helpModal.classList.toggle('opacity-0');
        helpModal.classList.toggle('pointer-events-none');
      } else if (e.key.toLowerCase() === 'r') {
        this.callbacks.onResetCamera();
      }
    });
  }

  updateTelemetry({ filesCount = 0, loc = 0, linksCount = 0 }) {
    this.element.querySelector('#telemetry-files').innerText = filesCount.toLocaleString();
    this.element.querySelector('#telemetry-loc').innerText = loc.toLocaleString();
    this.element.querySelector('#telemetry-links').innerText = linksCount.toLocaleString();
  }

  updateFPS(timestamp) {
    this.frameCount++;
    const delta = timestamp - this.lastFrameTime;
    if (delta >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFrameTime = timestamp;
      const fpsEl = this.element.querySelector('#telemetry-fps');
      if (fpsEl) {
        fpsEl.innerText = this.fps;
        if (this.fps < 30) {
          fpsEl.className = 'text-xs font-bold text-[#ff007f]';
        } else if (this.fps < 50) {
          fpsEl.className = 'text-xs font-bold text-[#ffb700]';
        } else {
          fpsEl.className = 'text-xs font-bold text-[#00ff88]';
        }
      }
    }
  }

  showToast(message, type = 'loading') {
    const wrap = this.element.querySelector('#hud-toast-wrap');
    const toast = this.element.querySelector('#hud-toast');
    const text = this.element.querySelector('#toast-text');
    const spinner = this.element.querySelector('#toast-spinner');

    text.innerText = message;
    spinner.classList.toggle('hidden', type !== 'loading');

    if (type === 'error') {
      toast.className = 'px-5 py-2.5 bg-red-950/95 border border-red-500 rounded-2xl shadow-[0_0_30px_rgba(255,0,0,0.4)] backdrop-blur-xl text-xs text-white flex items-center space-x-3';
    } else if (type === 'success') {
      toast.className = 'px-5 py-2.5 bg-[#0a1e14]/95 border border-[#00ff88] rounded-2xl shadow-[0_0_30px_rgba(0,255,136,0.4)] backdrop-blur-xl text-xs text-white flex items-center space-x-3';
    } else {
      toast.className = 'px-5 py-2.5 bg-[#0a0f22]/95 border border-[#00f0ff] rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl text-xs text-white flex items-center space-x-3';
    }

    wrap.classList.remove('opacity-0', '-translate-y-2');
    wrap.classList.add('opacity-100', 'translate-y-0');

    if (type !== 'loading') {
      setTimeout(() => {
        wrap.classList.add('opacity-0', '-translate-y-2');
        wrap.classList.remove('opacity-100', 'translate-y-0');
      }, 3500);
    }
  }

  hideToast() {
    const wrap = this.element.querySelector('#hud-toast-wrap');
    wrap.classList.add('opacity-0', '-translate-y-2');
    wrap.classList.remove('opacity-100', 'translate-y-0');
  }
}
