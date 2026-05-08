// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'] // ✅ ensures only one React instance
  },
  server: {
    port: 5173, // frontend dev server
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // backend dev server
        changeOrigin: true,
        secure: false,
      },
    },
  },
})