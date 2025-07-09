import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/NCNS/',
  plugins: [react()],
  optimizeDeps: {
    include: ['maplibre-gl', 'react-map-gl']
  },
  resolve: {
    alias: {
      'maplibre-gl': 'maplibre-gl'
    }
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "maplibre-gl/dist/maplibre-gl.css";`
      }
    }
  }
}) 