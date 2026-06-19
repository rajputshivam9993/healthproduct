import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config with the `@` path alias matching tsconfig (Req 20.6).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
