import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/generative-music-sequencer/',
  plugins: [react()],
  optimizeDeps: {
    // Force Vite to pre-bundle Tone.js for reliable ESM resolution
    include: ['tone'],
  },
})
