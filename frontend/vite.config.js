import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Windows için KRİTİK ayar
    },
    host: true, // Docker için gerekli
    strictPort: true,
    port: 5173, 
  }
})