import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@x-filter/core', '@x-filter/react', '@x-filter/shadcn', '@x-filter/antd'],
  },
  server: {
    watch: {
      // 监听 packages 目录变化以支持 HMR
      ignored: ['!**/node_modules/@x-filter/**'],
    },
  },
});
