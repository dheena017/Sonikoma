import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'));
  const backendPort = env.BACKEND_PORT || '5173';
  const backendTarget = `http://127.0.0.1:${backendPort}`;

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
      port: parseInt(env.FRONTEND_PORT || '3000', 10),
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: false, // Ensure EventSource (SSE) isn't treated as a websocket
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy, _options) => {
            proxy.removeAllListeners('error');
            proxy.on('error', (err: any, req: any, res: any) => {
              const isSystemLogs = req?.url?.includes('system-logs');
              if (!isSystemLogs) {
                console.error('\x1b[31m[Vite Proxy]\x1b[0m \x1b[33m/api proxy error:\x1b[0m', err && err.message ? err.message : err);
              }
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'Proxy Error',
                  message: err && err.message ? err.message : String(err)
                }));
              }
            });
          }
        },
        '/media': {
          target: backendTarget,
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
