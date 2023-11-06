import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '/digit-span-practice',
    plugins: [react(), viteTsconfigPaths() , VitePWA({ registerType: 'autoUpdate' })],
    server: {    
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000  
        port: 3000, 
    },
    build: {
        // --> ["chrome79", "edge92", "firefox91", "safari13.1"]
        target: browserslistToEsbuild([{
            "production": [
              ">0.2%",
              "not dead",
              "not op_mini all"
            ],
            "development": [
              "last 1 chrome version",
              "last 1 firefox version",
              "last 1 safari version"
            ]
          }]), 
      },
})
