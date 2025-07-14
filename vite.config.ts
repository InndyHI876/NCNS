import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/NCNS/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
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