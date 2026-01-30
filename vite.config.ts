import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to your repo name for GitHub Pages (e.g., '/swift/')
  // Or '/' if deploying to a custom domain or root
  base: process.env.NODE_ENV === 'production' ? '/Swift/' : '/',
})
