import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/minesweeper-evolved/',
  plugins: [react()],
  server: {
    port: 3000,
  },
});
