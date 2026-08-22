import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Any request to /api will be forwarded to the Spring Boot backend
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
