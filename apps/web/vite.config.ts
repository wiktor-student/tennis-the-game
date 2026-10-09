import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // The engine (simulation + content) changes less often than the UI.
        manualChunks: {
          engine: ['@ttg/engine'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
