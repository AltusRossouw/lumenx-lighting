import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // OrbitX planner ships TypeScript source; let Vite pre-bundle it.
    optimizeDeps: {
      include: ['@orbitx/planner'],
    },
    build: {
      rollupOptions: {
        // The DWG converter loads its WASM at runtime from /wasm/.
        external: [/^\/wasm\//],
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API calls to the Express/PostgreSQL backend during development.
      proxy: {
        '/api': {
          target: process.env.API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
