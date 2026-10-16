import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_CALENDLY_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_CALENDLY_URL || env.NEXT_PUBLIC_CALENDLY_URL || ''
      ),
      'process.env.NEXT_PUBLIC_GST_RATE': JSON.stringify(
        process.env.NEXT_PUBLIC_GST_RATE || env.NEXT_PUBLIC_GST_RATE || ''
      ),
      'process.env.FALLBACK_USD_INR': JSON.stringify(
        process.env.FALLBACK_USD_INR || env.FALLBACK_USD_INR || '86.50'
      )
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
