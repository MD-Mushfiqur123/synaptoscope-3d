import * as THREE from 'three';

export class HeatmapShaders {
  static LANGUAGES = {
    js: { name: 'JavaScript', color: 0xf7df1e, emissive: 0x807000 },
    mjs: { name: 'JavaScript', color: 0xf7df1e, emissive: 0x807000 },
    ts: { name: 'TypeScript', color: 0x3178c6, emissive: 0x104080 },
    tsx: { name: 'React TS', color: 0x00d8ff, emissive: 0x006680 },
    jsx: { name: 'React JS', color: 0x61dafb, emissive: 0x1a7080 },
    py: { name: 'Python', color: 0xffd43b, emissive: 0x806010 },
    rs: { name: 'Rust', color: 0xdea584, emissive: 0x804020 },
    go: { name: 'Go', color: 0x00add8, emissive: 0x005570 },
    json: { name: 'JSON', color: 0x22c55e, emissive: 0x106030 },
    html: { name: 'HTML', color: 0xe34f26, emissive: 0x702010 },
    css: { name: 'CSS', color: 0xa855f7, emissive: 0x501080 },
    scss: { name: 'SCSS', color: 0xec4899, emissive: 0x701040 },
    md: { name: 'Markdown', color: 0x94a3b8, emissive: 0x303540 },
    sql: { name: 'SQL', color: 0x06b6d4, emissive: 0x035060 },
    default: { name: 'General Code', color: 0x64748b, emissive: 0x202530 }
  };

  /**
   * Get Language Palette info by file extension
   */
  static getLanguageInfo(ext) {
    const cleanExt = (ext || '').replace(/^\./, '').toLowerCase();
    return this.LANGUAGES[cleanExt] || this.LANGUAGES.default;
  }

  /**
   * Mode 1: Language Matrix Material (PBR MeshStandardMaterial with high metallic/roughness cyber look)
   */
  static createLanguageMaterial(ext, opacity = 1.0) {
    const info = this.getLanguageInfo(ext);
    return new THREE.MeshStandardMaterial({
      color: info.color,
      emissive: info.emissive,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.8,
      transparent: opacity < 1.0,
      opacity: opacity
    });
  }

  /**
   * Mode 2: Complexity Heatmap Material (Green -> Yellow -> Orange -> Red gradient based on LOC/Cyclomatic)
   */
  static createComplexityMaterial(loc = 50, complexityScore = 1) {
    // loc: 0 to 1000+
    const t = Math.min(1.0, Math.max(0.0, loc / 600.0));
    
    // Custom gradient lerp: 0.0 (Cyan/Green #10b981) -> 0.5 (Amber/Yellow #f59e0b) -> 1.0 (Crimson/Red #ef4444)
    const color = new THREE.Color();
    if (t < 0.5) {
      // Green to Yellow
      color.setRGB(
        0.06 + (0.96 - 0.06) * (t * 2),
        0.72 + (0.62 - 0.72) * (t * 2),
        0.50 + (0.04 - 0.50) * (t * 2)
      );
    } else {
      // Yellow to Red
      const factor = (t - 0.5) * 2;
      color.setRGB(
        0.96 + (0.93 - 0.96) * factor,
        0.62 + (0.26 - 0.62) * factor,
        0.04 + (0.26 - 0.04) * factor
      );
    }

    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5 + t * 0.4,
      roughness: 0.2,
      metalness: 0.85
    });
  }

  /**
   * Mode 3: Recency Pulse Custom GLSL Shader Material
   */
  static createRecencyPulseShaderMaterial(recencyHours = 1) {
    const isRecent = recencyHours < 24;
    const baseColor = isRecent ? new THREE.Color(0x06b6d4) : new THREE.Color(0x334155);
    const pulseColor = isRecent ? new THREE.Color(0xf43f5e) : new THREE.Color(0x475569);

    const customUniforms = {
      uTime: { value: 0 },
      uBaseColor: { value: baseColor },
      uPulseColor: { value: pulseColor },
      uIsRecent: { value: isRecent ? 1.0 : 0.0 }
    };

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uPulseColor;
      uniform float uIsRecent;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
        float diff = max(dot(vNormal, lightDir), 0.2);
        
        // Scanline grid neon effect
        float scanline = sin(vPosition.y * 4.0 - uTime * 3.0) * 0.5 + 0.5;
        float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
        
        vec3 finalColor = uBaseColor * diff;
        if (uIsRecent > 0.5) {
          finalColor = mix(uBaseColor, uPulseColor, scanline * pulse * 0.7);
          finalColor += uPulseColor * (pulse * 0.35);
        }

        // Cyber edge glow rim
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        finalColor += vec3(0.0, 0.4, 0.8) * pow(rim, 3.0) * 0.5;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: customUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: false
    });

    material.isCustomShader = true;
    return material;
  }
}
