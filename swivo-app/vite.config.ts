import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const wpUrl = env.VITE_WP_API_URL || 'http://localhost/swivo';
  const base = env.VITE_BASE || '/';
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      open: false,
      host: '127.0.0.1',
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 200,
      },
      hmr: {
        host: 'localhost',
        port: 5173,
        protocol: 'ws',
        overlay: true,
      },
      proxy: {
        // Proxy WP REST in dev so SPA can hit /wp-json/* without CORS pain.
        '/wp-json': {
          target: wpUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    ssr: {
      // Bundle our seed data into the SSR build so the prerender script can
      // import it directly from `dist-server/seeds.js`.
      noExternal: ['react-helmet-async', 'react-router-dom'],
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        input: undefined,
        output: {
          // Découpe en chunks logiques pour limiter le bundle initial.
          manualChunks: (id) => {
            if (!id.includes('node_modules')) {
              // Code applicatif : isole les modules lourds.
              if (id.includes('/lib/formalites/')) return 'formalites';
              if (id.includes('/lib/billing')) return 'billing';
              if (id.includes('/components/FormalitesWizard')) return 'wizard';
              return undefined;
            }
            // Vendors
            if (id.includes('tesseract.js')) return 'vendor-tesseract';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-helmet')) return 'vendor-helmet';
            if (id.includes('/react-dom/') || id.includes('\\react-dom\\')) return 'vendor-react-dom';
            if (id.includes('/react/') || id.includes('\\react\\')) return 'vendor-react';
            return 'vendor';
          },
        },
      },
    },
  };
});
