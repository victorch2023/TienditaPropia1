import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev: absolute `/TienditaPropia1/` (same as github.io).
 * Build: relative `./` so `<base href>` in index.html can resolve assets
 * both at github.io/TienditaPropia1/ and at custom domain root (/).
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/TienditaPropia1/' : './',
}))
