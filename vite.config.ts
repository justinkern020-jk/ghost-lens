import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  server: {
    host: true,
    // WebXR / getUserMedia on Pixel over LAN needs HTTPS:
    //   npm run dev -- --https
    // or use a tunnel. localhost is treated as secure.
  },
  build: {
    target: 'es2022',
  },
})
