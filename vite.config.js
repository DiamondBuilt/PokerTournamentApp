import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/PokerTournamentApp/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
