import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use /ma-finance/ base only for GitHub Pages; Render serves from root /
const base = process.env.GITHUB_PAGES === 'true' ? '/ma-finance/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
