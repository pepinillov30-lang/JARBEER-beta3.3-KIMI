import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías de visualización y animación (pesadas, usadas en múltiples pantallas)
          'vendor-viz': ['recharts', 'framer-motion'],
        },
      },
    },
  },
});
