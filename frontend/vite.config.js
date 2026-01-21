import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // Izinkan akses dari IP luar
    allowedHosts: true,  // JURUS RAHASIA: Izinkan SEMUA link (ngrok, wifi, dll)
  }
})