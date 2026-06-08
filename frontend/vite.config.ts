import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    root: path.resolve(__dirname),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react-core';
              }
              if (id.includes('lucide') || id.includes('icons')) {
                return 'vendor-icons';
              }
              return 'vendor-libs';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5173',
          changeOrigin: true,
          secure: false,
          ws: false, // Ensure EventSource (SSE) isn't treated as a websocket
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy, _options) => {
            proxy.on('error', (err: any, req: any) => {
              console.error('[Vite Proxy] /api proxy error:', err && err.message ? err.message : err);
            });
          }
        },
        '/media': {
          target: 'http://127.0.0.1:5173',
          changeOrigin: true,
          secure: false,
          ws: false,
          proxyTimeout: 0,
          timeout: 0,
        }
      }
    },
  };
});
