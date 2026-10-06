import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Explicitly set to root path for SPA routing
  logLevel: 'error', // Suppress warnings, only show errors
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
  ],
  server: {
    port: 3000,
    host: true,
    historyApiFallback: true
  }
});