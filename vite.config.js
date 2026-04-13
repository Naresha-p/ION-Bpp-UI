import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bpp-admin/',
  server: {
    port: 5173,
    proxy: {
      // BPP UI REST API (dashboard, orders, catalog)
      '/api/bpp-ui': {
        target:       'https://tsp.nearshop.in',
        changeOrigin: true,
        secure:       true,
        rewrite:      (path) => path.replace(/^\/api\/bpp-ui/, '/bpp-ui'),
      },
    },
  },
})
