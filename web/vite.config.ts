import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
