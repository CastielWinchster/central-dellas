import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SW_BUILD_ID } from './src/config/swVersion.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const appJsonPath = path.resolve(__dirname, 'base44/.app.jsonc')
const base44AppId = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).id
const base44AppBaseUrl =
  process.env.VITE_BASE44_APP_BASE_URL || 'https://centraldellas.base44.app'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  define: {
    __SW_BUILD_ID__: JSON.stringify(SW_BUILD_ID),
    'import.meta.env.VITE_BASE44_APP_ID': JSON.stringify(
      process.env.VITE_BASE44_APP_ID || base44AppId,
    ),
    'import.meta.env.VITE_BASE44_APP_BASE_URL': JSON.stringify(
      process.env.VITE_BASE44_APP_BASE_URL || base44AppBaseUrl,
    ),
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
          let sw = fs.readFileSync(swPath, 'utf8')
          const expectedVersion = `centraldellas-v${SW_BUILD_ID}`
          if (!sw.includes(expectedVersion)) {
            sw = sw.replace(/centraldellas-v\d+/g, expectedVersion)
            fs.writeFileSync(swPath, sw)
            console.warn('[build] sw.js version sincronizada para', expectedVersion)
          }
        }
      },
    },
  ]
})
