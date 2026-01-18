import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const DEFAULT_API_TARGET = 'http://localhost:9000'

const resolveProxyTarget = (apiBase?: string) => {
  if (!apiBase) {
    return DEFAULT_API_TARGET
  }
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase
  }
  return DEFAULT_API_TARGET
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = resolveProxyTarget(env.VITE_API_BASE_URL)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
