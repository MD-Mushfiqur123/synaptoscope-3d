/**
 * SynaptoScope 3D - Local Folder Drag & Drop Parser
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Offline zero-server folder scanner with File System Access API & webkitdirectory support.
 */

import { ASTParser } from '../services/ASTParser.js';

export class FolderDropzone {
  constructor(container, onCodebaseLoaded, onError) {
    this.container = container;
    this.onCodebaseLoaded = onCodebaseLoaded || (() => {});
    this.onError = onError || console.error;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'folder-dropzone-modal';
    this.element.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300 opacity-0 pointer-events-none';
    
    this.element.innerHTML = `
      <div class="relative w-full max-w-xl p-8 bg-[#0a0f1e]/95 border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] text-white font-mono overflow-hidden">
        <!-- Close Button -->
        <button id="dropzone-close-btn" class="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <!-- Header -->
        <div class="flex items-center space-x-3 mb-6">
          <div class="p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl text-[#00f0ff]">
            <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
          </div>
          <div>
            <h2 class="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ff007f] to-[#00ff88]">
              LOCAL REPOSITORY SCANNER
            </h2>
            <p class="text-xs text-gray-400 font-sans">100% Client-Side • Zero Server Upload • Instant 3D Parsing</p>
          </div>
        </div>

        <!-- Drop Area -->
        <div id="drop-target-area" class="relative group cursor-pointer border-2 border-dashed border-[#00f0ff]/30 hover:border-[#00f0ff] bg-[#05070e]/60 hover:bg-[#00f0ff]/5 rounded-xl p-8 text-center transition-all duration-300">
          <input type="file" id="folder-input-hidden" webkitdirectory directory multiple class="hidden" />
          
          <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#ff007f]/20 flex items-center justify-center border border-[#00f0ff]/40 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white group-hover:text-[#00f0ff] transition-colors">
                Drag & Drop a Project Folder Here
              </p>
              <p class="text-xs text-gray-400 mt-1 font-sans">
                or click to browse your local file system
              </p>
            </div>
            <div class="flex items-center space-x-2 text-[10px] text-gray-500 uppercase tracking-widest pt-2">
              <span class="px-2 py-0.5 bg-black/40 border border-gray-800 rounded">JS/TS</span>
              <span class="px-2 py-0.5 bg-black/40 border border-gray-800 rounded">Python</span>
              <span class="px-2 py-0.5 bg-black/40 border border-gray-800 rounded">Rust/Go</span>
              <span class="px-2 py-0.5 bg-black/40 border border-gray-800 rounded">C/C++</span>
            </div>
          </div>
        </div>

        <!-- Modern API Action Button -->
        <div class="mt-5 flex items-center justify-between">
          <button id="picker-api-btn" class="flex-1 py-2.5 px-4 mr-3 bg-gradient-to-r from-[#00f0ff]/20 to-[#0070f3]/20 hover:from-[#00f0ff]/30 hover:to-[#0070f3]/30 border border-[#00f0ff]/40 rounded-xl text-xs font-semibold text-[#00f0ff] tracking-wide transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] flex items-center justify-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            <span>Open Folder via Native Picker</span>
          </button>
          
          <button id="dropzone-cancel-btn" class="py-2.5 px-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-300 transition-colors">
            Cancel
          </button>
        </div>

        <!-- Scanning Progress Bar -->
        <div id="dropzone-progress" class="hidden mt-6 space-y-2">
          <div class="flex justify-between text-xs text-gray-400">
            <span id="dropzone-status-text">Parsing files...</span>
            <span id="dropzone-percent-text" class="text-[#00f0ff]">0%</span>
          </div>
          <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-[#00f0ff]/20">
            <div id="dropzone-progress-bar" class="h-full bg-gradient-to-r from-[#00f0ff] via-[#00ff88] to-[#ff007f] transition-all duration-200" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.element.querySelector('#dropzone-close-btn');
    const cancelBtn = this.element.querySelector('#dropzone-cancel-btn');
    const dropArea = this.element.querySelector('#drop-target-area');
    const fileInput = this.element.querySelector('#folder-input-hidden');
    const pickerBtn = this.element.querySelector('#picker-api-btn');

    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());

    // Native Directory Picker API
    pickerBtn.addEventListener('click', async () => {
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          await this.processDirectoryHandle(dirHandle);
        } catch (err) {
          if (err.name !== 'AbortError') {
            this.onError('Directory picker failed: ' + err.message);
          }
        }
      } else {
        fileInput.click();
      }
    });

    // Hidden input click
    dropArea.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await this.processFileList(e.target.files);
      }
    });

    // Drag & Drop
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('border-[#00f0ff]', 'bg-[#00f0ff]/10');
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('border-[#00f0ff]', 'bg-[#00f0ff]/10');
    });

    dropArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropArea.classList.remove('border-[#00f0ff]', 'bg-[#00f0ff]/10');

      if (e.dataTransfer.items) {
        const items = Array.from(e.dataTransfer.items);
        await this.processDataTransferItems(items);
      } else if (e.dataTransfer.files) {
        await this.processFileList(e.dataTransfer.files);
      }
    });

    // Global drag-and-drop on entire window
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', async (e) => {
      // If modal is not open and files dropped onto canvas
      if (!this.isVisible && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        this.show();
        if (e.dataTransfer.items) {
          await this.processDataTransferItems(Array.from(e.dataTransfer.items));
        } else {
          await this.processFileList(e.dataTransfer.files);
        }
      }
    });
  }

  show() {
    this.isVisible = true;
    this.element.classList.remove('opacity-0', 'pointer-events-none');
    this.element.classList.add('opacity-100', 'pointer-events-auto');
  }

  hide() {
    this.isVisible = false;
    this.element.classList.add('opacity-0', 'pointer-events-none');
    this.element.classList.remove('opacity-100', 'pointer-events-auto');
    this.resetProgress();
  }

  updateProgress(status, percent) {
    const progressEl = this.element.querySelector('#dropzone-progress');
    const statusText = this.element.querySelector('#dropzone-status-text');
    const percentText = this.element.querySelector('#dropzone-percent-text');
    const bar = this.element.querySelector('#dropzone-progress-bar');

    progressEl.classList.remove('hidden');
    statusText.innerText = status;
    percentText.innerText = `${Math.round(percent)}%`;
    bar.style.width = `${percent}%`;
  }

  resetProgress() {
    const progressEl = this.element.querySelector('#dropzone-progress');
    const bar = this.element.querySelector('#dropzone-progress-bar');
    progressEl.classList.add('hidden');
    bar.style.width = '0%';
  }

  /**
   * Process modern FileSystemDirectoryHandle (Chrome/Edge/Modern browsers)
   */
  async processDirectoryHandle(dirHandle) {
    this.updateProgress('Scanning directory tree...', 10);
    const files = [];

    const readDirectory = async (handle, currentPath = '') => {
      for await (const [name, entry] of handle.entries()) {
        if (name.startsWith('.') || name === 'node_modules' || name === 'dist' || name === 'build' || name === 'target') {
          continue;
        }
        const itemPath = currentPath ? `${currentPath}/${name}` : name;
        if (entry.kind === 'file') {
          if (this.shouldIncludeFile(name)) {
            const file = await entry.getFile();
            files.push({ file, path: itemPath });
          }
        } else if (entry.kind === 'directory') {
          await readDirectory(entry, itemPath);
        }
      }
    };

    await readDirectory(dirHandle, '');
    await this.compileParsedFiles(files, dirHandle.name);
  }

  /**
   * Process DataTransferItems (supporting directory recursion)
   */
  async processDataTransferItems(items) {
    this.updateProgress('Reading dropped hierarchy...', 10);
    const files = [];
    let rootName = 'Local-Project';

    const traverseEntry = async (entry, path = '') => {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        return;
      }
      const itemPath = path ? `${path}/${entry.name}` : entry.name;
      if (entry.isFile) {
        if (this.shouldIncludeFile(entry.name)) {
          const file = await new Promise(resolve => entry.file(resolve));
          files.push({ file, path: itemPath });
        }
      } else if (entry.isDirectory) {
        rootName = entry.name;
        const dirReader = entry.createReader();
        const entries = await new Promise(resolve => dirReader.readEntries(resolve));
        for (const child of entries) {
          await traverseEntry(child, itemPath);
        }
      }
    };

    for (const item of items) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) await traverseEntry(entry);
      }
    }

    await this.compileParsedFiles(files, rootName);
  }

  /**
   * Process standard FileList
   */
  async processFileList(fileList) {
    this.updateProgress('Reading selected files...', 15);
    const files = [];
    let rootName = 'Local-Folder';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      if (relPath.includes('/')) {
        rootName = relPath.split('/')[0];
      }
      if (this.shouldIncludeFile(file.name) && !relPath.includes('node_modules/')) {
        files.push({ file, path: relPath });
      }
    }

    await this.compileParsedFiles(files, rootName);
  }

  /**
   * Read file contents, calculate metrics, and build AST graph
   */
  async compileParsedFiles(fileList, repoName) {
    if (fileList.length === 0) {
      this.onError('No readable source code files found in selected directory.');
      this.hide();
      return;
    }

    this.updateProgress(`Reading source files (0/${fileList.length})...`, 30);
    const parsedFiles = [];
    const total = fileList.length;

    for (let i = 0; i < total; i++) {
      const { file, path } = fileList[i];
      let content = '';
      try {
        if (file.size < 500000) { // Read content for files under 500KB
          content = await file.text();
        }
      } catch (e) {
        console.warn(`Could not read file ${path}`, e);
      }

      const metrics = ASTParser.analyzeCodeMetrics(content, path);
      parsedFiles.push({
        path,
        size: file.size,
        loc: metrics.loc || Math.max(5, Math.round(file.size / 35)),
        codeLines: metrics.codeLines,
        complexity: metrics.complexity,
        language: this.detectLanguage(path),
        content
      });

      if (i % 10 === 0 || i === total - 1) {
        this.updateProgress(`Parsed ${i + 1}/${total} files...`, 30 + Math.round((i / total) * 50));
      }
    }

    this.updateProgress('Building Laser Dependency Graph...', 90);
    const astGraph = ASTParser.parseDependencies(parsedFiles);

    const codebase = {
      name: repoName,
      label: repoName,
      description: `Locally scanned codebase with ${parsedFiles.length} files.`,
      stars: 0,
      forks: 0,
      language: 'Local Workspace',
      files: astGraph.nodes,
      links: astGraph.links,
      stats: astGraph.stats,
      isLocal: true
    };

    this.updateProgress('Constructing 3D SynaptoScope City...', 100);
    setTimeout(() => {
      this.hide();
      this.onCodebaseLoaded(codebase);
    }, 400);
  }

  shouldIncludeFile(filename) {
    const ext = ASTParser.getFileExtension(filename).toLowerCase();
    const excluded = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'zip', 'tar', 'gz', 'pdf', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'mp3', 'exe', 'bin', 'lock', 'map'];
    return !excluded.includes(ext);
  }

  detectLanguage(filename) {
    const ext = ASTParser.getFileExtension(filename).toLowerCase();
    const map = {
      js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX',
      py: 'Python', rs: 'Rust', go: 'Go', c: 'C', cpp: 'C++', h: 'C Header',
      java: 'Java', html: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON',
      md: 'Markdown', sh: 'Shell', sql: 'SQL', glsl: 'GLSL'
    };
    return map[ext] || 'Source Code';
  }
}
