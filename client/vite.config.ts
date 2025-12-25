import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        // Suppress connection errors during startup (server might not be ready yet)
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Only suppress ECONNREFUSED during startup
            if (err.code === 'ECONNREFUSED') {
              // Socket.IO will retry automatically, so this is harmless
              return;
            }
            console.log('proxy error', err);
          });
        },
      },
    },
  },
});

