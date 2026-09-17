import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Dev 프록시: 프론트는 /api/v1 로 호출, 로컬 백엔드(8080)로 우회시킨다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This source tree is TypeScript-first. Keep stale compiler artifacts from
    // shadowing a same-named .ts/.tsx module during extensionless imports.
    extensions: ['.mjs', '.mts', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/files': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
