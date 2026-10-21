import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, /api calls are forwarded to the Express backend,
    // so the browser never hits CORS and no URL needs configuring.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
