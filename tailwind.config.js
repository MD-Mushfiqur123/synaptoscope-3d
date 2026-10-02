/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#05070e',
          card: 'rgba(10, 15, 30, 0.75)',
          border: 'rgba(0, 240, 255, 0.25)',
          neonCyan: '#00f0ff',
          neonPink: '#ff007f',
          neonGreen: '#00ff88',
          neonAmber: '#ffb700',
          neonPurple: '#9d00ff',
          glowBlue: '#0070f3',
          darkBlue: '#0a0e1a',
          panel: 'rgba(8, 12, 24, 0.85)',
          panelHeader: 'rgba(15, 23, 42, 0.95)'
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        cyber: ['"Orbitron"', '"Rajdhani"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.35)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.35)',
        'neon-amber': '0 0 15px rgba(255, 183, 0, 0.35)',
        'neon-purple': '0 0 15px rgba(157, 0, 255, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'glitch': 'glitch 1s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.8))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0,240,255,0.3))' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
