/**
 * SynaptoScope 3D - Client-side Lightweight AST & Dependency Graph Parser
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Analyzes import/require/include statements to construct 3D laser dependency bridges.
 */

export class ASTParser {
  /**
   * Parse an array of codebase files into a graph of nodes and laser connection links.
   * @param {Array<{path: string, content?: string, size: number, loc?: number, language?: string}>} files 
   * @returns {{ nodes: Array<any>, links: Array<{source: string, target: string, type: string, weight: number}>, stats: any }}
   */
  static parseDependencies(files) {
    const fileMap = new Map();
    const links = [];
    const linkKeys = new Set();
    const dependencyCounts = new Map(); // target -> count of incoming
    const outgoingCounts = new Map();   // source -> count of outgoing

    // Populate file map with normalized paths
    files.forEach(f => {
      const normPath = this.normalizePath(f.path);
      fileMap.set(normPath, f);
      fileMap.set(normPath.toLowerCase(), f);
      
      // Also map without extension for extensionless imports
      const noExt = normPath.replace(/\.[^/.]+$/, "");
      fileMap.set(noExt, f);
      fileMap.set(noExt.toLowerCase(), f);
      
      // Index folder/index files
      if (normPath.endsWith('/index.js') || normPath.endsWith('/index.ts')) {
        const folder = normPath.replace(/\/index\.(js|ts)$/, "");
        fileMap.set(folder, f);
      }
    });

    // Parse each file's content
    files.forEach(file => {
      if (!file.content) return;
      
      const sourceNorm = this.normalizePath(file.path);
      const imports = this.extractImports(file.content, file.path);

      imports.forEach(imp => {
        const resolvedPath = this.resolvePath(sourceNorm, imp.specifier, fileMap);
        if (resolvedPath && resolvedPath !== sourceNorm) {
          const linkId = `${sourceNorm}->${resolvedPath}`;
          if (!linkKeys.has(linkId)) {
            linkKeys.add(linkId);
            links.push({
              source: sourceNorm,
              target: resolvedPath,
              type: imp.type,
              weight: 1
            });

            dependencyCounts.set(resolvedPath, (dependencyCounts.get(resolvedPath) || 0) + 1);
            outgoingCounts.set(sourceNorm, (outgoingCounts.get(sourceNorm) || 0) + 1);
          }
        }
      });
    });

    // Detect high-centrality files
    let maxConnections = 0;
    let mostConnectedFile = null;
    dependencyCounts.forEach((count, path) => {
      if (count > maxConnections) {
        maxConnections = count;
        mostConnectedFile = path;
      }
    });

    // Attach dependency stats to nodes
    const nodes = files.map(file => {
      const norm = this.normalizePath(file.path);
      const inDegree = dependencyCounts.get(norm) || 0;
      const outDegree = outgoingCounts.get(norm) || 0;
      return {
        ...file,
        normalizedPath: norm,
        inDegree,
        outDegree,
        totalDegree: inDegree + outDegree,
        centralityScore: (inDegree * 1.5 + outDegree).toFixed(1)
      };
    });

    return {
      nodes,
      links,
      stats: {
        totalFiles: files.length,
        totalLinks: links.length,
        mostConnectedFile: mostConnectedFile || (files[0] ? files[0].path : 'None'),
        maxIncomingConnections: maxConnections,
        density: files.length > 1 ? (links.length / (files.length * (files.length - 1))).toFixed(4) : 0
      }
    };
  }

  /**
   * Extract all raw import / require / include statements from file text
   */
  static extractImports(content, filePath) {
    const ext = this.getFileExtension(filePath).toLowerCase();
    const imports = [];

    // JavaScript / TypeScript / JSX / TSX / Vue / Svelte
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(ext)) {
      // ES6 Static Imports: import ... from '...' OR import '...'
      const esmRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|export\s+(?:[\w*\s{},]*\s+from\s+)['"]([^'"]+)['"])/g;
      let match;
      while ((match = esmRegex.exec(content)) !== null) {
        const specifier = match[1] || match[2];
        if (specifier) imports.push({ specifier, type: 'esm' });
      }

