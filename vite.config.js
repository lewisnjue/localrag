import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '5173-lewisnjue-ragfrontend-kvcd04kulng.ws-eu118.gitpod.io'
    ]
  },
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // Ensures assets are properly copied
  },
});
