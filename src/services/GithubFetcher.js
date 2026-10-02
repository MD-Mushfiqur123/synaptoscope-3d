/**
 * SynaptoScope 3D - GitHub Repository Importer & Tree Fetcher
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Fetches recursive Git trees, file sizes, and raw sources with rate-limit handling and token support.
 */

import { ASTParser } from './ASTParser.js';

export class GithubFetcher {
  constructor() {
    this.token = localStorage.getItem('synaptoscope_github_token') || '';
    this.cache = new Map();
  }

  setToken(token) {
    this.token = (token || '').trim();
    if (this.token) {
      localStorage.setItem('synaptoscope_github_token', this.token);
    } else {
      localStorage.removeItem('synaptoscope_github_token');
    }
  }

  getToken() {
    return this.token;
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SynaptoScope-3D-MdMushfiqurRahim'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Parse owner and repository name from various input formats:
   * e.g. "MD-Mushfiqur123/orion-space", "https://github.com/facebook/react", "torvalds/linux.git"
   */
  parseRepoString(input) {
    if (!input) return null;
    let clean = input.trim().replace(/\/+$/, '');
    
    // Check if full URL
    const urlMatch = clean.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace(/\.git$/i, '')
      };
    }

    // Owner/Repo format
    const parts = clean.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return {
        owner: parts[0].trim(),
        repo: parts[1].replace(/\.git$/i, '').trim()
      };
    }

    return null;
  }

  /**
   * Fetch complete repository tree and sample source files
   */
  async fetchRepository(repoInput, onProgress = () => {}) {
    const parsed = this.parseRepoString(repoInput);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository format: "${repoInput}". Expected "owner/repo" or GitHub URL.`);
    }

    const { owner, repo } = parsed;
    const cacheKey = `repo_${owner}_${repo}`;

    onProgress({ status: 'Connecting to GitHub API...', progress: 10 });

    // Step 1: Fetch Repo Meta
    const metaUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const metaRes = await fetch(metaUrl, { headers: this.getHeaders() });
    
    if (!metaRes.ok) {
      if (metaRes.status === 403 || metaRes.status === 429) {
        const resetHeader = metaRes.headers.get('x-ratelimit-reset');
        const resetTime = resetHeader ? new Date(parseInt(resetHeader) * 1000).toLocaleTimeString() : 'soon';
        throw new Error(`GitHub API rate limit exceeded. Please provide a GitHub Personal Access Token in HUD settings or wait until ${resetTime}.`);
      }
      if (metaRes.status === 404) {
        throw new Error(`Repository "${owner}/${repo}" not found or is private.`);
      }
      throw new Error(`GitHub API error (${metaRes.status}): ${metaRes.statusText}`);
    }

    const metaData = await metaRes.json();
    const defaultBranch = metaData.default_branch || 'main';

    onProgress({ status: `Fetching recursive file tree (${defaultBranch})...`, progress: 35 });

    // Step 2: Fetch Git Tree recursively
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: this.getHeaders() });
    
    if (!treeRes.ok) {
      throw new Error(`Failed to fetch file tree for ${owner}/${repo}: ${treeRes.statusText}`);
    }

    const treeData = await treeRes.json();
    if (!treeData.tree || !Array.isArray(treeData.tree)) {
      throw new Error(`Repository tree is empty or corrupted.`);
    }

    // Step 3: Filter code files (ignore huge binaries, .git, images, etc.)
    const codeFiles = treeData.tree.filter(item => {
      if (item.type !== 'blob') return false;
      const path = item.path.toLowerCase();
      // Skip binary / heavy assets
      if (path.match(/\.(png|jpg|jpeg|gif|webp|ico|svg|pdf|zip|tar|gz|exe|dll|so|dylib|wasm|bin|mp4|webm|mp3|woff|woff2|ttf|eot)$/i)) {
        return false;
      }
      // Skip vendor / lock / minified bundles if huge
      if (path.includes('node_modules/') || path.includes('vendor/') || path.includes('.git/') || path.endsWith('.min.js')) {
        return false;
      }
      return true;
    });

    onProgress({ status: `Discovered ${codeFiles.length} source nodes. Reading samples...`, progress: 60 });

    // Step 4: Fetch raw content for top architectural files (up to 35 files) to build laser AST links
    const maxFilesToFetch = Math.min(codeFiles.length, 35);
    const topFiles = [...codeFiles]
      .sort((a, b) => {
        // Prioritize entry files, config, and moderate size files
        const score = (p) => {
          if (p.includes('index.') || p.includes('main.') || p.includes('app.')) return 100;
          if (p.endsWith('.js') || p.endsWith('.ts') || p.endsWith('.py') || p.endsWith('.rs') || p.endsWith('.c')) return 50;
          return 10;
        };
        return score(b.path) - score(a.path);
      })
      .slice(0, maxFilesToFetch);

    const fetchedFiles = await Promise.all(
      topFiles.map(async (item, index) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
          const res = await fetch(rawUrl);
          if (res.ok) {
            const content = await res.text();
            const metrics = ASTParser.analyzeCodeMetrics(content, item.path);
            return {
              path: item.path,
              size: item.size || content.length,
              loc: metrics.loc,
              codeLines: metrics.codeLines,
              complexity: metrics.complexity,
              language: this.detectLanguage(item.path),
              content: content.slice(0, 50000), // Cap at 50KB for fast browser memory
              sha: item.sha,
              url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${item.path}`
            };
          }
        } catch (e) {
          console.warn(`Could not fetch raw source for ${item.path}`, e);
        }
        return {
          path: item.path,
          size: item.size || 1000,
          loc: Math.round((item.size || 1000) / 35),
          language: this.detectLanguage(item.path),
          url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${item.path}`
        };
      })
    );

    // Merge fetched and remaining files
    const fetchedMap = new Map(fetchedFiles.map(f => [f.path, f]));
    const allFiles = codeFiles.map(item => {
      if (fetchedMap.has(item.path)) {
        return fetchedMap.get(item.path);
      }
      return {
        path: item.path,
        size: item.size || 500,
        loc: Math.max(10, Math.round((item.size || 500) / 35)),
        language: this.detectLanguage(item.path),
        sha: item.sha,
        url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${item.path}`
      };
    });

    onProgress({ status: 'Building AST Dependency Graph...', progress: 90 });

    const astGraph = ASTParser.parseDependencies(allFiles);

    onProgress({ status: 'Visualizing 3D Code City...', progress: 100 });

    return {
      name: `${owner}/${repo}`,
      label: metaData.name || repo,
      description: metaData.description || 'GitHub Repository',
      stars: metaData.stargazers_count || 0,
      forks: metaData.forks_count || 0,
      language: metaData.language || 'Multiple',
      defaultBranch,
      files: astGraph.nodes,
      links: astGraph.links,
      stats: astGraph.stats,
      ownerInfo: {
        avatarUrl: metaData.owner?.avatar_url,
        login: metaData.owner?.login,
        htmlUrl: metaData.html_url
      }
    };
  }

  /**
   * Fetch single raw file content when clicked in Inspector
   */
  async fetchFileContent(owner, repo, branch, filePath) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const res = await fetch(rawUrl);
    if (!res.ok) {
      throw new Error(`Failed to load file content (${res.status}): ${res.statusText}`);
    }
    return await res.text();
  }

  /**
   * Detect programming language by file extension
   */
  detectLanguage(filename) {
    const ext = ASTParser.getFileExtension(filename).toLowerCase();
    const map = {
      js: 'JavaScript',
      jsx: 'React JSX',
      ts: 'TypeScript',
      tsx: 'React TSX',
      py: 'Python',
      rb: 'Ruby',
      rs: 'Rust',
      go: 'Go',
      c: 'C',
      cpp: 'C++',
      h: 'C Header',
      hpp: 'C++ Header',
      cs: 'C#',
      java: 'Java',
      kt: 'Kotlin',
      swift: 'Swift',
      php: 'PHP',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      less: 'LESS',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      sh: 'Shell',
      bash: 'Bash',
      zsh: 'Zsh',
      ps1: 'PowerShell',
      sql: 'SQL',
      glsl: 'GLSL Shader',
      vert: 'GLSL Vertex',
      frag: 'GLSL Fragment',
      dockerfile: 'Docker',
      makefile: 'Makefile',
      toml: 'TOML',
      xml: 'XML',
      svg: 'SVG'
    };
    return map[ext] || 'Text';
  }
}