      // Dynamic import: import('...')
      const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        if (match[1]) imports.push({ specifier: match[1], type: 'dynamic' });
      }

      // CommonJS: require('...')
      const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = cjsRegex.exec(content)) !== null) {
        if (match[1]) imports.push({ specifier: match[1], type: 'cjs' });
      }
    }

    // Python: import x OR from x import y
    if (ext === 'py') {
      const pyFromRegex = /from\s+([\w.]+)\s+import/g;
      let match;
      while ((match = pyFromRegex.exec(content)) !== null) {
        imports.push({ specifier: match[1].replace(/\./g, '/'), type: 'python' });
      }
      const pyImportRegex = /^\s*import\s+([\w, ]+)/gm;
      while ((match = pyImportRegex.exec(content)) !== null) {
        const modules = match[1].split(',').map(m => m.trim());
        modules.forEach(m => imports.push({ specifier: m.replace(/\./g, '/'), type: 'python' }));
      }
    }

    // C / C++: #include "..." or #include <...>
    if (['c', 'cpp', 'h', 'hpp', 'cc', 'cxx'].includes(ext)) {
      const cIncludeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
      let match;
      while ((match = cIncludeRegex.exec(content)) !== null) {
        imports.push({ specifier: match[1], type: 'c_include' });
      }
    }

    // Rust: use crate::... or mod ...;
    if (ext === 'rs') {
      const rustUseRegex = /use\s+((?:crate|super|[a-zA-Z0-9_]+)::[a-zA-Z0-9_:]+)/g;
      let match;
      while ((match = rustUseRegex.exec(content)) !== null) {
        const pathPart = match[1].replace(/::/g, '/');
        imports.push({ specifier: pathPart, type: 'rust' });
      }
      const rustModRegex = /mod\s+([a-zA-Z0-9_]+);/g;
      while ((match = rustModRegex.exec(content)) !== null) {
        imports.push({ specifier: `./${match[1]}`, type: 'rust_mod' });
      }
    }

    // CSS / SCSS: @import "..."
    if (['css', 'scss', 'less'].includes(ext)) {
      const cssImportRegex = /@import\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = cssImportRegex.exec(content)) !== null) {
        imports.push({ specifier: match[1], type: 'css' });
      }
    }

    return imports;
  }

  /**
   * Resolve a relative or alias import specifier to a canonical file in fileMap
   */
  static resolvePath(sourcePath, specifier, fileMap) {
    if (!specifier) return null;

    // Handle relative imports (./ or ../)
    if (specifier.startsWith('.')) {
      const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
      const parts = sourceDir ? sourceDir.split('/') : [];
      const specParts = specifier.split('/');

      for (const part of specParts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
          parts.pop();
        } else {
          parts.push(part);
        }
      }

      const resolvedBase = parts.join('/');
      return this.matchFileInMap(resolvedBase, fileMap);
    }

    // Handle alias imports like @/ or ~/ or src/
    if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
      const cleanSpec = 'src/' + specifier.substring(2);
      return this.matchFileInMap(cleanSpec, fileMap);
    }

    // Direct match against root/src paths
    return this.matchFileInMap(specifier, fileMap);
  }

  /**
   * Test direct extensions (.js, .ts, etc.) against the file registry
   */
  static matchFileInMap(path, fileMap) {
    const candidates = [
      path,
      `${path}.js`,
      `${path}.ts`,
      `${path}.jsx`,
      `${path}.tsx`,
      `${path}.py`,
      `${path}.c`,
      `${path}.h`,
      `${path}.rs`,
      `${path}/index.js`,
      `${path}/index.ts`
    ];

    for (const candidate of candidates) {
      const norm = this.normalizePath(candidate);
      if (fileMap.has(norm)) {
        return fileMap.get(norm).path;
      }
      if (fileMap.has(norm.toLowerCase())) {
        return fileMap.get(norm.toLowerCase()).path;
      }
    }

    return null;
  }

  /**
   * Clean and normalize file path
   */
  static normalizePath(path) {
    return (path || '').replace(/\\/g, '/').replace(/^\/+/, '');
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename) {
    if (!filename) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot + 1);
  }

  /**
   * Calculate Lines of Code (LOC) and complexity estimate
   */
  static analyzeCodeMetrics(content, language = '') {
    if (!content) return { loc: 0, commentLines: 0, blankLines: 0, codeLines: 0, complexity: 1 };
    
    const lines = content.split('\n');
    let blankLines = 0;
    let commentLines = 0;
    let codeLines = 0;
    let complexity = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
        // Estimate cyclomatic complexity by keywords
        if (/\b(if|else if|for|while|switch|case|catch|\?\?|\?|&&|\|\|)\b/.test(trimmed)) {
          complexity++;
        }
      }
    }

    return {
      loc: lines.length,
      codeLines,
      commentLines,
      blankLines,
      complexity
    };
  }
}
