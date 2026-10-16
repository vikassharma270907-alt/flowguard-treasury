import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function guidePdfPlugin() {
  return {
    name: 'guide-pdf-validator',
    buildStart() {
      const siteConfigPath = path.resolve(import.meta.dirname, 'src/siteConfig.js')
      let enabled = true
      if (fs.existsSync(siteConfigPath)) {
        const content = fs.readFileSync(siteConfigPath, 'utf-8')
        const match = content.match(/guidePdf:\s*\{[\s\S]*?enabled:\s*(true|false)/)
        if (match && match[1] === 'false') {
          enabled = false
        }
      }

      if (enabled) {
        const pdfPath = path.resolve(import.meta.dirname, 'public/docs/flowguard-guide.pdf')
        if (!fs.existsSync(pdfPath)) {
          throw new Error(
            "BUILD FAILED: siteConfig.guidePdf is enabled, but '/docs/flowguard-guide.pdf' is missing at client/public/docs/flowguard-guide.pdf! Please provide the guide PDF before building."
          )
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Resolve guide PDF build-time size label
  const pdfPath = path.resolve(import.meta.dirname, 'public/docs/flowguard-guide.pdf')
  const pdfExists = fs.existsSync(pdfPath)
  let computedSizeLabel = '23 KB'
  if (pdfExists) {
    const stats = fs.statSync(pdfPath)
    computedSizeLabel = `${Math.round(stats.size / 1024)} KB`
  }

  return {
    plugins: [react(), guidePdfPlugin()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_CALENDLY_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_CALENDLY_URL || env.NEXT_PUBLIC_CALENDLY_URL || ''
      ),
      '__GUIDE_PDF_SIZE_LABEL__': JSON.stringify(computedSizeLabel),
      '__GUIDE_PDF_EXISTS__': JSON.stringify(pdfExists)
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

