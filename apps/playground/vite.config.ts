import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: false
  },
  resolve: {
    preserveSymlinks: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  build: {
    outDir: 'dist'
  }
});
