import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend talks to the backend using relative /api URLs.
// In development, Vite runs on :5173 and proxies those calls to the
// Express server on :3001. This is what keeps the API key on the server:
// the browser never knows the real model endpoint or the key.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
