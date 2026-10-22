import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Fester Port, weil Keycloak genau diese Redirect-URI kennt (infra/keycloak/debate-realm.json)
    port: 5173,
    strictPort: true,
    // API-Aufrufe gehen an das manuell gestartete Spring-Boot-Backend, dadurch kein CORS nötig
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
