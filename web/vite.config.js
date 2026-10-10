import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds ONE self-contained ES module bundle (public/app/main.js) shared by
// every React-migrated page — the existing vanilla-JS shell
// (public/js/app.js) dynamically imports it for both #/dashboard and
// #/tasks, each resolving a different named mount/unmount export (see
// src/main.jsx). Started as a Dashboard-only bundle in Phase 1
// (public/dashboard/main.js); renamed and consolidated in Phase 2 once
// Tasks became a second page, so React/ReactDOM ships once, not twice — see
// PHASE_2_TASKS_MIGRATION_REPORT.md §15. No dev server / HMR wiring yet —
// see PHASE_1_REACT_FOUNDATION_REPORT.md ("Routing" / "Architecture") for
// why that tradeoff was made deliberately, still true here.
//
// Deliberately does NOT bundle any CSS: every migrated page reuses the
// exact existing global stylesheets (tokens/base/components/layout/pages
// .css) already loaded by public/index.html, via the same class names the
// vanilla pages used — this guarantees visual parity with zero redesign
// risk and zero style duplication.
export default defineConfig({
  plugins: [react()],
  // Without this, react-dom's CJS entry (`if (NODE_ENV === 'production')
  // require(prod) else require(dev)`) can't be statically dead-code-
  // eliminated in lib mode, and BOTH react-dom.production.min.js AND the
  // much larger react-dom.development.js end up bundled — ~5x the expected
  // size. Found by inspecting the built output during this phase (759KB /
  // 180KB gzip before this fix).
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
    // Vite's lib-mode build does not minify by default (unlike its regular
    // app-build mode) — without this the bundle ships React's own
    // pre-minified production build wrapped in unminified Vite/esbuild
    // module glue, which measurably bloats the one file every dashboard
    // load fetches.
    minify: true,
    lib: {
      entry: 'src/main.jsx',
      formats: ['es'],
      fileName: () => 'main.js',
    },
    // React/ReactDOM are bundled in (not externalized) so this stays a
    // single <script type="module"> import with no separate vendor chunk
    // or import-map wiring to maintain. Still bundled once total, not once
    // per page, since Dashboard and Tasks now share this one output file.
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
