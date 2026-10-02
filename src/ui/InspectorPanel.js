/**
 * SynaptoScope 3D - Glassmorphic File Inspector & Code Viewer Panel
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Slide-out cyberpunk inspector panel with metrics, dependency links, and syntax-highlighted code viewer.
 */

export class InspectorPanel {
  constructor(container, onFocusNode, onSelectNode) {
    this.container = container;
    this.onFocusNode = onFocusNode || (() => {});
    this.onSelectNode = onSelectNode || (() => {});
    this.currentNode = null;
    this.isOpen = false;
    this.codeWrap = false;
    this.init();
  }

  init() {
    this.element = document.createElement('aside');
    this.element.id = 'synaptoscope-inspector';
    this.element.className = 'fixed top-16 right-0 bottom-0 w-full sm:w-[460px] lg:w-[520px] bg-[#070b19]/90 backdrop-blur-xl border-l border-[#00f0ff]/30 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] z-40 transform translate-x-full transition-transform duration-300 flex flex-col font-mono text-white overflow-hidden';

    this.element.innerHTML = `
      <!-- Panel Header -->
      <div class="px-5 py-4 bg-[#0a1024]/90 border-b border-[#00f0ff]/20 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2.5 overflow-hidden">
          <div class="w-3 h-3 rounded-full bg-[#00f0ff] animate-ping"></div>
          <span class="text-xs font-bold tracking-widest text-[#00f0ff] uppercase">NODE TELEMETRY</span>
        </div>
        <div class="flex items-center space-x-2">
          <button id="inspector-focus-btn" title="Focus 3D Camera" class="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 rounded-lg text-xs text-[#00f0ff] transition-all flex items-center space-x-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Focus 3D</span>
          </button>
          <button id="inspector-close-btn" title="Close Panel" class="p-1.5 text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <!-- Panel Scrollable Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
        
        <!-- File Header & Path -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <h3 id="inspector-filename" class="text-lg font-bold text-white tracking-wide break-all">
              filename.js
            </h3>
            <span id="inspector-lang-badge" class="px-2.5 py-0.5 text-[11px] font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 rounded-full shrink-0 ml-2">
              JavaScript
            </span>
          </div>
          <p id="inspector-filepath" class="text-xs text-gray-400 break-all font-sans">
            src/core/filename.js
          </p>
        </div>

        <!-- Metrics Grid (LOC, Size, Complexity, Connections) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 bg-[#0d142c]/70 border border-[#00f0ff]/20 rounded-xl">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider">Lines of Code</div>
            <div id="inspector-loc" class="text-base font-bold text-[#00f0ff] mt-0.5">0</div>
          </div>
          <div class="p-3 bg-[#0d142c]/70 border border-[#00ff88]/20 rounded-xl">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider">File Size</div>
            <div id="inspector-size" class="text-base font-bold text-[#00ff88] mt-0.5">0 KB</div>
          </div>
          <div class="p-3 bg-[#0d142c]/70 border border-[#ff007f]/20 rounded-xl">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider">Complexity</div>
            <div id="inspector-complexity" class="text-base font-bold text-[#ff007f] mt-0.5">Low</div>
          </div>
          <div class="p-3 bg-[#0d142c]/70 border border-[#ffb700]/20 rounded-xl">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider">Laser Links</div>
            <div id="inspector-links-count" class="text-base font-bold text-[#ffb700] mt-0.5">0</div>
          </div>
        </div>

        <!-- Dependency Laser Network (Incoming & Outgoing) -->
        <div class="space-y-3 p-4 bg-[#0a0f22]/80 border border-gray-800 rounded-xl">
          <div class="text-xs font-semibold text-gray-300 flex items-center justify-between">
            <span class="tracking-wider uppercase text-[11px] text-[#00f0ff]">Dependency Network</span>
            <span id="inspector-dep-summary" class="text-[10px] text-gray-500">0 in / 0 out</span>
          </div>

          <!-- Outgoing Imports -->
          <div class="space-y-1.5">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <span class="text-[#ff007f]">▲</span>
              <span>Imports / Outgoing Dependencies</span>
            </div>
            <div id="inspector-outgoing-list" class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              <span class="text-xs text-gray-500 italic">No external imports</span>
            </div>
          </div>

          <!-- Incoming References -->
          <div class="space-y-1.5 pt-2 border-t border-gray-800/80">
            <div class="text-[10px] text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <span class="text-[#00ff88]">▼</span>
              <span>Imported By / Incoming Callers</span>
            </div>
            <div id="inspector-incoming-list" class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              <span class="text-xs text-gray-500 italic">No incoming callers</span>
            </div>
          </div>
        </div>

        <!-- Code Viewer Section -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-gray-300 tracking-wider uppercase">Source Code</span>
              <span id="inspector-lines-count" class="text-[10px] text-gray-500 font-sans">0 lines</span>
            </div>
            <div class="flex items-center space-x-2">
              <button id="code-copy-btn" class="px-2 py-0.5 text-[11px] bg-gray-800/80 hover:bg-[#00f0ff]/20 text-gray-300 hover:text-[#00f0ff] border border-gray-700 hover:border-[#00f0ff]/40 rounded transition-colors flex items-center space-x-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span id="copy-btn-text">Copy</span>
              </button>
            </div>
          </div>

          <!-- Code Display Container -->
          <div class="relative bg-[#04060d] border border-gray-800 rounded-xl overflow-hidden shadow-inner text-xs">
            <div id="code-viewer-container" class="max-h-[340px] overflow-auto custom-scrollbar flex p-3 font-mono text-[12px] leading-relaxed select-text">
              <div id="code-gutter" class="text-gray-600 select-none text-right pr-3 border-r border-gray-800/80 shrink-0 font-mono">1</div>
              <pre id="code-content" class="pl-3 overflow-x-auto text-gray-200 flex-1 whitespace-pre"><code>// Loading source...</code></pre>
            </div>
          </div>
        </div>

        <!-- External Link -->
        <div id="inspector-github-link-wrap" class="pt-2">
          <a id="inspector-github-link" href="#" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-4 bg-[#0d142c] hover:bg-[#00f0ff]/10 border border-gray-700 hover:border-[#00f0ff]/50 rounded-xl text-xs text-gray-300 hover:text-[#00f0ff] flex items-center justify-center space-x-2 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
            <span>View Raw Source on GitHub</span>
          </a>
        </div>

      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.element.querySelector('#inspector-close-btn');
    const focusBtn = this.element.querySelector('#inspector-focus-btn');
    const copyBtn = this.element.querySelector('#code-copy-btn');

    closeBtn.addEventListener('click', () => this.close());
    
    focusBtn.addEventListener('click', () => {
      if (this.currentNode) {
        this.onFocusNode(this.currentNode);
      }
    });

    copyBtn.addEventListener('click', () => {
      if (this.currentNode && this.currentNode.content) {
        navigator.clipboard.writeText(this.currentNode.content);
        const copyText = this.element.querySelector('#copy-btn-text');
        copyText.innerText = 'Copied!';
        setTimeout(() => { copyText.innerText = 'Copy'; }, 2000);
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Inspect a selected file node
   */
  inspect(node, allLinks = [], allFiles = []) {
    if (!node) return;
    this.currentNode = node;
    this.isOpen = true;
    this.element.classList.remove('translate-x-full');

    const filename = node.path.split('/').pop() || node.path;
    const sizeFormatted = node.size > 1024 * 1024
      ? `${(node.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(node.size / 1024).toFixed(1)} KB`;

    this.element.querySelector('#inspector-filename').innerText = filename;
    this.element.querySelector('#inspector-filepath').innerText = node.path;
    this.element.querySelector('#inspector-lang-badge').innerText = node.language || 'Code';
    this.element.querySelector('#inspector-loc').innerText = (node.loc || 0).toLocaleString();
    this.element.querySelector('#inspector-size').innerText = sizeFormatted;

    // Complexity Rating
    const complexityEl = this.element.querySelector('#inspector-complexity');
    const compScore = node.complexity || Math.max(1, Math.round((node.loc || 20) / 25));
    if (compScore > 20) {
      complexityEl.innerText = 'High';
      complexityEl.className = 'text-base font-bold text-[#ff007f] mt-0.5';
    } else if (compScore > 8) {
      complexityEl.innerText = 'Medium';
      complexityEl.className = 'text-base font-bold text-[#ffb700] mt-0.5';
    } else {
      complexityEl.innerText = 'Optimal';
      complexityEl.className = 'text-base font-bold text-[#00ff88] mt-0.5';
    }

    // Filter connections
    const norm = (node.normalizedPath || node.path).replace(/\\/g, '/');
    const outgoing = allLinks.filter(l => l.source === norm);
    const incoming = allLinks.filter(l => l.target === norm);

    this.element.querySelector('#inspector-links-count').innerText = `${outgoing.length + incoming.length}`;
    this.element.querySelector('#inspector-dep-summary').innerText = `${incoming.length} incoming / ${outgoing.length} outgoing`;

    // Render Outgoing Buttons
    const outgoingList = this.element.querySelector('#inspector-outgoing-list');
    outgoingList.innerHTML = '';
    if (outgoing.length === 0) {
      outgoingList.innerHTML = `<span class="text-[11px] text-gray-500 italic">No external imports</span>`;
    } else {
      outgoing.forEach(link => {
        const btn = document.createElement('button');
        const targetName = link.target.split('/').pop();
        btn.className = 'px-2 py-0.5 bg-[#ff007f]/10 hover:bg-[#ff007f]/25 border border-[#ff007f]/30 rounded text-[11px] text-pink-300 transition-colors flex items-center space-x-1 truncate max-w-[200px]';
        btn.title = link.target;
        btn.innerHTML = `<span class="text-[#ff007f]">→</span><span>${targetName}</span>`;
        btn.addEventListener('click', () => {
          const targetNode = allFiles.find(f => (f.normalizedPath || f.path) === link.target);
          if (targetNode) {
            this.inspect(targetNode, allLinks, allFiles);
            this.onSelectNode(targetNode);
          }
        });
        outgoingList.appendChild(btn);
      });
    }

    // Render Incoming Buttons
    const incomingList = this.element.querySelector('#inspector-incoming-list');
    incomingList.innerHTML = '';
    if (incoming.length === 0) {
      incomingList.innerHTML = `<span class="text-[11px] text-gray-500 italic">No incoming callers</span>`;
    } else {
      incoming.forEach(link => {
        const btn = document.createElement('button');
        const sourceName = link.source.split('/').pop();
        btn.className = 'px-2 py-0.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/25 border border-[#00ff88]/30 rounded text-[11px] text-emerald-300 transition-colors flex items-center space-x-1 truncate max-w-[200px]';
        btn.title = link.source;
        btn.innerHTML = `<span class="text-[#00ff88]">←</span><span>${sourceName}</span>`;
        btn.addEventListener('click', () => {
          const sourceNode = allFiles.find(f => (f.normalizedPath || f.path) === link.source);
          if (sourceNode) {
            this.inspect(sourceNode, allLinks, allFiles);
            this.onSelectNode(sourceNode);
          }
        });
        incomingList.appendChild(btn);
      });
    }

    // Render Syntax Highlighted Code
    this.renderSourceCode(node.content || `// Source code preview for ${node.path}\n// Lines: ${node.loc || 0} | Size: ${sizeFormatted}\n\nexport const ${filename.replace(/[^a-zA-Z0-9]/g, '_')} = {\n  path: "${node.path}",\n  type: "${node.language || 'module'}"\n};`);

    // GitHub Link
    const githubLinkWrap = this.element.querySelector('#inspector-github-link-wrap');
    const githubLink = this.element.querySelector('#inspector-github-link');
    if (node.url) {
      githubLinkWrap.classList.remove('hidden');
      githubLink.href = node.url;
    } else {
      githubLinkWrap.classList.add('hidden');
    }
  }

  renderSourceCode(code) {
    const lines = code.split('\n');
    this.element.querySelector('#inspector-lines-count').innerText = `${lines.length} lines`;

    // Gutter numbers
    const gutterEl = this.element.querySelector('#code-gutter');
    gutterEl.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');

    // Highlighted code lines
    const contentEl = this.element.querySelector('#code-content');
    contentEl.innerHTML = `<code>${this.highlightCode(code)}</code>`;
  }

  highlightCode(code) {
    if (!code) return '';
    // HTML Escape
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Syntax Highlighting Regexes
    // Comments
    escaped = escaped.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, '<span class="text-gray-500 italic">$1</span>');
    // Strings
    escaped = escaped.replace(/('(?:\\'|[^'\n])*'|"(?:\\"|[^"\n])*"|`(?:\\`|[^`])*`)/g, '<span class="text-[#00ff88]">$1</span>');
    // Keywords
    escaped = escaped.replace(/\b(import|export|from|as|default|const|let|var|function|class|extends|new|return|if|else|for|while|switch|case|break|try|catch|finally|throw|async|await|typeof|instanceof|void|this|super|public|private|static)\b/g, '<span class="text-[#ff007f] font-semibold">$1</span>');
    // Built-in types & primitives
    escaped = escaped.replace(/\b(true|false|null|undefined|NaN|Infinity|number|string|boolean|any|void|never|Promise|Array|Object|Map|Set|Symbol)\b/g, '<span class="text-[#ffb700]">$1</span>');
    // Function calls
    escaped = escaped.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, '<span class="text-[#00f0ff]">$1</span>');

    return escaped;
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('translate-x-full');
  }
}
