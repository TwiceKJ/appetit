import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss()],
  // O navegador chama o Vite; o proxy encaminha a API ao Spring sem CORS local.
  server: { proxy: { '/api': 'http://localhost:8080' } },
  preview: { proxy: { '/api': 'http://localhost:8080' } },
})
