import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/palestine/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Native Windows watchers can throw EBUSY while large textures are copied.
    watch: { usePolling: true, interval: 350, awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 } },
  },
})
