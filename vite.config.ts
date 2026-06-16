import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'public',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});