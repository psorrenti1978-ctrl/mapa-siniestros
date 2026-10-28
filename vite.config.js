import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // deck.gl y maplibre son librerías grandes; esto solo evita un aviso en la consola.
  build: { chunkSizeWarningLimit: 2500 },
});
