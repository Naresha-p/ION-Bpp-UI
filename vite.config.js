import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bpp-admin/',
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api/bpp-ui': {
        target:       'https://tsp.nearshop.in',
        changeOrigin: true,
        secure:       true,
        rewrite:      (path) => path.replace(/^\/api\/bpp-ui/, '/bpp-ui'),
      },
    },
  },
})

