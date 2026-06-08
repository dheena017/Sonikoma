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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        },
        '/media': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        }
      }
    },
  };
});
