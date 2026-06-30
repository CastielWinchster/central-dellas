import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SW_BUILD_ID } from './src/config/swVersion.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  define: {
    __SW_BUILD_ID__: JSON.stringify(SW_BUILD_ID),
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
    {
      name: 'centraldellas-deploy-version',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const payload = {
          swBuildId: SW_BUILD_ID,
          swVersion: `centraldellas-v${SW_BUILD_ID}`,
          builtAt: new Date().toISOString(),
        }
        fs.writeFileSync(
          path.join(distDir, 'deploy-version.json'),
          `${JSON.stringify(payload, null, 2)}\n`,
        )
        const swPath = path.join(distDir, 'sw.js')
        if (fs.existsSync(swPath)) {
          const sw = fs.readFileSync(swPath, 'utf8')
          if (!sw.includes(`centraldellas-v${SW_BUILD_ID}`)) {
            console.warn('[build] public/sw.js não contém a versão esperada v' + SW_BUILD_ID)
          }
        }
      },
    },
  ]
})
