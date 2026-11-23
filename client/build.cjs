const esbuild = require('esbuild-wasm');
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// Patch wasm_exec getRandomData if needed
const wasmExecPath = require.resolve('esbuild-wasm/wasm_exec.js');
let wasmExec = fs.readFileSync(wasmExecPath, 'utf8');
if (!wasmExec.includes('/* PATCHED_ENTROPY */')) {
  wasmExec = wasmExec.replace(
    'crypto.getRandomValues(loadSlice(sp + 8));',
    '/* PATCHED_ENTROPY */ try { crypto.getRandomValues(loadSlice(sp + 8)); } catch (e) { const s = loadSlice(sp + 8); for (let i=0; i<s.length; i++) s[i] = (Math.random()*256)|0; }'
  );
  fs.writeFileSync(wasmExecPath, wasmExec);
}

async function run() {
  console.log('Initializing WebAssembly esbuild...');
  await esbuild.initialize({});
  console.log('WASM initialized successfully!');

  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Build JS bundle with maximum TV compatibility:
  // - format: 'iife' (runs on all Smart TV browsers without requiring ES module support)
  // - target: 'chrome58' (downlevels optional chaining ?., nullish coalescing ??, arrow functions)
  console.log('Bundling JavaScript with esbuild-wasm (TV compatible)...');
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'main.jsx')],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'iife',
    globalName: 'Phone2TVApp',
    target: ['es2019'],
    outfile: path.join(distDir, 'index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
      'global': 'window'
    },
    loader: {
      '.jsx': 'jsx',
      '.js': 'js',
      '.css': 'css'
    }
  });
  console.log('JS Bundle created successfully!');

  // 2. Build Tailwind CSS with explicit absolute content paths
  console.log('Processing Tailwind CSS...');
  const cssInputPath = path.join(__dirname, 'src', 'index.css');
  const cssInput = fs.readFileSync(cssInputPath, 'utf8');
  
  const cssResult = await postcss([
    tailwindcss({
      content: [
        path.join(__dirname, 'index.html').replace(/\\/g, '/'),
        path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/')
      ],
      theme: {
        extend: {
          colors: {
            background: '#09090B',
            card: '#18181B',
            cardHover: '#27272A',
            cardBorder: '#27272A',
            primary: {
              DEFAULT: '#6366F1',
              hover: '#4F46E5',
              light: '#818CF8',
              glow: 'rgba(99, 102, 241, 0.4)'
            },
            tvFocus: '#818CF8',
            textPrimary: '#FAFAFA',
            textSecondary: '#A1A1AA',
            success: '#10B981',
            danger: '#EF4444'
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
          },
          boxShadow: {
            'tv-focus': '0 0 0 4px #818CF8, 0 8px 30px rgba(99, 102, 241, 0.5)',
            'tv-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
            'glow': '0 0 20px rgba(99, 102, 241, 0.35)'
          },
          animation: {
            'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'fade-in': 'fadeIn 0.25s ease-out',
            'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' }
            },
            slideUp: {
              '0%': { transform: 'translateY(12px)', opacity: '0' },
              '100%': { transform: 'translateY(0)', opacity: '1' }
            }
          }
        }
      }
    }),
    autoprefixer()
  ]).process(cssInput, {
    from: cssInputPath,
    to: path.join(distDir, 'index.css')
  });

  fs.writeFileSync(path.join(distDir, 'index.css'), cssResult.css);
  console.log(`Tailwind CSS compiled successfully! (${(cssResult.css.length / 1024).toFixed(1)} KB)`);

  // 3. Create dist/index.html with classic script (NO type="module")
  let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  indexHtml = indexHtml
    .replace('</head>', '  <link rel="stylesheet" href="/index.css" />\n  </head>')
    .replace('<script type="module" src="/src/main.jsx"></script>', '<script defer src="/index.js"></script>');

  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
  console.log('dist/index.html created successfully!');
  console.log('=== Build Complete! ===');
}

run().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
