import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    
    port: 5173,
    allowedHosts: ['0f8c-2404-7c80-5c-ea51-c1c6-fd06-d7ff-be9c.ngrok-free.app'],
    proxy: {
      // Forward all /api requests to the FastAPI backend
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // Log proxy activity for debugging
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[vite-proxy] error:', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[vite-proxy]', req.method, req.url, '→ http://127.0.0.1:8000');
          });
        },
      },
      // Also proxy /health and /docs
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
